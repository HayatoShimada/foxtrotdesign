import Parser from "rss-parser";
import { ContentItem } from "../types";

// Zenn の RSS は enclosure に OGP 画像（cloudinary）を持つ
type ZennItem = {
  enclosure?: { url?: string };
};

const parser: Parser<Record<string, unknown>, ZennItem> = new Parser({
  customFields: {
    item: ["enclosure"],
  },
});

export async function fetchZennArticles(
  username: string
): Promise<ContentItem[]> {
  const feedUrl = `https://zenn.dev/${username}/feed`;

  try {
    const feed = await parser.parseURL(feedUrl);

    return feed.items.map((item) => {
      const cover = item.enclosure?.url?.trim();

      return {
        id: `zenn-${item.guid || item.link}`,
        source: "zenn" as const,
        type: "article" as const,
        title: item.title || "Untitled",
        content: item.contentSnippet || item.content || "",
        url: item.link || "",
        imageUrls: cover ? [cover] : [],
        publishedAt: item.pubDate
          ? new Date(item.pubDate).toISOString()
          : new Date().toISOString(),
        metadata: {
          categories: item.categories || [],
        },
      };
    });
  } catch (error) {
    console.error("Failed to fetch Zenn RSS:", error);
    return [];
  }
}
