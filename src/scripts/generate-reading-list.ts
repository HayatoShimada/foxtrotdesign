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
const PAPERS_DIR = path.join(MEMO_ROOT, "Resources", "Papers");
const TARGET = path.join(process.cwd(), "content", "research", "reading.json");

const TASK_RE = /^\s*\*\s\[([ xX])\]\s(.*)$/;
const KINDS = new Set<ReadingItem["kind"]>(["paper", "book", "news"]);

function unquote(v: string): string {
  const t = v.trim();
  const m = /^(["'])(.*)\1$/.exec(t);
  return m ? m[2] : t;
}

/** frontmatter の単純な `key: value` 行だけを読む（本文は読まない）。 */
function parseFrontmatter(text: string): Record<string, string> {
  const m = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  const out: Record<string, string> = {};
  if (!m) return out;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z_][\w-]*):(.*)$/.exec(line);
    if (!kv) continue;
    // 行末コメント（空白 + #）を落としてから引用符を外す
    const raw = kv[2].replace(/\s+#.*$/, "");
    out[kv[1]] = unquote(raw);
  }
  return out;
}

function loadPages(): ReadingItem[] {
  if (!fs.existsSync(PAPERS_DIR)) return [];
  const items: ReadingItem[] = [];
  for (const f of fs.readdirSync(PAPERS_DIR)) {
    if (!f.endsWith(".md")) continue;
    const fm = parseFrontmatter(
      fs.readFileSync(path.join(PAPERS_DIR, f), "utf-8")
    );
    if (!fm.url) continue;
    items.push({
      title: f.slice(0, -3),
      url: fm.url,
      kind: KINDS.has(fm.kind as ReadingItem["kind"])
        ? (fm.kind as ReadingItem["kind"])
        : "other",
      done: fm.status === "read",
      completedAt: fm.completed || null,
    });
  }
  return items;
}

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
  if (!fs.existsSync(MEMO_ROOT)) {
    console.log(`reading.json: ソースが無いためスキップ (${MEMO_ROOT})`);
    return;
  }

  const legacy = fs.existsSync(SOURCE)
    ? fs
        .readFileSync(SOURCE, "utf-8")
        .split(/\r?\n/)
        .map(parseTask)
        .filter((x): x is ReadingItem => x !== null)
    : [];

  // ページが優先。URL が同じ旧チェックボックス行は捨てる。
  const byUrl = new Map<string, ReadingItem>();
  for (const it of [...loadPages(), ...legacy]) {
    if (!byUrl.has(it.url)) byUrl.set(it.url, it);
  }
  // 未読を先に、同じ状態の中ではタイトル順（安定）
  const items = [...byUrl.values()].sort(
    (a, b) =>
      Number(a.done) - Number(b.done) || a.title.localeCompare(b.title, "ja")
  );

  fs.mkdirSync(path.dirname(TARGET), { recursive: true });
  fs.writeFileSync(TARGET, JSON.stringify(items, null, 2) + "\n", "utf-8");

  const unread = items.filter((i) => !i.done).length;
  console.log(
    `reading.json: ${items.length}件 (未読 ${unread} / 読了 ${items.length - unread})`
  );
}

main();
