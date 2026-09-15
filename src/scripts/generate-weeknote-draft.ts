import fs from "fs/promises";
import path from "path";
import { ContentItem, SummarizedContent } from "../lib/types";
import {
  formatIssueNumber,
  WeeknoteEntry,
  WeeknoteSource,
} from "../lib/weeknote";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const researchDirectory = path.join(process.cwd(), "content", "research");
const weeknoteDirectory = path.join(process.cwd(), "content", "weeknote");
const issueDirectory = path.join(weeknoteDirectory, "issues");

interface DraftCandidate {
  id: string;
  source: WeeknoteSource;
  title: string;
  excerpt: string;
  url: string;
  publishedAt: string;
  imageUrls: string[];
  metadata?: Record<string, unknown>;
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf-8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    throw error;
  }
}

function clip(text: string, length = 180): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  const characters = [...normalized];
  return characters.length > length
    ? `${characters.slice(0, length).join("")}…`
    : normalized;
}

function toEntry(candidate: DraftCandidate): WeeknoteEntry {
  const excerpt =
    candidate.source === "github"
      ? candidate.excerpt.split(/\r?\n/, 1)[0]
      : candidate.excerpt;

  return {
    source: candidate.source,
    title: candidate.title,
    excerpt: clip(excerpt),
    url: candidate.url,
    publishedAt: candidate.publishedAt,
    ...(candidate.imageUrls[0] ? { imageUrl: candidate.imageUrls[0] } : {}),
  };
}

function isRoutineGitHubCandidate(candidate: DraftCandidate): boolean {
  return (
    candidate.source === "github" &&
    /^(merge (pull request|branch)|chore:\s*update .*history)/i.test(
      candidate.excerpt.trim()
    )
  );
}

async function getNextIssueNumber(): Promise<number> {
  try {
    const fileNames = await fs.readdir(issueDirectory);
    const numbers = fileNames
      .map((fileName) => fileName.match(/^(\d{3})\.json$/)?.[1])
      .filter((value): value is string => Boolean(value))
      .map(Number);

    return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return 1;
    throw error;
  }
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getJapanDate(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tokyo",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;

  return `${part("year")}-${part("month")}-${part("day")}`;
}

function getPeriod() {
  const periodEnd = process.env.WEEKNOTE_END_DATE || getJapanDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(periodEnd)) {
    throw new Error("WEEKNOTE_END_DATEはYYYY-MM-DD形式で指定してください");
  }

  const endDate = new Date(`${periodEnd}T00:00:00Z`);
  if (Number.isNaN(endDate.getTime())) {
    throw new Error("WEEKNOTE_END_DATEは実在する日付を指定してください");
  }

  const periodStart = isoDate(new Date(endDate.getTime() - 6 * DAY_IN_MS));
  return {
    periodStart,
    periodEnd,
    startBoundary: new Date(`${periodStart}T00:00:00+09:00`),
    endBoundary: new Date(`${periodEnd}T23:59:59.999+09:00`),
  };
}

async function main() {
  const [summaries, imageItems, nextIssue] = await Promise.all([
    readJson<SummarizedContent[]>(
      path.join(researchDirectory, "summarized.json"),
      []
    ),
    readJson<ContentItem[]>(path.join(researchDirectory, "images.json"), []),
    getNextIssueNumber(),
  ]);

  const imagesById = new Map(imageItems.map((item) => [item.id, item]));
  const summaryIds = new Set(summaries.map((item) => item.id));
  const candidates: DraftCandidate[] = summaries.map((item) => ({
    id: item.id,
    source: item.source,
    title: item.title,
    excerpt: item.summary,
    url: item.url,
    publishedAt: item.publishedAt,
    imageUrls:
      item.imageUrls.length > 0
        ? item.imageUrls
        : imagesById.get(item.id)?.imageUrls ?? [],
    metadata: item.metadata,
  }));

  for (const item of imageItems) {
    if (summaryIds.has(item.id)) continue;
    candidates.push({
      id: item.id,
      source: item.source,
      title: item.title,
      excerpt: item.content,
      url: item.url,
      publishedAt: item.publishedAt,
      imageUrls: item.imageUrls,
      metadata: item.metadata,
    });
  }

  const period = getPeriod();
  const recent = candidates
    .filter((item) => {
      const publishedAt = new Date(item.publishedAt).getTime();
      return (
        !Number.isNaN(publishedAt) &&
        publishedAt >= period.startBoundary.getTime() &&
        publishedAt <= period.endBoundary.getTime()
      );
    })
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() -
        new Date(a.publishedAt).getTime()
    );

  const foundCandidate = recent.find(
    (item) => item.source !== "github" || item.imageUrls.length > 0
  );
  const madeCandidates = [
    ...recent.filter(
      (item) => item.source === "github" && !isRoutineGitHubCandidate(item)
    ),
    ...recent.filter((item) => item.source !== "github"),
    ...recent.filter(isRoutineGitHubCandidate),
  ];
  const made: WeeknoteEntry[] = [];
  const usedProjects = new Set<string>();

  for (const candidate of madeCandidates) {
    if (candidate.id === foundCandidate?.id) continue;

    const project =
      candidate.source === "github"
        ? `github:${String(candidate.metadata?.repo ?? candidate.title)}`
        : candidate.id;
    if (usedProjects.has(project)) continue;

    made.push(toEntry(candidate));
    usedProjects.add(project);
    if (made.length === 3) break;
  }

  const draft = {
    status: "draft",
    issue: nextIssue,
    publishedAt: null,
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
    made,
    found: foundCandidate ? toEntry(foundCandidate) : null,
    why: "",
    nextQuestion: "",
    publishTo: `content/weeknote/issues/${formatIssueNumber(nextIssue)}.json`,
    note: "WHY（100〜200字）とNEXT QUESTIONを本人確認後に追記し、statusをpublished、publishedAtを公開日にしてpublishToへ保存すると公開されます。",
  };

  await fs.mkdir(issueDirectory, { recursive: true });
  await fs.writeFile(
    path.join(weeknoteDirectory, "draft.json"),
    `${JSON.stringify(draft, null, 2)}\n`
  );

  console.log(
    `WEEKNOTE #${formatIssueNumber(nextIssue)} draft: ${made.length} MADE / ${
      foundCandidate ? "1" : "0"
    } FOUND (${period.periodStart} — ${period.periodEnd})`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
