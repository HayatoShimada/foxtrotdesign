import Parser from "rss-parser";
import { ContentItem } from "../types";

const parser = new Parser({
  customFields: {
    item: [["media:thumbnail", "mediaThumbnail"]],
  },
});

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractSlug(url: string): string | null {
  const match = url.match(/\/n\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

export interface NoteArticle {
  id: string;
  title: string;
  body: string;
  url: string;
  publishedAt: string;
}

export async function fetchNoteComFullArticles(
  username: string,
  cache: NoteArticle[] = []
): Promise<{ articles: NoteArticle[]; newArticles: NoteArticle[] }> {
  const cachedIds = new Set(cache.map((a) => a.id));
  const feedUrl = `https://note.com/${username}/rss`;

  try {
    const feed = await parser.parseURL(feedUrl);
    const newArticles: NoteArticle[] = [];

    for (const item of feed.items) {
      const url = item.link || "";
      const id = `notecom-${item.guid || url}`;

      if (cachedIds.has(id)) continue;

      const slug = extractSlug(url);
      if (!slug) continue;

      try {
        const res = await fetch(`https://note.com/api/v3/notes/${slug}`);
        if (!res.ok) continue;
        const json = await res.json();
        const body = stripHtml(json.data?.body || "");

        if (body) {
          newArticles.push({
            id,
            title: item.title || "Untitled",
            body,
            url,
            publishedAt: item.pubDate
              ? new Date(item.pubDate).toISOString()
              : new Date().toISOString(),
          });
        }

        await new Promise((r) => setTimeout(r, 500));
      } catch {
        console.warn(`Failed to fetch article: ${slug}`);
      }
    }

    const articles = [...cache, ...newArticles].sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    return { articles, newArticles };
  } catch (error) {
    console.error("Failed to fetch note.com articles:", error);
    return { articles: cache, newArticles: [] };
  }
}

export async function fetchNoteComArticles(
  username: string
): Promise<ContentItem[]> {
  const feedUrl = `https://note.com/${username}/rss`;

  try {
    const feed = await parser.parseURL(feedUrl);

    return feed.items.map((item) => {
      const imageMatches = item.content?.matchAll(/<img[^>]+src="([^">]+)"/g);
      const fromContent = imageMatches
        ? [...imageMatches].map((m) => m[1])
        : [];
      const thumbnail =
        typeof item.mediaThumbnail === "string"
          ? item.mediaThumbnail.trim()
          : undefined;
      const imageUrls = thumbnail
        ? [thumbnail, ...fromContent.filter((u) => u !== thumbnail)]
        : fromContent;

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
