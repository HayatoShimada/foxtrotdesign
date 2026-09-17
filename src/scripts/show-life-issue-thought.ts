import {
  readThoughtDraft,
  thoughtSourceLabels,
} from "../lib/life-issue-thought";
import { formatIssueNumber } from "../lib/life-issue";

function getArgument(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function requireIssueNumber(): number {
  const value = getArgument("issue");
  const issue = Number(value);
  if (!value || !Number.isInteger(issue) || issue < 1) {
    throw new Error("--issue にLIFE ISSUESの号数を指定してください");
  }
  return issue;
}

async function main() {
  const issue = requireIssueNumber();
  const requestedEntry = getArgument("entry");
  const draft = await readThoughtDraft(issue);
  if (!draft) {
    throw new Error(
      `LIFE ISSUES #${formatIssueNumber(issue)} の思考ドラフトがありません`
    );
  }

  const entries = draft.entries.filter(
    (entry) =>
      entry.status === "draft" &&
      (!requestedEntry || entry.id === requestedEntry)
  );
  if (entries.length === 0) {
    throw new Error(
      requestedEntry
        ? `${requestedEntry} は未公開ドラフトではありません`
        : "確認待ちの思考ドラフトはありません"
    );
  }

  for (const entry of entries) {
    const sources = entry.sources
      .map(
        (source) =>
          `- ${source.title}（${thoughtSourceLabels[source.kind]}）\n  ${source.url}`
      )
      .join("\n");

    console.log(`【LIFE ISSUES #${formatIssueNumber(issue)} / 公開前確認】

次の問い:
${draft.question}

追記案:
${entry.conclusion}

参照:
${sources}

下書きID: ${entry.id}

この追記をLIFE ISSUESで公開してよければ「OK」と返信してください。
直したい場合は、その内容をこのProjectチャットに書いてください。
---
`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
