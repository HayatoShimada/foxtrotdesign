import Parser from "rss-parser";
import { ContentItem } from "../types";

const parser = new Parser();

export async function fetchNoteComArticles(
  username: string
): Promise<ContentItem[]> {
  const feedUrl = `https://note.com/${username}/rss`;

  try {
    const feed = await parser.parseURL(feedUrl);

    return feed.items.map((item) => {
      const imageMatch = item.content?.match(/<img[^>]+src="([^">]+)"/);
      const imageUrls = imageMatch ? [imageMatch[1]] : [];

      return {
        id: `notecom-${item.guid || item.link}`,
        source: "notecom" as const,
        type: "article" as const,
        title: item.title || "Untitled",
        content: item.contentSnippet || item.content || "",
        url: item.link || "",
        imageUrls,
        publishedAt: item.pubDate
          ? new Date(item.pubDate).toISOString()
          : new Date().toISOString(),
        metadata: {
          categories: item.categories || [],
        },
      };
    });
  } catch (error) {
    console.error("Failed to fetch note.com RSS:", error);
    return [];
  }
}
