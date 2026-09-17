import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs/promises";
import path from "path";
import { formatIssueNumber, getLatestLifeIssue } from "../lib/life-issue";
import { NewsReport, NewsSource, SuggestedReading } from "../lib/types";
import { loadSources, saveSources } from "../lib/news/sources";
import { fetchFeed, FeedEntry } from "../lib/news/feeds";
import { getApiKey, getJsonModel, modelName } from "../lib/news/gemini";
import { scoreCandidates, RELEVANCE_THRESHOLD } from "../lib/news/score";

// 巡回先から記事を集め、いまの問いとの関連でスコアリングして news.json に書く。
// Pi の timer が毎日実行し、結果を commit / push する。Vercel は読むだけ。
// 失敗しても前回の news.json を残して exit 0（ニュース側の事故で流れを止めない）。

const WINDOW_DAYS = 7;
const PER_SOURCE = 15;

const researchDirectory = path.join(process.cwd(), "content", "research");
const reportPath = path.join(researchDirectory, "news.json");

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function normalizeTitle(title: string): string {
  return title.replace(/[\s　]+/g, "").toLowerCase();
}

async function collect(sources: NewsSource[]): Promise<FeedEntry[]> {
  const targets = sources.filter((s) => s.status !== "stopped");
  const results = await Promise.all(
    targets.map((source) => fetchFeed(source, { limit: PER_SOURCE, sinceDays: WINDOW_DAYS }))
  );

  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const entries: FeedEntry[] = [];

  targets.forEach((source, i) => {
    const { entries: fetched, error } = results[i];
    source.stats.runs += 1;
    if (error) {
      source.stats.consecutiveErrors += 1;
      source.stats.lastError = error;
      console.log(`  ✗ ${source.name}: ${error}`);
      return;
    }
    source.stats.consecutiveErrors = 0;
    source.stats.lastError = null;
    source.stats.fetched += fetched.length;
    console.log(`  ✓ ${source.name}: ${fetched.length}`);
    for (const entry of fetched) {
      const key = normalizeTitle(entry.title);
      if (seenUrls.has(entry.url) || seenTitles.has(key)) continue;
      seenUrls.add(entry.url);
      seenTitles.add(key);
      entries.push(entry);
    }
  });

  return entries;
}

async function main() {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("GEMINI_API_KEY がありません");

  const latest = await getLatestLifeIssue();
  if (!latest) throw new Error("公開済みの LIFE ISSUES がありません");

  const sources = await loadSources();
  console.log(`Collecting from ${sources.filter((s) => s.status !== "stopped").length} sources (${WINDOW_DAYS} days)...`);
  const candidates = await collect(sources);
  // 取得の成否は採用の有無に関わらず台帳に残す
  await saveSources(sources);
  if (candidates.length === 0) throw new Error("候補が 0 件でした");
  console.log(`${candidates.length} candidates`);

  const [issueSources, suggested] = await Promise.all([
    readJson<{ keywords?: string[] }>(
      path.join(process.cwd(), "content", "life-issues", "thoughts", "sources", `${formatIssueNumber(latest.issue)}.json`),
      {}
    ),
    readJson<SuggestedReading | null>(path.join(researchDirectory, "suggested.json"), null),
  ]);

  const names = new Map(sources.map((s) => [s.id, s.name]));
  const scored = await scoreCandidates(
    getJsonModel(apiKey),
    {
      question: latest.nextQuestion,
      why: latest.why,
      keywords: issueSources.keywords ?? [],
      books: suggested?.status === "published" ? suggested.items.map((i) => i.title) : [],
    },
    candidates,
    names
  );

  const histogram = [0, 20, 40, 60, 80].map(
    (lo) => `${lo}-${lo + 19}: ${scored.filter((i) => i.relevance >= lo && i.relevance < lo + 20).length}`
  );
  console.log(`relevance histogram — ${histogram.join(", ")}, 100: ${scored.filter((i) => i.relevance === 100).length}`);

  const byId = new Map(sources.map((s) => [s.id, s]));
  const adopted = scored
    .filter((item) => item.relevance >= RELEVANCE_THRESHOLD && item.reason)
    .sort((a, b) => b.score - a.score || Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

  const now = new Date().toISOString();
  const report: NewsReport = {
    generatedAt: now,
    question: latest.nextQuestion,
    windowDays: WINDOW_DAYS,
    items: adopted.map((item) => {
      const source = byId.get(item.sourceId)!;
      return {
        title: item.title,
        url: item.url,
        sourceId: source.id,
        sourceName: source.name,
        category: source.category,
        publishedAt: item.publishedAt,
        relevance: item.relevance,
        importance: item.importance,
        score: item.score,
        reason: item.reason,
      };
    }),
  };

  for (const item of adopted) {
    const source = byId.get(item.sourceId)!;
    source.stats.adopted += 1;
    source.stats.lastAdoptedAt = now;
    source.stats.runsAtLastAdoption = source.stats.runs;
  }

  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  await saveSources(sources);

  console.log(`\nAdopted ${adopted.length}/${scored.length} (relevance >= ${RELEVANCE_THRESHOLD}, ${modelName})`);
  for (const item of adopted.slice(0, 10)) {
    console.log(`- [${item.score}] ${item.title}（${names.get(item.sourceId)}）\n  rel ${item.relevance} / imp ${item.importance}: ${item.reason}`);
  }
}

main()
  .catch((error) => {
    console.error(
      "news:sync failed, keeping previous news.json:",
      error instanceof Error ? error.message : error
    );
  })
  // rss-parser のソケットが残ってプロセスが終わらないことがあるので明示的に抜ける
  .finally(() => process.exit(0));
