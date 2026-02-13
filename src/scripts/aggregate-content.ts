import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "fs/promises";
import path from "path";
import { fetchGitHubActivity } from "../lib/aggregators/github";
import { fetchNoteComArticles } from "../lib/aggregators/notecom";
import { batchSummarize } from "../lib/gemini";
import { ContentItem, SummarizedContent } from "../lib/types";

async function loadCache(): Promise<Map<string, SummarizedContent>> {
  const filePath = path.join(
    process.cwd(),
    "content",
    "research",
    "summarized.json"
  );

  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const data: SummarizedContent[] = JSON.parse(raw);
    return new Map(data.map((item) => [item.id, item]));
  } catch {
    return new Map();
  }
}

const noCache = process.argv.includes("--no-cache");

async function main() {
  console.log(
    `Starting content aggregation...${noCache ? " (no cache)" : ""}`
  );

  const githubUsername = process.env.GITHUB_USERNAME || "HayatoShimada";
  const noteUsername = process.env.NOTE_COM_USERNAME || "85_store";

  const [githubItems, noteItems] = await Promise.all([
    fetchGitHubActivity(githubUsername),
    fetchNoteComArticles(noteUsername),
  ]);

  const allItems: ContentItem[] = [...githubItems, ...noteItems].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  console.log(
    `Fetched ${allItems.length} items (GitHub: ${githubItems.length}, note.com: ${noteItems.length})`
  );

  // Save raw data
  const dataDir = path.join(process.cwd(), "data");
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(
    path.join(dataDir, "content-raw.json"),
    JSON.stringify(allItems, null, 2)
  );

  // Load existing cache (skip if --no-cache)
  const cache = noCache ? new Map() : await loadCache();
  console.log(
    noCache
      ? "Cache disabled, summarizing all items"
      : `Loaded cache: ${cache.size} existing summaries`
  );

  // Summarize (GitHub as-is, note.com via Gemini with cache)
  const summarized = await batchSummarize(allItems, cache);

  // Save summarized content
  const contentDir = path.join(process.cwd(), "content", "research");
  await fs.mkdir(contentDir, { recursive: true });
  await fs.writeFile(
    path.join(contentDir, "summarized.json"),
    JSON.stringify(summarized, null, 2)
  );

  // Save image metadata
  const imageItems = allItems.filter((item) => item.imageUrls.length > 0);
  await fs.writeFile(
    path.join(contentDir, "images.json"),
    JSON.stringify(imageItems, null, 2)
  );

  console.log(
    `Done! ${summarized.length} items (${imageItems.length} with images)`
  );
}

main().catch(console.error);
