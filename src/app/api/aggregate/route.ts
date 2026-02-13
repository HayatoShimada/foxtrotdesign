import { NextRequest, NextResponse } from "next/server";
import { fetchGitHubActivity } from "@/lib/aggregators/github";
import { fetchNoteComArticles } from "@/lib/aggregators/notecom";
import { batchSummarize } from "@/lib/gemini";
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
    const imageItems = allItems.filter((item) => item.imageUrls.length > 0);

    const contentDir = path.join(process.cwd(), "content", "research");
    await fs.mkdir(contentDir, { recursive: true });

    await Promise.all([
      fs.writeFile(
        path.join(contentDir, "summarized.json"),
        JSON.stringify(summarized, null, 2)
      ),
      fs.writeFile(
        path.join(contentDir, "images.json"),
        JSON.stringify(imageItems, null, 2)
      ),
    ]);

    return NextResponse.json({
      success: true,
      counts: {
        github: githubItems.length,
        notecom: noteItems.length,
        summarized: summarized.length,
        images: imageItems.length,
      },
    });
  } catch (error) {
    console.error("Aggregation failed:", error);
    return NextResponse.json(
      { error: "Aggregation failed" },
      { status: 500 }
    );
  }
}
