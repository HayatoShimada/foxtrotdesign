import { GoogleGenerativeAI } from "@google/generative-ai";
import { ContentItem, SummarizedContent } from "./types";
import { NoteArticle } from "./aggregators/notecom";

function contentToSummary(item: ContentItem): SummarizedContent {
  return {
    id: item.id,
    source: item.source,
    title: item.title,
    summary: item.content?.substring(0, 200) || item.title,
    url: item.url,
    imageUrls: item.imageUrls,
    publishedAt: item.publishedAt,
  };
}

async function summarizeWithGemini(
  item: ContentItem,
  model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>
): Promise<SummarizedContent> {
  const isBluesky = item.source === "bluesky";

  const prompt = `あなたは簡潔で学術的なスタイルで要約を作成するアシスタントです。
以下のコンテンツから「タイトル」と「要約」を作成してください。

ルール:
- タイトル: コンテンツの核心を突く特徴的なもの（30文字以内）。
- 要約: 2-3文で客観的、情報密度が高く、研究論文のアブストラクトのようなスタイル。
${isBluesky ? "- SourceはBlueskyです。単なる本文の切り出しではなく、投稿の意図やトピックが伝わるタイトルにしてください。\n- Blueskyの投稿タイプ（PostまたはRepost）を判別し、タイトルの冒頭に [Post] または [Repost] を必ず付けてください。" : ""}

タイトル: ${item.title}
ソース: ${item.source}
内容: ${item.content || "No content available"}

出力形式:
【タイトル】
（ここにタイトル）
【要約】
（ここに要約）`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    let title = item.title;
    let summary = text;

    const titleMatch = text.match(/【タイトル】\n?([\s\S]*?)\n?【要約】/);
    const summaryMatch = text.match(/【要約】\n?([\s\S]*)/);

    if (titleMatch) title = titleMatch[1].trim();
    if (summaryMatch) summary = summaryMatch[1].trim();

    return {
      id: item.id,
      source: item.source,
      title,
      summary,
      url: item.url,
      imageUrls: item.imageUrls,
      publishedAt: item.publishedAt,
    };
  } catch (error) {
    console.error(`Failed to summarize ${item.id}:`, error);
    return contentToSummary(item);
  }
}

export async function batchSummarize(
  items: ContentItem[],
  cache: Map<string, SummarizedContent>
): Promise<SummarizedContent[]> {
  // GitHub items: use content as-is, no Gemini
  const githubItems = items.filter((item) => item.source === "github");
  // note.com and Bluesky items: check cache, summarize new ones
  const geminiSourceItems = items.filter((item) => item.source === "notecom" || item.source === "bluesky");

  const githubResults = githubItems.map(contentToSummary);

  const cachedResults: SummarizedContent[] = [];
  const newGeminiItems: ContentItem[] = [];

  for (const item of geminiSourceItems) {
    const cached = cache.get(item.id);
    if (cached) {
      cachedResults.push(cached);
    } else {
      newGeminiItems.push(item);
    }
  }

  if (cachedResults.length > 0) {
    console.log(`  Cache hit: ${cachedResults.length} items`);
  }

  let newResults: SummarizedContent[] = [];

  if (newGeminiItems.length > 0) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      console.warn("  GEMINI_API_KEY not configured, using content as-is");
      newResults = newGeminiItems.map(contentToSummary);
    } else {
      console.log(`  Summarizing ${newGeminiItems.length} new items (note.com/bluesky) with Gemini...`);
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const batchSize = 5;
      for (let i = 0; i < newGeminiItems.length; i += batchSize) {
        const batch = newGeminiItems.slice(i, i + batchSize);
        const summaries = await Promise.all(
          batch.map((item) => summarizeWithGemini(item, model))
        );
        newResults.push(...summaries);

        if (i + batchSize < newGeminiItems.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }
  }

  return [...githubResults, ...cachedResults, ...newResults].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export async function updateNotePrompt(
  newArticles: NoteArticle[],
  existingPrompt: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    console.warn("  GEMINI_API_KEY not configured, skipping note-prompt update");
    return existingPrompt;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const newArticleText = newArticles
    .map((a) => `### ${a.title}\n${a.body}`)
    .join("\n\n---\n\n");

  const prompt = existingPrompt
    ? `以下はHayato Shimada（Hayato Shimada）のnote.com記事から作成された人格プロファイルです。

--- 既存プロファイル ---
${existingPrompt}
--- 既存プロファイル ここまで ---

以下の新しい記事が追加されました。既存プロファイルに新しい記事の情報を統合して,更新されたプロファイルを作成してください。

--- 新しい記事 ---
${newArticleText}
--- 新しい記事 ここまで ---

ルール:
- 既存プロファイルの内容を保持しつつ,新しい情報を追加・統合する
- 著者の文体の特徴,よく使う表現,興味関心,価値観を抽出する
- 具体的なエピソードや固有名詞も含める
- 日本語で出力する
- プロファイルとして簡潔にまとめる（箇条書き推奨）`
    : `以下はHayato Shimada（Hayato Shimada）がnote.comに書いた記事の全文です。
これらの記事から,著者の人格プロファイルを作成してください。

--- 記事 ---
${newArticleText}
--- 記事 ここまで ---

以下を抽出・整理してください:
- 文体の特徴（語尾,一人称,文の構造,比喩の使い方など）
- よく使う表現やフレーズ
- 興味関心のあるトピック
- 価値観や考え方
- 具体的なエピソードや固有名詞
- ユーモアや自虐のパターン

日本語で,箇条書き中心に簡潔にまとめてください。`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Failed to update note-prompt:", error);
    return existingPrompt;
  }
}
