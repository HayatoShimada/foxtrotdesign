import { ContentItem } from "../types";

interface BlueskyFeedResponse {
  feed: BlueskyFeedItem[];
  cursor?: string;
}

interface BlueskyFeedItem {
  post: {
    uri: string;
    author: {
      handle: string;
      displayName?: string;
    };
    record: {
      text: string;
      createdAt: string;
    };
    embed?: {
      $type: string;
      images?: { thumb: string; fullsize: string; alt?: string }[];
    };
  };
}

export async function fetchBlueskyPosts(
  handle: string
): Promise<ContentItem[]> {
  const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(handle)}&filter=posts_no_replies&limit=50`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      console.error(`Bluesky API error: ${res.status}`);
      return [];
    }

    const data: BlueskyFeedResponse = await res.json();

    return data.feed.map((item) => {
      const { post } = item;
      const rkey = post.uri.split("/").pop() || post.uri;
      const text = post.record.text;

      // Extract image URLs from embed
      const imageUrls: string[] = [];
      if (post.embed?.images) {
        for (const img of post.embed.images) {
          imageUrls.push(img.fullsize);
        }
      }

      return {
        id: `bluesky-${rkey}`,
        source: "bluesky" as const,
        type: "post" as const,
        title: text.length > 30 ? text.substring(0, 30) + "..." : text,
        content: text,
        url: `https://bsky.app/profile/${post.author.handle}/post/${rkey}`,
        imageUrls,
        publishedAt: post.record.createdAt,
      };
    });
  } catch (error) {
    console.error("Failed to fetch Bluesky posts:", error);
    return [];
  }
}
