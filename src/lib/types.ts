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

/** ニュースの巡回先。Pi の timer が状態を書き換え、git で持ち回る */
export type NewsCategory =
  | "community"
  | "vendor"
  | "developer"
  | "research"
  | "media"
  | "newsletter"
  | "slides"
  | "discovered";

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  category: NewsCategory;
  status: "active" | "candidate" | "stopped";
  origin: "seed" | "search";
  addedAt: string;
  stoppedAt: string | null;
  stoppedReason: string | null;
  stats: {
    runs: number;
    fetched: number;
    adopted: number;
    lastAdoptedAt: string | null;
    /** active(search) の停止判定用。直近の採用時点の runs */
    runsAtLastAdoption: number;
    consecutiveErrors: number;
    lastError: string | null;
  };
}

/** Search Grounding で見つけたページと、RSS 自動検出の結果 */
export interface SourceDiscovery {
  foundAt: string;
  query: string;
  title: string;
  url: string;
  feedUrl: string | null;
  result: "registered" | "no-feed" | "duplicate" | "invalid";
  sourceId: string | null;
}

/** いまの問いに関係するニュース。スコアは関連性 ≫ 社会的重要度 */
export interface NewsReportItem {
  title: string;
  url: string;
  sourceId: string;
  sourceName: string;
  category: NewsCategory;
  publishedAt: string;
  relevance: number;
  importance: number;
  score: number;
  reason: string;
}

export interface NewsReport {
  generatedAt: string;
  question: string;
  windowDays: number;
  items: NewsReportItem[];
}

/**
 * Pi ローカルの採点キャッシュ（`data/news-state.json`、git 管理外）。
 * 7 日窓を毎日走らせると同じ記事が何度も来るので、採点は 1 記事 1 回にする。
 */
export interface NewsState {
  /** `${issue}:${nextQuestion}`。問いが変われば採点は無効になる */
  questionKey: string;
  scores: Record<
    string,
    {
      relevance: number;
      importance: number;
      reason: string;
      scoredAt: string;
      /** 台帳の adopted に計上済みか。1 記事を 1 回だけ数えるため */
      counted: boolean;
    }
  >;
  lastDiscovery: { questionKey: string; at: string } | null;
}

export interface GitHubRepo {
  name: string;
  description: string | null;
  language: string | null;
  url: string;
  updatedAt: string;
  commits?: SummarizedContent[];
}
