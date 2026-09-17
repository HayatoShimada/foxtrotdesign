export interface ContentItem {
  id: string;
  source: "notecom" | "github" | "bluesky" | "zenn";
  type: "article" | "commit" | "post";
  title: string;
  content: string;
  url: string;
  imageUrls: string[];
  publishedAt: string;
  metadata?: Record<string, unknown>;
}

export interface SummarizedContent {
  id: string;
  source: "notecom" | "github" | "bluesky" | "zenn";
  title: string;
  summary: string;
  url: string;
  imageUrls: string[];
  publishedAt: string;
  metadata?: Record<string, any>;
}

/** SilverBullet の読書タスクから抽出した投影。本文や所感は含めない */
export interface ReadingItem {
  title: string;
  url: string;
  kind: "paper" | "book" | "news" | "other";
  done: boolean;
  completedAt: string | null;
}

/** AI が提案した次に読むもの。URL は持たせない（モデルが捏造するため、人間が確認時に付ける） */
export interface SuggestedItem {
  title: string;
  kind: "paper" | "book" | "news" | "other";
  reason: string;
  searchHint: string;
  url: string | null;
}

/** 提案の束。draft のままではサイトに出ない */
export interface SuggestedReading {
  status: "draft" | "published";
  generatedAt: string;
  publishedAt: string | null;
  question: string;
  model: string;
  items: SuggestedItem[];
}

export interface GitHubRepo {
  name: string;
  description: string | null;
  language: string | null;
  url: string;
  updatedAt: string;
  commits?: SummarizedContent[];
}
