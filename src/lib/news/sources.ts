import fs from "fs/promises";
import path from "path";
import { NewsSource, NewsCategory } from "../types";

// 巡回先の台帳。無ければシードから作る。
// シードはユーザーが選んだ巡回先で、貢献度では止めない（news-evolve.ts を参照）。

const researchDirectory = path.join(process.cwd(), "content", "research");
export const sourcesPath = path.join(researchDirectory, "news-sources.json");

type Seed = {
  name: string;
  url: string;
  category: NewsCategory;
  /** RSS が存在しない巡回先。台帳には残すが取りに行かない */
  unavailable?: string;
};

export const seedSources: Seed[] = [
  // 国内技術コミュニティ
  { name: "Zenn", url: "https://zenn.dev/feed", category: "community" },
  { name: "Qiita", url: "https://qiita.com/popular-items/feed", category: "community" },
  // 公式・ベンダー
  { name: "OpenAI", url: "https://openai.com/news/rss.xml", category: "vendor" },
  { name: "Anthropic", url: "https://www.anthropic.com/news", category: "vendor", unavailable: "no RSS/Atom published (2026-09)" },
  { name: "Google AI", url: "https://blog.google/technology/ai/rss/", category: "vendor" },
  { name: "Google DeepMind", url: "https://deepmind.google/blog/rss.xml", category: "vendor" },
  { name: "Hugging Face", url: "https://huggingface.co/blog/feed.xml", category: "vendor" },
  // blogs.microsoft.com/ai は 410 Gone。公式ブログ本体に統合された
  { name: "Microsoft Blog", url: "https://blogs.microsoft.com/feed/", category: "vendor" },
  { name: "Meta AI", url: "https://ai.meta.com/blog/", category: "vendor", unavailable: "no RSS/Atom published (2026-09)" },
  { name: "Mistral AI", url: "https://mistral.ai/news/rss", category: "vendor" },
  { name: "NVIDIA", url: "https://blogs.nvidia.com/feed/", category: "vendor" },
  { name: "AWS Machine Learning", url: "https://aws.amazon.com/blogs/machine-learning/feed/", category: "vendor" },
  // 開発者コミュニティ
  { name: "GitHub Blog AI/ML", url: "https://github.blog/ai-and-ml/feed/", category: "developer" },
  { name: "LangChain", url: "https://blog.langchain.com/rss.xml", category: "developer" },
  // llamaindex.ai 自体は feed を持たない。Medium 側は 2024 年で更新停止
  { name: "LlamaIndex", url: "https://medium.com/feed/llamaindex-blog", category: "developer" },
  { name: "Hacker News", url: "https://hnrss.org/frontpage", category: "developer" },
  // 研究
  { name: "arXiv cs.AI", url: "https://rss.arxiv.org/rss/cs.AI", category: "research" },
  { name: "arXiv cs.CL", url: "https://rss.arxiv.org/rss/cs.CL", category: "research" },
  { name: "Microsoft Research", url: "https://www.microsoft.com/en-us/research/feed/", category: "research" },
  // 海外ニュース・分析
  { name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/", category: "media" },
  { name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/feed/", category: "media" },
  { name: "MIT Technology Review AI", url: "https://www.technologyreview.com/topic/artificial-intelligence/feed", category: "media" },
  // ニュースレター
  { name: "Import AI", url: "https://importai.substack.com/feed", category: "newsletter" },
  { name: "The Batch", url: "https://www.deeplearning.ai/the-batch/", category: "newsletter", unavailable: "no RSS/Atom published (2026-09)" },
  // スライド
  { name: "Speaker Deck Technology", url: "https://speakerdeck.com/c/technology.atom", category: "slides" },
  { name: "Speaker Deck Programming", url: "https://speakerdeck.com/c/programming.atom", category: "slides" },
  { name: "Speaker Deck Research", url: "https://speakerdeck.com/c/research.atom", category: "slides" },
  { name: "Speaker Deck Science", url: "https://speakerdeck.com/c/science.atom", category: "slides" },
];

export function sourceIdFrom(url: string): string {
  const { host, pathname } = new URL(url);
  return `${host}${pathname}`
    .replace(/^www\./, "")
    .replace(/\.(rss|xml|atom)$/i, "")
    .replace(/\/(feed|rss|atom|index)\/?$/i, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export function newSource(
  seed: Seed & { origin?: NewsSource["origin"]; status?: NewsSource["status"] }
): NewsSource {
  return {
    id: sourceIdFrom(seed.url),
    name: seed.name,
    url: seed.url,
    category: seed.category,
    status: seed.status ?? "active",
    origin: seed.origin ?? "seed",
    addedAt: new Date().toISOString(),
    stoppedAt: null,
    stoppedReason: null,
    stats: {
      runs: 0,
      fetched: 0,
      adopted: 0,
      lastAdoptedAt: null,
      runsAtLastAdoption: 0,
      consecutiveErrors: 0,
      lastError: null,
    },
  };
}

export async function loadSources(): Promise<NewsSource[]> {
  try {
    return JSON.parse(await fs.readFile(sourcesPath, "utf-8")) as NewsSource[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    console.log("  news-sources.json not found; creating from seed");
    return seedSources.map((seed) => {
      const source = newSource(seed);
      if (seed.unavailable) stopSource(source, `feed not found: ${seed.unavailable}`);
      return source;
    });
  }
}

export async function saveSources(sources: NewsSource[]): Promise<void> {
  await fs.writeFile(sourcesPath, `${JSON.stringify(sources, null, 2)}\n`);
}

export function stopSource(source: NewsSource, reason: string): void {
  source.status = "stopped";
  source.stoppedAt = new Date().toISOString();
  source.stoppedReason = reason;
}
