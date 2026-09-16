import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs/promises";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Parser from "rss-parser";
import {
  getThoughtSourceConfigPath,
  readThoughtDraft,
  WeeknoteThoughtDraft,
  WeeknoteThoughtDraftEntry,
  WeeknoteThoughtSourceKind,
  writeThoughtDraft,
} from "../lib/weeknote-thought";
import {
  formatIssueNumber,
  getWeeknote,
  WeeknoteIssue,
} from "../lib/weeknote";
import { NoteArticle } from "../lib/aggregators/notecom";
import { SummarizedContent } from "../lib/types";

interface PublicSourceConfig {
  kind: "rss" | "page";
  url: string;
  title?: string;
  limit?: number;
}

interface ThoughtSourceConfig {
  issue: number;
  keywords: string[];
  publicSources: PublicSourceConfig[];
}

interface Evidence {
  id: string;
  kind: WeeknoteThoughtSourceKind;
  title: string;
  url: string;
  content: string;
}

interface GeminiThought {
  conclusion: string;
  sourceIds: string[];
}

const parser = new Parser();
const researchDirectory = `${process.cwd()}/content/research`;
const modelName =
  process.env.WEEKNOTE_THOUGHT_MODEL || "gemini-3.5-flash";

function getArgument(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function requireIssueNumber(): number {
  const value = getArgument("issue");
  const issue = Number(value);
  if (!value || !Number.isInteger(issue) || issue < 1) {
    throw new Error("--issue に公開済みWEEKNOTEの号数を指定してください");
  }
  return issue;
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf-8")) as T;
}

function decodeHtml(value: string): string {
  const entities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value
    .replace(
      /&(#x?[0-9a-f]+|[a-z]+);/gi,
      (match, entity: string) => {
        if (entity.startsWith("#x")) {
          return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
        }
        if (entity.startsWith("#")) {
          return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
        }
        return entities[entity.toLowerCase()] ?? match;
      }
    )
    .replace(/\s+/g, " ")
    .trim();
}

function pageText(html: string): string {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  ).slice(0, 8_000);
}

function pageTitle(html: string, fallback: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtml(match[1]) : fallback;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "foxtrotdesign-weeknote-thought/1.0",
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.text();
}

async function collectPublicSource(
  source: PublicSourceConfig
): Promise<Omit<Evidence, "id">[]> {
  const raw = await fetchText(source.url);

  if (source.kind === "page") {
    return [
      {
        kind: "page",
        title: source.title || pageTitle(raw, source.url),
        url: source.url,
        content: pageText(raw),
      },
    ];
  }

  const feed = await parser.parseString(raw);
  return feed.items.slice(0, source.limit ?? 5).flatMap((item) => {
    const url = item.link?.trim();
    if (!url) return [];
    return [
      {
        kind: "rss" as const,
        title: item.title?.trim() || source.title || feed.title || url,
        url,
        content: decodeHtml(
          item.contentSnippet || item.content || item.summary || ""
        ).slice(0, 4_000),
      },
    ];
  });
}

function relevanceScore(
  evidence: Omit<Evidence, "id">,
  keywords: string[]
): number {
  const haystack = `${evidence.title}\n${evidence.content}`.toLowerCase();
  return keywords.reduce((score, keyword) => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return score;
    const matches = haystack.split(normalized).length - 1;
    return score + Math.min(matches, 5);
  }, 0);
}

async function collectEvidence(
  config: ThoughtSourceConfig
): Promise<Evidence[]> {
  const [summaries, articles, publicResults] = await Promise.all([
    readJson<SummarizedContent[]>(
      `${researchDirectory}/summarized.json`
    ),
    readJson<NoteArticle[]>(`${researchDirectory}/articles.json`),
    Promise.allSettled(config.publicSources.map(collectPublicSource)),
  ]);

  const local = new Map<string, Omit<Evidence, "id">>();
  for (const item of summaries) {
    if (item.source === "bluesky") continue;
    local.set(item.url, {
      kind: item.source,
      title: item.title,
      url: item.url,
      content: item.summary,
    });
  }
  for (const article of articles) {
    local.set(article.url, {
      kind: "notecom",
      title: article.title,
      url: article.url,
      content: article.body.slice(0, 8_000),
    });
  }

  const rankedLocal = [...local.values()]
    .map((evidence) => ({
      evidence,
      score: relevanceScore(evidence, config.keywords),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 16)
    .map(({ evidence }) => evidence);

  const publicEvidence: Omit<Evidence, "id">[] = [];
  publicResults.forEach((result, index) => {
    if (result.status === "fulfilled") {
      publicEvidence.push(...result.value);
      return;
    }
    console.warn(
      `  Public source skipped: ${config.publicSources[index].url} (${result.reason})`
    );
  });

  const deduplicated = new Map<string, Omit<Evidence, "id">>();
  for (const evidence of [...rankedLocal, ...publicEvidence]) {
    deduplicated.set(evidence.url, evidence);
  }

  return [...deduplicated.values()].map((evidence, index) => ({
    ...evidence,
    id: `S${index + 1}`,
  }));
}

function buildPrompt(
  issue: WeeknoteIssue,
  evidence: Evidence[],
  draft: WeeknoteThoughtDraft | null
): string {
  const previous = draft?.entries
    .map((entry) => `- ${entry.conclusion}`)
    .join("\n");
  const materials = evidence
    .map(
      (item) =>
        `[${item.id}] ${item.title}\nURL: ${item.url}\n${item.content}`
    )
    .join("\n\n---\n\n");

  return `あなたはHayatoShimada AIです。WEEKNOTEの「次の問い」について、収集資料を読んで短く考えてください。

話し方:
- 友人や店頭のお客さんと話すような、肩の力が抜けた自然な日本語
- 一人称は基本的に「僕」
- 定型の前置きや締めは使わない
- 少しエッセイ的でもよいが、詩的に演出しすぎない

必須ルール:
- 結論は日本語80〜320字、2〜4文
- 問いを書き換えず、断定しすぎないひとつの暫定的な考えにする
- 根拠に使うsourceIdsを2〜4件選ぶ
- 下記にない情報、URL、引用を作らない
- 前回までの考えがある場合は、言い換えではなく新しい角度を足す
- JSON以外は出力しない

問い:
${issue.nextQuestion}

本人のメモ:
${issue.why}

前回までの考え:
${previous || "なし"}

収集資料:
${materials}

出力形式:
{"conclusion":"...","sourceIds":["S1","S2"]}`;
}

function parseGeminiThought(
  value: string,
  evidence: Evidence[]
): GeminiThought {
  const cleaned = value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const parsed = JSON.parse(cleaned) as Partial<GeminiThought>;
  const conclusionLength =
    typeof parsed.conclusion === "string"
      ? [...parsed.conclusion.trim()].length
      : 0;
  const sourceIds = Array.isArray(parsed.sourceIds)
    ? [...new Set(parsed.sourceIds)]
    : [];
  const allowedIds = new Set(evidence.map((item) => item.id));

  if (
    typeof parsed.conclusion !== "string" ||
    conclusionLength < 80 ||
    conclusionLength > 320 ||
    sourceIds.length < 2 ||
    sourceIds.length > 4 ||
    sourceIds.some((id) => typeof id !== "string" || !allowedIds.has(id))
  ) {
    throw new Error("Geminiの思考出力が指定形式を満たしていません");
  }

  return {
    conclusion: parsed.conclusion.trim(),
    sourceIds: sourceIds as string[],
  };
}

function nextEntryId(
  issue: number,
  collectedAt: string,
  draft: WeeknoteThoughtDraft | null
): string {
  const date = collectedAt.slice(0, 10).replaceAll("-", "");
  const prefix = `${formatIssueNumber(issue)}-${date}-`;
  const sequence =
    (draft?.entries.filter((entry) => entry.id.startsWith(prefix)).length ?? 0) +
    1;
  return `${prefix}${String(sequence).padStart(2, "0")}`;
}

async function main() {
  const issueNumber = requireIssueNumber();
  const [issue, config, existingDraft] = await Promise.all([
    getWeeknote(formatIssueNumber(issueNumber)),
    readJson<ThoughtSourceConfig>(getThoughtSourceConfigPath(issueNumber)),
    readThoughtDraft(issueNumber),
  ]);

  if (!issue) {
    throw new Error(`WEEKNOTE #${formatIssueNumber(issueNumber)} は未公開です`);
  }
  if (config.issue !== issueNumber) {
    throw new Error("思考ソース設定のissueが一致していません");
  }
  if (existingDraft && existingDraft.question !== issue.nextQuestion) {
    throw new Error(
      "公開号のNEXT QUESTIONが思考ドラフト作成後に変更されています"
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    throw new Error("GEMINI_API_KEYが必要です");
  }

  console.log(
    `Collecting cheap sources for WEEKNOTE #${formatIssueNumber(issueNumber)}...`
  );
  const evidence = await collectEvidence(config);
  if (evidence.length < 2) {
    throw new Error("思考を作るための有効な資料が2件以上必要です");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      maxOutputTokens: 512,
      responseMimeType: "application/json",
      temperature: 0.6,
    },
  });
  const result = await model.generateContent(
    buildPrompt(issue, evidence, existingDraft)
  );
  const generated = parseGeminiThought(result.response.text(), evidence);
  const evidenceById = new Map(evidence.map((item) => [item.id, item]));
  const collectedAt =
    process.env.WEEKNOTE_THOUGHT_DATE || new Date().toISOString();
  if (Number.isNaN(Date.parse(collectedAt))) {
    throw new Error("WEEKNOTE_THOUGHT_DATEはISO 8601形式で指定してください");
  }

  const entry: WeeknoteThoughtDraftEntry = {
    id: nextEntryId(issueNumber, collectedAt, existingDraft),
    status: "draft",
    collectedAt,
    conclusion: generated.conclusion,
    sources: generated.sourceIds.map((id) => {
      const source = evidenceById.get(id);
      if (!source) throw new Error(`Unknown source: ${id}`);
      return {
        kind: source.kind,
        title: source.title,
        url: source.url,
      };
    }),
  };
  const draft: WeeknoteThoughtDraft = {
    issue: issueNumber,
    question: issue.nextQuestion,
    model: modelName,
    entries: [...(existingDraft?.entries ?? []), entry],
  };

  await writeThoughtDraft(draft);
  console.log(`Drafted ${entry.id} with ${entry.sources.length} sources.`);
  console.log(
    `Review with: npm run weeknote:thought:show -- --issue ${issueNumber} --entry ${entry.id}`
  );
  console.log("Nothing was published.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
