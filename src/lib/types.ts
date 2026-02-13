export interface ContentItem {
  id: string;
  source: "notecom" | "github";
  type: "article" | "commit";
  title: string;
  content: string;
  url: string;
  imageUrls: string[];
  publishedAt: string;
  metadata?: Record<string, unknown>;
}

export interface SummarizedContent {
  id: string;
  source: "notecom" | "github";
  title: string;
  summary: string;
  url: string;
  imageUrls: string[];
  publishedAt: string;
}
