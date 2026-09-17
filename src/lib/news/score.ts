import { generateJsonRest } from "./gemini";
import { FeedEntry } from "./feeds";

// 関連性 ≫ 社会的重要度。relevance が閾値未満のものは importance が高くても採用しない。
export const RELEVANCE_WEIGHT = 0.8;
export const IMPORTANCE_WEIGHT = 0.2;
export const RELEVANCE_THRESHOLD = 40;
const BATCH = 60;

export interface Scored extends FeedEntry {
  relevance: number;
  importance: number;
  score: number;
  reason: string;
}

export interface ScoringContext {
  question: string;
  why: string;
  keywords: string[];
  books: string[];
}

function clamp(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 0;
}

function buildPrompt(context: ScoringContext, batch: FeedEntry[], names: Map<string, string>) {
  const list = batch
    .map(
      (entry, index) =>
        `[${index + 1}] ${entry.title}（${names.get(entry.sourceId) ?? entry.sourceId} / ${entry.publishedAt.slice(0, 10)}）`
    )
    .join("\n");

  return `あなたは「問い」を抱えている人のために、ニュース記事を選別します。各記事に2つの点数を付けてください。

- relevance（0〜100）: この記事が「問い」や「本人のメモ」「読もうとしている本」とどれだけ直接つながるか。
  問いと同じテーマ・概念・人物を扱っていれば高く、AI や技術の話題というだけでは低い
- importance（0〜100）: その記事が社会的・技術的にどれだけ重要か
- reason: 日本語40〜80字。relevance が 40 以上のものだけ書く。問いとどう繋がるかを具体的に。
  40 未満は空文字でよい

ルール:
- 見出しだけで判断する。内容を推測して盛らない
- 判断の軸は relevance が主で、importance は従。無関係な大ニュースに高い relevance を付けない
- 候補に無い番号を作らない。全件に点を付ける
- JSON以外は出力しない

問い:
${context.question}

本人のメモ:
${context.why}

キーワード:
${context.keywords.join("、") || "なし"}

読もうとしている本:
${context.books.map((b) => `- ${b}`).join("\n") || "なし"}

候補:
${list}

出力形式:
{"scores":[{"index":1,"relevance":0,"importance":0,"reason":""}]}`;
}

export async function scoreCandidates(
  apiKey: string,
  context: ScoringContext,
  candidates: FeedEntry[],
  names: Map<string, string>
): Promise<Scored[]> {
  const scored: Scored[] = [];
  const total = { prompt: 0, output: 0, thoughts: 0 };

  for (let offset = 0; offset < candidates.length; offset += BATCH) {
    const batch = candidates.slice(offset, offset + BATCH);
    const { data, usage } = await generateJsonRest<{
      scores: { index: number; relevance: number; importance: number; reason: string }[];
    }>(apiKey, buildPrompt(context, batch, names));
    const { scores } = data;
    total.prompt += usage.prompt;
    total.output += usage.output;
    total.thoughts += usage.thoughts;
    if (!Array.isArray(scores)) throw new Error("Gemini が scores を返しませんでした");

    const seen = new Set<number>();
    for (const s of scores) {
      const entry = batch[Number(s.index) - 1];
      if (!entry || seen.has(s.index)) continue;
      seen.add(s.index);
      const relevance = clamp(s.relevance);
      const importance = clamp(s.importance);
      scored.push({
        ...entry,
        relevance,
        importance,
        score: Math.round(RELEVANCE_WEIGHT * relevance + IMPORTANCE_WEIGHT * importance),
        reason: typeof s.reason === "string" ? s.reason.trim() : "",
      });
    }
    console.log(`  scored ${Math.min(offset + BATCH, candidates.length)}/${candidates.length}`);
  }

  if (candidates.length > 0) {
    console.log(
      `  tokens — prompt ${total.prompt}, output ${total.output}, thoughts ${total.thoughts} (total ${
        total.prompt + total.output + total.thoughts
      })`
    );
  }
  return scored;
}
