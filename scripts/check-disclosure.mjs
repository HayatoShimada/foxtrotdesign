#!/usr/bin/env node
/**
 * 公開前チェック: 公開対象のファイルに機密語が混入していないか検査する。
 *
 * 禁止ワードのリストはリポジトリの外に置く（リスト自体が機密のため）。
 *   既定: /srv/agent-policy/denylist.txt
 *   環境変数 DENYLIST_PATH で変更可。
 *
 * リストが見つからない場合は「検査できなかった」として失敗させる。
 * 黙って通すと、ガードが無い状態に気づけないため。
 *
 * 使い方:
 *   node scripts/check-disclosure.mjs            # content/ と src/ を検査
 *   node scripts/check-disclosure.mjs path...    # 指定パスのみ検査
 */
import fs from "node:fs";
import path from "node:path";

const DENYLIST_PATH = process.env.DENYLIST_PATH || "/srv/agent-policy/denylist.txt";
const DEFAULT_TARGETS = ["content", "src", "public"];
const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "out", "data"]);
const TEXT_EXT = new Set([".json", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".md", ".txt", ".html", ".css"]);

function loadDenylist() {
  if (!fs.existsSync(DENYLIST_PATH)) {
    console.error(`✗ 禁止ワードリストが見つかりません: ${DENYLIST_PATH}`);
    console.error("  検査できないため中断します。DENYLIST_PATH で場所を指定してください。");
    process.exit(2);
  }
  const terms = fs.readFileSync(DENYLIST_PATH, "utf-8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  if (terms.length === 0) {
    console.error(`✗ 禁止ワードリストが空です: ${DENYLIST_PATH}`);
    process.exit(2);
  }
  return terms;
}

function* walk(target) {
  const stat = fs.statSync(target, { throwIfNoEntry: false });
  if (!stat) return;
  if (stat.isFile()) { yield target; return; }
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* walk(path.join(target, entry.name));
    } else if (entry.isFile()) {
      yield path.join(target, entry.name);
    }
  }
}

const terms = loadDenylist();
const targets = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_TARGETS;
const lowered = terms.map((t) => [t, t.toLowerCase()]);
const hits = [];

for (const target of targets) {
  for (const file of walk(target)) {
    if (!TEXT_EXT.has(path.extname(file))) continue;
    let text;
    try { text = fs.readFileSync(file, "utf-8"); } catch { continue; }
    const lower = text.toLowerCase();
    for (const [original, needle] of lowered) {
      let idx = lower.indexOf(needle);
      while (idx !== -1) {
        const line = text.slice(0, idx).split("\n").length;
        const context = text.split("\n")[line - 1]?.trim().slice(0, 100) ?? "";
        hits.push({ file, line, term: original, context });
        idx = lower.indexOf(needle, idx + needle.length);
      }
    }
  }
}

if (hits.length === 0) {
  console.log(`✓ 機密語の混入なし（${terms.length}語を検査）`);
  process.exit(0);
}

console.error(`✗ 公開対象に機密語が ${hits.length}件 見つかりました\n`);
for (const h of hits.slice(0, 50)) {
  console.error(`  ${h.file}:${h.line}  [${h.term}]`);
  console.error(`    ${h.context}`);
}
if (hits.length > 50) console.error(`  ... 他 ${hits.length - 50}件`);
console.error("\n該当箇所を削除するか、公開してよい表現に書き換えてからコミットしてください。");
process.exit(1);
