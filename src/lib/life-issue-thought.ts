import fs from "fs/promises";
import path from "path";

export type LifeIssueThoughtSourceKind =
  | "github"
  | "notecom"
  | "zenn"
  | "rss"
  | "page";

export interface LifeIssueThoughtSource {
  kind: LifeIssueThoughtSourceKind;
  title: string;
  url: string;
}

export interface LifeIssueThought {
  id: string;
  collectedAt: string;
  publishedAt: string;
  conclusion: string;
  sources: LifeIssueThoughtSource[];
}

export interface LifeIssueThoughtDraftEntry {
  id: string;
  status: "draft" | "published";
  collectedAt: string;
  publishedAt?: string;
  conclusion: string;
  sources: LifeIssueThoughtSource[];
}

export interface LifeIssueThoughtDraft {
  issue: number;
  question: string;
  model: string;
  entries: LifeIssueThoughtDraftEntry[];
}

const thoughtDirectory = path.join(
  process.cwd(),
  "content",
  "life-issues",
  "thoughts"
);

function formatIssueNumber(issue: number): string {
  return String(issue).padStart(3, "0");
}

export const thoughtSourceLabels: Record<LifeIssueThoughtSourceKind, string> = {
  github: "GitHub",
  notecom: "note.com",
  zenn: "Zenn",
  rss: "RSS",
  page: "PUBLIC PAGE",
};

export function getThoughtDraftPath(issue: number): string {
  return path.join(
    thoughtDirectory,
    "drafts",
    `${formatIssueNumber(issue)}.json`
  );
}

export function getThoughtDraftMarkdownPath(issue: number): string {
  return path.join(
    thoughtDirectory,
    "drafts",
    `${formatIssueNumber(issue)}.md`
  );
}

export function getThoughtSourceConfigPath(issue: number): string {
  return path.join(
    thoughtDirectory,
    "sources",
    `${formatIssueNumber(issue)}.json`
  );
}

export function isLifeIssueThoughtSource(
  value: unknown
): value is LifeIssueThoughtSource {
  if (!value || typeof value !== "object") return false;

  const source = value as Record<string, unknown>;
  return (
    (source.kind === "github" ||
      source.kind === "notecom" ||
      source.kind === "rss" ||
      source.kind === "page") &&
    typeof source.title === "string" &&
    source.title.trim().length > 0 &&
    typeof source.url === "string" &&
    /^https?:\/\//.test(source.url)
  );
}

function hasValidThoughtContent(value: Record<string, unknown>): boolean {
  const conclusionLength =
    typeof value.conclusion === "string"
      ? [...value.conclusion.trim()].length
      : 0;

  return (
    typeof value.id === "string" &&
    /^[a-z0-9-]+$/.test(value.id) &&
    typeof value.collectedAt === "string" &&
    !Number.isNaN(Date.parse(value.collectedAt)) &&
    conclusionLength >= 80 &&
    conclusionLength <= 320 &&
    Array.isArray(value.sources) &&
    value.sources.length >= 2 &&
    value.sources.length <= 4 &&
    value.sources.every(isLifeIssueThoughtSource) &&
    new Set(
      (value.sources as LifeIssueThoughtSource[]).map((source) => source.url)
    ).size === value.sources.length
  );
}

export function isLifeIssueThought(value: unknown): value is LifeIssueThought {
  if (!value || typeof value !== "object") return false;

  const thought = value as Record<string, unknown>;
  return (
    hasValidThoughtContent(thought) &&
    typeof thought.publishedAt === "string" &&
    !Number.isNaN(Date.parse(thought.publishedAt))
  );
}

export function parseThoughtDraft(
  value: unknown,
  expectedIssue?: number
): LifeIssueThoughtDraft {
  if (!value || typeof value !== "object") {
    throw new Error("思考ドラフトのJSON形式が正しくありません");
  }

  const draft = value as Record<string, unknown>;
  const entries = Array.isArray(draft.entries) ? draft.entries : [];
  const isValid =
    Number.isInteger(draft.issue) &&
    Number(draft.issue) > 0 &&
    (expectedIssue === undefined || draft.issue === expectedIssue) &&
    typeof draft.question === "string" &&
    draft.question.trim().length > 0 &&
    typeof draft.model === "string" &&
    draft.model.trim().length > 0 &&
    entries.every((entry) => {
      if (!entry || typeof entry !== "object") return false;
      const candidate = entry as Record<string, unknown>;
      return (
        (candidate.status === "draft" || candidate.status === "published") &&
        hasValidThoughtContent(candidate) &&
        (candidate.status !== "published" ||
          (typeof candidate.publishedAt === "string" &&
            !Number.isNaN(Date.parse(candidate.publishedAt))))
      );
    });

  if (!isValid) {
    throw new Error(
      "思考ドラフトにはissue、question、modelと、有効なentriesが必要です"
    );
  }

  const parsed = draft as unknown as LifeIssueThoughtDraft;
  if (new Set(parsed.entries.map((entry) => entry.id)).size !== entries.length) {
    throw new Error("思考ドラフトのentry idが重複しています");
  }

  return parsed;
}

export async function readThoughtDraft(
  issue: number
): Promise<LifeIssueThoughtDraft | null> {
  try {
    const raw = await fs.readFile(getThoughtDraftPath(issue), "utf-8");
    return parseThoughtDraft(JSON.parse(raw), issue);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export function thoughtDraftToMarkdown(
  draft: LifeIssueThoughtDraft
): string {
  const issueNumber = formatIssueNumber(draft.issue);
  const entries =
    draft.entries.length === 0
      ? "_まだ思考ドラフトはありません。_"
      : draft.entries
          .map((entry) => {
            const sources = entry.sources
              .map(
                (source) =>
                  `- [${source.title}](${source.url}) — ${thoughtSourceLabels[source.kind]}`
              )
              .join("\n");
            const published =
              entry.status === "published"
                ? ` / published ${entry.publishedAt?.slice(0, 10)}`
                : "";

            return `## ${entry.id}

\`${entry.status}${published}\` / collected ${entry.collectedAt.slice(0, 10)}

${entry.conclusion}

${sources}`;
          })
          .join("\n\n");

  return `# LIFE ISSUES #${issueNumber} — 追記の公開前確認

> このファイルは下書きです。LIFE ISSUESの公開号からは読み込まれません。
> ProjectチャットでHayatoのOKを受けるまで公開しないでください。

## 次の問い

${draft.question}

${entries}

---

確認用テキストは次のコマンドで出力します。

\`\`\`bash
npm run life-issue:thought:show -- --issue ${draft.issue}
\`\`\`

OK後、確認された1件だけを公開号へ追加します。

\`\`\`bash
npm run life-issue:thought:publish -- --issue ${draft.issue} --entry <ENTRY_ID> --confirmed-in-project-chat
\`\`\`
`;
}

export async function writeThoughtDraft(
  draft: LifeIssueThoughtDraft
): Promise<void> {
  parseThoughtDraft(draft, draft.issue);

  const jsonPath = getThoughtDraftPath(draft.issue);
  const markdownPath = getThoughtDraftMarkdownPath(draft.issue);
  await fs.mkdir(path.dirname(jsonPath), { recursive: true });
  await Promise.all([
    fs.writeFile(jsonPath, `${JSON.stringify(draft, null, 2)}\n`),
    fs.writeFile(markdownPath, thoughtDraftToMarkdown(draft)),
  ]);
}
