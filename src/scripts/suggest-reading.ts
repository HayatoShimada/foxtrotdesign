import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs/promises";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getLatestLifeIssue } from "../lib/life-issue";
import {
  ReadingItem,
  SuggestedItem,
  SuggestedReading,
  SummarizedContent,
} from "../lib/types";

// 「AIが提案 → 人間が確認 → 公開」の流れは collect-life-issue-thought.ts と同じ。
// 材料は自分が書いたもの（summarized.json）と読みたいもの（reading.json）だけで、
// メモ本文は使わない。出力は draft として保存し、--publish で初めてサイトに出る。

const researchDirectory = path.join(process.cwd(), "content", "research");
const outputPath = path.join(researchDirectory, "suggested.json");
const modelName = process.env.SUGGEST_READING_MODEL || "gemini-3.5-flash";
const kinds = new Set(["paper", "book", "news", "other"]);

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(path.join(researchDirectory, file), "utf-8"));
  } catch {
    return fallback;
  }
}

function buildPrompt(
  question: string,
  why: string,
  reading: ReadingItem[],
  outputs: SummarizedContent[]
): string {
  const readingLines = reading
    .map((item) => `- [${item.done ? "読了" : "未読"}] ${item.title} (${item.kind})`)
    .join("\n");
  const outputLines = outputs
    .map((item) => `- ${item.title}: ${item.summary}`)
    .join("\n");

  return `あなたは読書の相談相手です。次の「問い」に取り組んでいる人に、次に読むべきものを提案してください。

必須ルール:
- 提案は3〜5件
- 既に読書リストにあるものは提案しない
- 実在する論文・本・記事だけを挙げる。確信が持てないものは挙げない
- URLは出力しない。代わりに検索用の語句を searchHint に書く
- reason は日本語60〜160字で、この問いとどう繋がるかを書く
- kind は paper / book / news / other のいずれか
- JSON以外は出力しない

本人について:
- foxtrotdesign は本業（金銭）や副業の85-Store（安心）とは別の、個人の自由表現のための活動
- 抽象的な思考を、人に説明する文章に整理することで理解するタイプ。「思考する → 整理する → 理解する」
- 提案は、問いを別の角度から見直すきっかけになるものを優先する

問い:
${question}

本人のメモ:
${why}

読書リスト:
${readingLines || "なし"}

最近のアウトプット:
${outputLines || "なし"}

出力形式:
{"items":[{"title":"...","kind":"paper","reason":"...","searchHint":"..."}]}`;
}

function parseSuggestions(value: string): SuggestedItem[] {
  const cleaned = value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const parsed = JSON.parse(cleaned) as { items?: unknown };
  if (!Array.isArray(parsed.items)) {
    throw new Error("Gemini の出力に items がありません");
  }
  const items = parsed.items.map((raw): SuggestedItem => {
    const item = raw as Partial<SuggestedItem>;
    if (
      typeof item.title !== "string" ||
      typeof item.reason !== "string" ||
      typeof item.searchHint !== "string" ||
      typeof item.kind !== "string" ||
      !kinds.has(item.kind)
    ) {
      throw new Error(`提案の形式が不正です: ${JSON.stringify(raw)}`);
    }
    return {
      title: item.title.trim(),
      kind: item.kind as SuggestedItem["kind"],
      reason: item.reason.trim(),
      searchHint: item.searchHint.trim(),
      url: null,
    };
  });
  if (items.length < 3 || items.length > 5) {
    throw new Error(`提案は3〜5件が必要です（${items.length}件）`);
  }
  return items;
}

async function generate() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    throw new Error("GEMINI_API_KEYが必要です（.env.local に置いてください）");
  }
  const latest = await getLatestLifeIssue();
  if (!latest) {
    throw new Error("公開済みの LIFE ISSUES がありません");
  }
  const [reading, outputs] = await Promise.all([
    readJson<ReadingItem[]>("reading.json", []),
    readJson<SummarizedContent[]>("summarized.json", []),
  ]);
  const recentOutputs = outputs
    .filter((item) => item.source !== "github")
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, 15);

  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: modelName,
    generationConfig: {
      // gemini-3.5 は思考トークンもこの上限に含まれる。2048 だと本文が途中で切れた
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
      temperature: 0.7,
    },
  });
  const result = await model.generateContent(
    buildPrompt(latest.nextQuestion, latest.why, reading, recentOutputs)
  );
  const finishReason = result.response.candidates?.[0]?.finishReason;
  if (finishReason && finishReason !== "STOP") {
    throw new Error(`Gemini が途中で止まりました: ${finishReason}`);
  }
  const items = parseSuggestions(result.response.text());
  const existingTitles = new Set(reading.map((item) => item.title.toLowerCase()));
  const fresh = items.filter((item) => !existingTitles.has(item.title.toLowerCase()));

  const draft: SuggestedReading = {
    status: "draft",
    generatedAt: new Date().toISOString(),
    publishedAt: null,
    question: latest.nextQuestion,
    model: modelName,
    items: fresh,
  };
  await fs.writeFile(outputPath, JSON.stringify(draft, null, 2) + "\n");

  console.log(`Drafted ${fresh.length} suggestions for: ${latest.nextQuestion}\n`);
  for (const item of fresh) {
    console.log(`- ${item.title} (${item.kind})\n  ${item.reason}\n  検索: ${item.searchHint}`);
  }
  console.log(`\nReview ${outputPath}, add url if you verified one.`);
  console.log("Publish with: npm run suggest:publish");
  console.log("Nothing was published.");
}

async function publish() {
  const raw = await fs.readFile(outputPath, "utf-8").catch(() => null);
  if (!raw) throw new Error("suggested.json がありません。先に suggest:generate を実行してください");
  const draft: SuggestedReading = JSON.parse(raw);
  if (draft.status === "published") {
    console.log("Already published.");
    return;
  }
  const published: SuggestedReading = {
    ...draft,
    status: "published",
    publishedAt: new Date().toISOString().slice(0, 10),
  };
  await fs.writeFile(outputPath, JSON.stringify(published, null, 2) + "\n");
  console.log(`Published ${published.items.length} suggestions. Commit and push to deploy.`);
}

(process.argv.includes("--publish") ? publish() : generate()).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
