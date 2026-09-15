import fs from "fs/promises";
import path from "path";

export type WeeknoteSource = "notecom" | "github" | "bluesky";

export interface WeeknoteEntry {
  source: WeeknoteSource;
  title: string;
  excerpt: string;
  url: string;
  publishedAt: string;
  imageUrl?: string;
}

export interface WeeknoteIssue {
  status: "published";
  issue: number;
  publishedAt: string;
  periodStart: string;
  periodEnd: string;
  made: WeeknoteEntry[];
  found: WeeknoteEntry;
  why: string;
  nextQuestion: string;
}

const weeknoteDirectory = path.join(
  process.cwd(),
  "content",
  "weeknote",
  "issues"
);

export const weeknoteSourceLabels: Record<WeeknoteSource, string> = {
  github: "GitHub",
  notecom: "note.com",
  bluesky: "Bluesky",
};

export function formatIssueNumber(issue: number): string {
  return String(issue).padStart(3, "0");
}

export function formatJapaneseDate(value: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}

export function formatJapaneseDateRange(start: string, end: string): string {
  return `${formatJapaneseDate(start)} — ${formatJapaneseDate(end)}`;
}

function isWeeknoteEntry(value: unknown): value is WeeknoteEntry {
  if (!value || typeof value !== "object") return false;

  const entry = value as Record<string, unknown>;
  return (
    (entry.source === "github" ||
      entry.source === "notecom" ||
      entry.source === "bluesky") &&
    typeof entry.title === "string" &&
    entry.title.trim().length > 0 &&
    typeof entry.excerpt === "string" &&
    typeof entry.url === "string" &&
    entry.url.startsWith("http") &&
    typeof entry.publishedAt === "string" &&
    !Number.isNaN(Date.parse(entry.publishedAt)) &&
    (entry.imageUrl === undefined || typeof entry.imageUrl === "string")
  );
}

function parsePublishedIssue(
  value: unknown,
  fileName: string
): WeeknoteIssue {
  if (!value || typeof value !== "object") {
    throw new Error(`${fileName}: WEEKNOTEのJSON形式が正しくありません`);
  }

  const issue = value as Record<string, unknown>;
  const whyLength =
    typeof issue.why === "string" ? [...issue.why.trim()].length : 0;

  const isValid =
    issue.status === "published" &&
    Number.isInteger(issue.issue) &&
    Number(issue.issue) > 0 &&
    typeof issue.publishedAt === "string" &&
    !Number.isNaN(Date.parse(issue.publishedAt)) &&
    typeof issue.periodStart === "string" &&
    !Number.isNaN(Date.parse(issue.periodStart)) &&
    typeof issue.periodEnd === "string" &&
    !Number.isNaN(Date.parse(issue.periodEnd)) &&
    Array.isArray(issue.made) &&
    issue.made.length > 0 &&
    issue.made.length <= 3 &&
    issue.made.every(isWeeknoteEntry) &&
    isWeeknoteEntry(issue.found) &&
    whyLength >= 100 &&
    whyLength <= 200 &&
    typeof issue.nextQuestion === "string" &&
    issue.nextQuestion.trim().length > 0;

  if (!isValid) {
    throw new Error(
      `${fileName}: 公開号にはMADE（1〜3件）、FOUND、WHY（100〜200字）、NEXT QUESTIONが必要です`
    );
  }

  const parsed = issue as unknown as WeeknoteIssue;
  if (`${formatIssueNumber(parsed.issue)}.json` !== fileName) {
    throw new Error(`${fileName}: ファイル名とissue番号が一致していません`);
  }

  return parsed;
}

export async function getPublishedWeeknotes(): Promise<WeeknoteIssue[]> {
  let fileNames: string[];

  try {
    fileNames = await fs.readdir(weeknoteDirectory);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  const issues = await Promise.all(
    fileNames
      .filter((fileName) => /^\d{3}\.json$/.test(fileName))
      .map(async (fileName) => {
        const raw = await fs.readFile(
          path.join(weeknoteDirectory, fileName),
          "utf-8"
        );
        return parsePublishedIssue(JSON.parse(raw), fileName);
      })
  );

  return issues.sort((a, b) => b.issue - a.issue);
}

export async function getLatestWeeknote(): Promise<WeeknoteIssue | null> {
  const issues = await getPublishedWeeknotes();
  return issues[0] ?? null;
}

export async function getWeeknote(
  issueNumber: string
): Promise<WeeknoteIssue | null> {
  if (!/^\d{3}$/.test(issueNumber)) return null;

  const issues = await getPublishedWeeknotes();
  return (
    issues.find((issue) => formatIssueNumber(issue.issue) === issueNumber) ??
    null
  );
}
