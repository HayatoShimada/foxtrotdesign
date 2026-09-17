import fs from "fs/promises";
import path from "path";
import { formatIssueNumber, parsePublishedIssue } from "../lib/life-issue";

// draft.json → issues/NNN.json。README の手順 1〜4 をそのまま実行する。
// why / nextQuestion は事前に本人の確認を経て draft.json に入っていることが前提で、
// 確認フラグが無ければ何も書かずに失敗する（thought:publish と同じ約束）。

const lifeIssueDirectory = path.join(process.cwd(), "content", "life-issues");
const draftPath = path.join(lifeIssueDirectory, "draft.json");

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

async function main() {
  if (!process.argv.includes("--confirmed-in-project-chat")) {
    throw new Error(
      "公開を中止しました。Hayato の OK 後だけ --confirmed-in-project-chat を付けてください"
    );
  }

  const draft = JSON.parse(await fs.readFile(draftPath, "utf-8"));
  if (draft.status !== "draft") {
    throw new Error(`draft.json の status が draft ではありません: ${draft.status}`);
  }
  const fileName = `${formatIssueNumber(draft.issue)}.json`;
  const target = path.join(lifeIssueDirectory, "issues", fileName);
  try {
    await fs.access(target);
    throw new Error(`${fileName} は既に公開済みです。draft.json の issue 番号を確認してください`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  // publishTo / note は下書き用の案内なので公開 JSON には残さない
  const { publishTo: _publishTo, note: _note, ...rest } = draft;
  void _publishTo;
  void _note;
  const candidate = {
    ...rest,
    status: "published",
    publishedAt: process.env.LIFE_ISSUE_PUBLISH_DATE || getJapanDate(),
  };

  // サイトのローダーと同じ検証を通す。MADE 1〜3 / FOUND / WHY 100〜200字 / NEXT QUESTION
  const issue = parsePublishedIssue(candidate, fileName);

  await fs.writeFile(target, `${JSON.stringify(issue, null, 2)}\n`);
  console.log(`Published LIFE ISSUES #${formatIssueNumber(issue.issue)} → ${target}`);
  console.log(`  NEXT QUESTION: ${issue.nextQuestion}`);
  console.log("Run `npm run check:disclosure`, then commit and push to deploy.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
