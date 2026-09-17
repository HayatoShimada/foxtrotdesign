/**
 * SilverBullet の読書タスクを content/research/reading.json に投影する。
 *
 * Pi 上でだけ動く。Vercel には /srv/silverbullet が無いので、
 * 見つからなければ何も書かずに終了する（コミット済みの JSON を壊さないため）。
 *
 * AGENTS.md の規約により、メモの本文はコピーしない。
 * タイトル・URL・種別・状態だけを取り出す。
 */
import fs from "fs";
import path from "path";
import { ReadingItem } from "../lib/types";

const MEMO_ROOT = process.env.MEMO_ROOT ?? "/srv/silverbullet";
const SOURCE = path.join(MEMO_ROOT, "Resources", "読みたい論文リスト.md");
const TARGET = path.join(process.cwd(), "content", "research", "reading.json");

const TASK_RE = /^\s*\*\s\[([ xX])\]\s(.*)$/;
const KINDS = new Set<ReadingItem["kind"]>(["paper", "book", "news"]);

function parseTask(line: string): ReadingItem | null {
  const m = TASK_RE.exec(line);
  if (!m) return null;

  let text = m[2];
  const attrs: Record<string, string> = {};
  text = text.replace(/\[([a-z]+):\s*([^\]]*)\]/g, (_, k: string, v: string) => {
    attrs[k] = v.trim();
    return "";
  });

  const tags = [...text.matchAll(/#([A-Za-z0-9_-]+)/g)].map((t) => t[1]);
  text = text.replace(/#[A-Za-z0-9_-]+/g, "").replace(/\s+/g, " ").trim();

  if (!attrs.url || !text) return null;

  const kindTag = tags.find((t): t is ReadingItem["kind"] =>
    KINDS.has(t as ReadingItem["kind"])
  );

  return {
    title: text,
    url: attrs.url,
    kind: kindTag ?? "other",
    done: m[1].toLowerCase() === "x",
    completedAt: attrs.completed ?? null,
  };
}

function main() {
  if (!fs.existsSync(SOURCE)) {
    console.log(`reading.json: ソースが無いためスキップ (${SOURCE})`);
    return;
  }

  const lines = fs.readFileSync(SOURCE, "utf-8").split(/\r?\n/);
  const items = lines.map(parseTask).filter((x): x is ReadingItem => x !== null);

  fs.mkdirSync(path.dirname(TARGET), { recursive: true });
  fs.writeFileSync(TARGET, JSON.stringify(items, null, 2) + "\n", "utf-8");

  const unread = items.filter((i) => !i.done).length;
  console.log(
    `reading.json: ${items.length}件 (未読 ${unread} / 読了 ${items.length - unread})`
  );
}

main();
