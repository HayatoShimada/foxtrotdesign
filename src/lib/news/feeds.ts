import Parser from "rss-parser";
import { NewsSource } from "../types";

// RSS/Atom を 1 本取る。失敗は投げずに error で返し、呼び出し側が台帳に記録する。

export interface FeedEntry {
  title: string;
  url: string;
  publishedAt: string;
  sourceId: string;
}

export const feedParser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "Mozilla/5.0 (compatible; foxtrotdesign-news/1.0)" },
});

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export async function fetchFeed(
  source: NewsSource,
  { limit, sinceDays }: { limit: number; sinceDays: number }
): Promise<{ entries: FeedEntry[]; error: string | null }> {
  try {
    const feed = await feedParser.parseURL(source.url);
    const cutoff = Date.now() - sinceDays * DAY_IN_MS;
    const entries: FeedEntry[] = [];

    for (const item of feed.items) {
      const date = item.isoDate || item.pubDate;
      if (!item.link || !item.title || !date) continue;
      const publishedAt = new Date(date);
      if (Number.isNaN(publishedAt.getTime()) || publishedAt.getTime() < cutoff) continue;
      entries.push({
        title: item.title.replace(/\s+/g, " ").trim(),
        url: item.link.trim(),
        publishedAt: publishedAt.toISOString(),
        sourceId: source.id,
      });
      if (entries.length === limit) break;
    }
    return { entries, error: null };
  } catch (error) {
    return {
      entries: [],
      error: error instanceof Error ? error.message.slice(0, 120) : String(error),
    };
  }
}
