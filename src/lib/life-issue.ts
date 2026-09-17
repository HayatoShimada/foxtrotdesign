import fs from "fs/promises";
import path from "path";
import {
  isLifeIssueThought,
  LifeIssueThought,
} from "./life-issue-thought";

export type LifeIssueSource = "notecom" | "github" | "bluesky" | "zenn";

export interface LifeIssueEntry {
  source: LifeIssueSource;
  title: string;
  excerpt: string;
  url: string;
  publishedAt: string;
  imageUrl?: string;
}

export interface LifeIssue {
  status: "published";
  issue: number;
  publishedAt: string;
  periodStart: string;
  periodEnd: string;
  made: LifeIssueEntry[];
  found: LifeIssueEntry;
  why: string;
  nextQuestion: string;
  aiThoughts?: LifeIssueThought[];
}

const lifeIssueDirectory = path.join(
  process.cwd(),
  "content",
  "life-issues",
  "issues"
);

export const lifeIssueSourceLabels: Record<LifeIssueSource, string> = {
  github: "GitHub",
  notecom: "note.com",
  bluesky: "Bluesky",
  zenn: "Zenn",
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

function isLifeIssueEntry(value: unknown): value is LifeIssueEntry {
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
): LifeIssue {
  if (!value || typeof value !== "object") {
    throw new Error(`${fileName}: LIFE ISSUESのJSON形式が正しくありません`);
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
    issue.made.every(isLifeIssueEntry) &&
    isLifeIssueEntry(issue.found) &&
    whyLength >= 100 &&
    whyLength <= 200 &&
    typeof issue.nextQuestion === "string" &&
    issue.nextQuestion.trim().length > 0 &&
    (issue.aiThoughts === undefined ||
      (Array.isArray(issue.aiThoughts) &&
        issue.aiThoughts.every(isLifeIssueThought)));

  if (!isValid) {
    throw new Error(
      `${fileName}: 公開号にはMADE（1〜3件）、FOUND、WHY（100〜200字）、NEXT QUESTIONが必要です`
    );
  }

  const parsed = issue as unknown as LifeIssue;
  if (`${formatIssueNumber(parsed.issue)}.json` !== fileName) {
    throw new Error(`${fileName}: ファイル名とissue番号が一致していません`);
  }

  return parsed;
}

export async function getPublishedLifeIssues(): Promise<LifeIssue[]> {
  let fileNames: string[];

  try {
    fileNames = await fs.readdir(lifeIssueDirectory);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  const issues = await Promise.all(
    fileNames
      .filter((fileName) => /^\d{3}\.json$/.test(fileName))
      .map(async (fileName) => {
        const raw = await fs.readFile(
          path.join(lifeIssueDirectory, fileName),
          "utf-8"
        );
        return parsePublishedIssue(JSON.parse(raw), fileName);
      })
  );

  return issues.sort((a, b) => b.issue - a.issue);
}

export async function getLatestLifeIssue(): Promise<LifeIssue | null> {
  const issues = await getPublishedLifeIssues();
  return issues[0] ?? null;
}

export async function getLifeIssue(
  issueNumber: string
): Promise<LifeIssue | null> {
  if (!/^\d{3}$/.test(issueNumber)) return null;

  const issues = await getPublishedLifeIssues();
  return (
    issues.find((issue) => formatIssueNumber(issue.issue) === issueNumber) ??
    null
  );
}
