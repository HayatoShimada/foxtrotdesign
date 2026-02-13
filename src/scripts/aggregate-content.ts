import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "fs/promises";
import path from "path";
import { fetchGitHubActivity, fetchGitHubRepos } from "../lib/aggregators/github";
import {
  fetchNoteComArticles,
  fetchNoteComFullArticles,
} from "../lib/aggregators/notecom";
import { batchSummarize, updateNotePrompt } from "../lib/gemini";
import { NoteArticle } from "../lib/aggregators/notecom";
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

  const [githubItems, noteItems, githubRepos] = await Promise.all([
    fetchGitHubActivity(githubUsername),
    fetchNoteComArticles(noteUsername),
    fetchGitHubRepos(githubUsername),
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

  // Preserve cached items from sources that failed to fetch
  const fetchedIds = new Set(summarized.map((item) => item.id));
  const preserved: SummarizedContent[] = [];
  for (const [id, cached] of cache) {
    if (!fetchedIds.has(id)) {
      preserved.push(cached);
    }
  }
  if (preserved.length > 0) {
    console.log(`  Preserved ${preserved.length} cached items from failed sources`);
  }

  const allSummarized = [...summarized, ...preserved].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  // Save summarized content
  const contentDir = path.join(process.cwd(), "content", "research");
  await fs.mkdir(contentDir, { recursive: true });
  await fs.writeFile(
    path.join(contentDir, "summarized.json"),
    JSON.stringify(allSummarized, null, 2)
  );

  // Save repos
  await fs.writeFile(
    path.join(contentDir, "repos.json"),
    JSON.stringify(githubRepos, null, 2)
  );
  console.log(`Saved ${githubRepos.length} repos`);

  // Save image metadata
  const imageItems = allItems.filter((item) => item.imageUrls.length > 0);
  await fs.writeFile(
    path.join(contentDir, "images.json"),
    JSON.stringify(imageItems, null, 2)
  );

  // Fetch full note.com articles (with cache)
  let articlesCache: NoteArticle[] = [];
  try {
    const raw = await fs.readFile(
      path.join(contentDir, "articles.json"),
      "utf-8"
    );
    articlesCache = JSON.parse(raw);
  } catch {
    // No cache yet
  }

  console.log("Fetching new note.com articles...");
  const { articles: allArticles, newArticles } =
    await fetchNoteComFullArticles(noteUsername, noCache ? [] : articlesCache);

  await fs.writeFile(
    path.join(contentDir, "articles.json"),
    JSON.stringify(allArticles, null, 2)
  );
  console.log(
    `Articles: ${allArticles.length} total, ${newArticles.length} new`
  );

  // Update note-prompt.txt if there are new articles
  if (newArticles.length > 0 || noCache) {
    console.log("Updating note-prompt.txt with Gemini...");
    let existingNotePrompt = "";
    if (!noCache) {
      try {
        existingNotePrompt = await fs.readFile(
          path.join(contentDir, "note-prompt.txt"),
          "utf-8"
        );
      } catch {
        // First time — will generate from all articles
      }
    }

    const articlesToProcess =
      existingNotePrompt && !noCache ? newArticles : allArticles;
    const updatedNotePrompt = await updateNotePrompt(
      articlesToProcess,
      existingNotePrompt
    );

    await fs.writeFile(
      path.join(contentDir, "note-prompt.txt"),
      updatedNotePrompt
    );
    console.log("note-prompt.txt updated");
  } else {
    console.log("No new articles, note-prompt.txt unchanged");
  }

  console.log(
    `Done! ${allSummarized.length} items (${imageItems.length} with images)`
  );
}

main().catch(console.error);
