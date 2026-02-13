import { NextRequest, NextResponse } from "next/server";
import { fetchGitHubActivity } from "@/lib/aggregators/github";
import {
  fetchNoteComArticles,
  fetchNoteComFullArticles,
} from "@/lib/aggregators/notecom";
import { batchSummarize, updateNotePrompt } from "@/lib/gemini";
import { NoteArticle } from "@/lib/aggregators/notecom";
import { ContentItem, SummarizedContent } from "@/lib/types";
import fs from "fs/promises";
import path from "path";

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

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

    const cache = await loadCache();
    const summarized = await batchSummarize(allItems, cache);

    // Preserve cached items from sources that failed to fetch
    const fetchedIds = new Set(summarized.map((item) => item.id));
    const preserved: SummarizedContent[] = [];
    for (const [id, cached] of cache) {
      if (!fetchedIds.has(id)) {
        preserved.push(cached);
      }
    }
    const allSummarized = [...summarized, ...preserved].sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    const imageItems = allItems.filter((item) => item.imageUrls.length > 0);

    const contentDir = path.join(process.cwd(), "content", "research");
    await fs.mkdir(contentDir, { recursive: true });

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

    const { articles: allArticles, newArticles } =
      await fetchNoteComFullArticles(noteUsername, articlesCache);

    // Update note-prompt.txt if there are new articles
    let notePromptUpdated = false;
    if (newArticles.length > 0) {
      let existingNotePrompt = "";
      try {
        existingNotePrompt = await fs.readFile(
          path.join(contentDir, "note-prompt.txt"),
          "utf-8"
        );
      } catch {
        // First time
      }
      const articlesToProcess = existingNotePrompt
        ? newArticles
        : allArticles;
      const updatedNotePrompt = await updateNotePrompt(
        articlesToProcess,
        existingNotePrompt
      );
      await fs.writeFile(
        path.join(contentDir, "note-prompt.txt"),
        updatedNotePrompt
      );
      notePromptUpdated = true;
    }

    await Promise.all([
      fs.writeFile(
        path.join(contentDir, "summarized.json"),
        JSON.stringify(allSummarized, null, 2)
      ),
      fs.writeFile(
        path.join(contentDir, "images.json"),
        JSON.stringify(imageItems, null, 2)
      ),
      fs.writeFile(
        path.join(contentDir, "articles.json"),
        JSON.stringify(allArticles, null, 2)
      ),
    ]);

    return NextResponse.json({
      success: true,
      counts: {
        github: githubItems.length,
        notecom: noteItems.length,
        summarized: allSummarized.length,
        images: imageItems.length,
        articles: allArticles.length,
        newArticles: newArticles.length,
      },
      notePromptUpdated,
    });
  } catch (error) {
    console.error("Aggregation failed:", error);
    return NextResponse.json(
      { error: "Aggregation failed" },
      { status: 500 }
    );
  }
}
