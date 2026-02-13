import { GoogleGenerativeAI } from "@google/generative-ai";
import { ContentItem, SummarizedContent } from "./types";

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
  const prompt = `あなたは簡潔で学術的なスタイルで要約を作成するアシスタントです。
以下のコンテンツを2-3文で要約してください。要約は客観的で情報密度が高く、研究論文のアブストラクトのようなスタイルで書いてください。

タイトル: ${item.title}
ソース: ${item.source}
内容: ${item.content || "No content available"}

要約:`;

  try {
    const result = await model.generateContent(prompt);
    const summary = result.response.text().trim();

    return {
      id: item.id,
      source: item.source,
      title: item.title,
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
  // GitHub items: use commit message as-is, no Gemini
  const githubItems = items.filter((item) => item.source === "github");
  const noteItems = items.filter((item) => item.source === "notecom");

  const githubResults = githubItems.map(contentToSummary);

  // note.com items: check cache, only summarize new ones
  const cachedResults: SummarizedContent[] = [];
  const newNoteItems: ContentItem[] = [];

  for (const item of noteItems) {
    const cached = cache.get(item.id);
    if (cached) {
      cachedResults.push(cached);
    } else {
      newNoteItems.push(item);
    }
  }

  if (cachedResults.length > 0) {
    console.log(`  Cache hit: ${cachedResults.length} items`);
  }

  let newResults: SummarizedContent[] = [];

  if (newNoteItems.length > 0) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      console.warn("  GEMINI_API_KEY not configured, using content as-is");
      newResults = newNoteItems.map(contentToSummary);
    } else {
      console.log(`  Summarizing ${newNoteItems.length} new note.com items with Gemini...`);
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const batchSize = 5;
      for (let i = 0; i < newNoteItems.length; i += batchSize) {
        const batch = newNoteItems.slice(i, i + batchSize);
        const summaries = await Promise.all(
          batch.map((item) => summarizeWithGemini(item, model))
        );
        newResults.push(...summaries);

        if (i + batchSize < newNoteItems.length) {
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
