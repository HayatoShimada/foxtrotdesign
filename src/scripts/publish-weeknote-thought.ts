import fs from "fs/promises";
import path from "path";
import {
  isWeeknoteThought,
  readThoughtDraft,
  WeeknoteThought,
  writeThoughtDraft,
} from "../lib/weeknote-thought";
import {
  formatIssueNumber,
  getWeeknote,
  WeeknoteIssue,
} from "../lib/weeknote";

function getArgument(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function requireIssueNumber(): number {
  const value = getArgument("issue");
  const issue = Number(value);
  if (!value || !Number.isInteger(issue) || issue < 1) {
    throw new Error("--issue に公開済みWEEKNOTEの号数を指定してください");
  }
  return issue;
}

async function main() {
  const issueNumber = requireIssueNumber();
  const entryId = getArgument("entry");

  if (!process.argv.includes("--confirmed-in-project-chat")) {
    throw new Error(
      "公開を中止しました。HayatoのOK後だけ --confirmed-in-project-chat を付けてください"
    );
  }
  if (!entryId) {
    throw new Error(
      "Projectチャットで確認した下書きを --entry <ENTRY_ID> で指定してください"
    );
  }

  const [issue, draft] = await Promise.all([
    getWeeknote(formatIssueNumber(issueNumber)),
    readThoughtDraft(issueNumber),
  ]);
  if (!issue) {
    throw new Error(`WEEKNOTE #${formatIssueNumber(issueNumber)} は未公開です`);
  }
  if (!draft) {
    throw new Error("思考ドラフトがありません");
  }
  if (draft.question !== issue.nextQuestion) {
    throw new Error(
      "公開号のNEXT QUESTIONが思考ドラフト作成後に変更されています"
    );
  }

  const draftEntry = draft.entries.find((entry) => entry.id === entryId);
  if (!draftEntry || draftEntry.status !== "draft") {
    throw new Error(`${entryId} は確認待ちの思考ドラフトではありません`);
  }
  if (issue.aiThoughts?.some((thought) => thought.id === entryId)) {
    throw new Error(`${entryId} はすでに公開号へ追加されています`);
  }

  const publishedAt =
    process.env.WEEKNOTE_THOUGHT_PUBLISHED_AT || new Date().toISOString();
  const thought: WeeknoteThought = {
    id: draftEntry.id,
    collectedAt: draftEntry.collectedAt,
    publishedAt,
    conclusion: draftEntry.conclusion,
    sources: draftEntry.sources,
  };
  if (!isWeeknoteThought(thought)) {
    throw new Error("公開しようとした思考データが無効です");
  }

  const updatedIssue: WeeknoteIssue = {
    ...issue,
    aiThoughts: [...(issue.aiThoughts ?? []), thought],
  };
  const issuePath = path.join(
    process.cwd(),
    "content",
    "weeknote",
    "issues",
    `${formatIssueNumber(issueNumber)}.json`
  );

  await fs.writeFile(
    issuePath,
    `${JSON.stringify(updatedIssue, null, 2)}\n`
  );
  await writeThoughtDraft({
    ...draft,
    entries: draft.entries.map((entry) =>
      entry.id === entryId
        ? { ...entry, status: "published" as const, publishedAt }
        : entry
    ),
  });

  console.log(
    `Published ${entryId} to WEEKNOTE #${formatIssueNumber(issueNumber)}.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
