import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs/promises";
import path from "path";
import { formatIssueNumber, getLatestLifeIssue } from "../lib/life-issue";
import { SourceDiscovery, SuggestedReading } from "../lib/types";
import { loadSources, saveSources, newSource } from "../lib/news/sources";
import { getApiKey, getJsonModel, generateJson, groundedSearch } from "../lib/news/gemini";
import { discoverFeed, resolveRedirect } from "../lib/news/discover";
import { loadState, saveState, questionKeyOf } from "../lib/news/state";

// Search Grounding で新しい巡回候補を探す（週 1）。
// 見つけたページは即採用せず source-discoveries.json に記録し、RSS/Atom が取れたものだけ
// candidate として台帳に登録する。その後は news:sync / news:evolve の通常の流れで判定される。

const MAX_NEW_PER_RUN = 10;
const MAX_RESOLVE_PER_INTENT = 20;
// 問いが変わらない限り、探索は同じホストに当たって triedHosts で捨てられる。
// Grounding を毎週使う価値が無いので、問いが変わるか 28 日経つまで走らせない。
const REDISCOVER_DAYS = 28;
const researchDirectory = path.join(process.cwd(), "content", "research");
const discoveriesPath = path.join(researchDirectory, "source-discoveries.json");

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

async function main() {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("GEMINI_API_KEY がありません");
  const latest = await getLatestLifeIssue();
  if (!latest) throw new Error("公開済みの LIFE ISSUES がありません");

  const questionKey = questionKeyOf(latest.issue, latest.nextQuestion);
  const state = await loadState(questionKey);
  const last = state.lastDiscovery;
  const ageDays = last ? (Date.now() - Date.parse(last.at)) / (24 * 60 * 60 * 1000) : Infinity;
  if (!process.argv.includes("--force") && last?.questionKey === questionKey && ageDays < REDISCOVER_DAYS) {
    console.log(
      `Skipping discovery: same question, last run ${Math.floor(ageDays)}d ago (< ${REDISCOVER_DAYS}d). Use --force to run anyway.`
    );
    return;
  }

  const [issueSources, suggested, sources, discoveries] = await Promise.all([
    readJson<{ keywords?: string[] }>(
      path.join(process.cwd(), "content", "life-issues", "thoughts", "sources", `${formatIssueNumber(latest.issue)}.json`),
      {}
    ),
    readJson<SuggestedReading | null>(path.join(researchDirectory, "suggested.json"), null),
    loadSources(),
    readJson<SourceDiscovery[]>(discoveriesPath, []),
  ]);
  const books = suggested?.status === "published" ? suggested.items.map((i) => i.title) : [];

  // 1. 探すべき情報源の種類を検索意図にする
  const { intents } = await generateJson<{ intents: string[] }>(
    getJsonModel(apiKey, 0.5),
    `次の「問い」について継続的に読む価値のある情報源（ブログ、連載、研究機関、メディア）を探します。
Web 検索に使う検索意図を 3〜5 個作ってください。

ルール:
- 記事ではなく「情報源」を見つけるための検索にする（例: "〜 論考 連載", "〜 blog essays"）
- 日本語と英語を混ぜてよい
- 一般語だけの検索意図は作らない。固有名詞や概念名を含める
- JSON以外は出力しない

問い:
${latest.nextQuestion}

本人のメモ:
${latest.why}

キーワード:
${(issueSources.keywords ?? []).join("、") || "なし"}

読もうとしている本:
${books.map((b) => `- ${b}`).join("\n") || "なし"}

出力形式:
{"intents":["...","..."]}`
  );
  if (!Array.isArray(intents) || intents.length === 0) throw new Error("検索意図が作れませんでした");
  console.log(`Intents: ${intents.map((i) => `"${i}"`).join(", ")}`);

  // 2. Grounding で検索し、ホストごとに 1 ページ集める
  const knownHosts = new Set(sources.map((s) => new URL(s.url).host.replace(/^www\./, "")));
  const triedHosts = new Set(discoveries.map((d) => new URL(d.url).host.replace(/^www\./, "")));
  const pages: { query: string; title: string; url: string }[] = [];
  const seenHosts = new Set<string>();

  for (const intent of intents.slice(0, 5)) {
    const result = await groundedSearch(
      apiKey,
      `「${intent}」について、継続的に読む価値のあるウェブサイト・ブログ・連載を探してください。見つけたサイトを列挙してください。`
    );
    console.log(`  "${intent}": ${result.sources.length} grounding sources`);
    // リダイレクトを実 URL に解決してからホストで重複を除く
    const resolved = await Promise.all(
      result.sources.slice(0, MAX_RESOLVE_PER_INTENT).map(async (page) => ({
        ...page,
        url: (await resolveRedirect(page.url)) ?? "",
      }))
    );
    for (const page of resolved) {
      let host: string;
      try {
        host = new URL(page.url).host.replace(/^www\./, "");
      } catch {
        continue;
      }
      if (host.endsWith("google.com") || host.endsWith("wikipedia.org") || host.endsWith("amazon.co.jp")) continue;
      if (seenHosts.has(host) || knownHosts.has(host) || triedHosts.has(host)) continue;
      seenHosts.add(host);
      pages.push({ query: intent, title: page.title || host, url: page.url });
    }
  }
  console.log(`${pages.length} new hosts to probe`);

  // 3. RSS/Atom を探し、取れたものだけ candidate に
  let registered = 0;
  for (const page of pages) {
    if (registered >= MAX_NEW_PER_RUN) break;
    const found = await discoverFeed(page.url);
    const feedUrl = found?.url ?? null;
    const record: SourceDiscovery = {
      foundAt: new Date().toISOString(),
      query: page.query,
      title: page.title,
      url: page.url,
      feedUrl,
      result: "no-feed",
      sourceId: null,
    };
    if (feedUrl) {
      const source = newSource({
        name: found?.title || page.title || new URL(page.url).host,
        url: feedUrl,
        category: "discovered",
        origin: "search",
        status: "candidate",
      });
      if (sources.some((s) => s.id === source.id || s.url === feedUrl)) {
        record.result = "duplicate";
      } else {
        sources.push(source);
        record.result = "registered";
        record.sourceId = source.id;
        registered += 1;
      }
    }
    discoveries.push(record);
    console.log(`  ${record.result.padEnd(10)} ${page.url}${feedUrl ? ` → ${feedUrl}` : ""}`);
  }

  state.lastDiscovery = { questionKey, at: new Date().toISOString() };
  await saveSources(sources);
  await fs.writeFile(discoveriesPath, `${JSON.stringify(discoveries, null, 2)}\n`);
  await saveState(state);
  console.log(`Registered ${registered} candidate sources.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("news:discover failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  });
