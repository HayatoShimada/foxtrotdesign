import { GoogleGenerativeAI } from "@google/generative-ai";
import { ContentItem, SummarizedContent } from "./types";

export async function summarizeContent(
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
    const response = result.response;
    const summary = response.text().trim();

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
    return {
      id: item.id,
      source: item.source,
      title: item.title,
      summary: item.content?.substring(0, 200) + "..." || "要約を生成できませんでした。",
      url: item.url,
      imageUrls: item.imageUrls,
      publishedAt: item.publishedAt,
    };
  }
}

export async function batchSummarize(
  items: ContentItem[]
): Promise<SummarizedContent[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    console.warn("GEMINI_API_KEY not configured, using content as-is");
    return items.map((item) => ({
      id: item.id,
      source: item.source,
      title: item.title,
      summary: item.content?.substring(0, 200) || item.title,
      url: item.url,
      imageUrls: item.imageUrls,
      publishedAt: item.publishedAt,
    }));
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const batchSize = 5;
  const results: SummarizedContent[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const summaries = await Promise.all(
      batch.map((item) => summarizeContent(item, model))
    );
    results.push(...summaries);

    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}
