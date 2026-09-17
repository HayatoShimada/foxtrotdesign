import { loadSources, saveSources, stopSource } from "../lib/news/sources";

// 台帳の状態遷移。判定の軸は「レポートへの貢献度」だけ。
//   candidate → active   : adopted >= 2
//   candidate → stopped  : runs >= 14 で adopted == 0
//   active(search) → stopped : 最後の採用から 30 runs 貢献なし
//   any → stopped        : 7 回連続で取得失敗
// シード（origin: seed）は貢献度では止めない。ユーザーが選んだ巡回先を AI の判定で消さないため。

const PROMOTE_ADOPTED = 2;
const CANDIDATE_GRACE_RUNS = 14;
const ACTIVE_IDLE_RUNS = 30;
const MAX_CONSECUTIVE_ERRORS = 7;

async function main() {
  const sources = await loadSources();
  const changes: string[] = [];

  for (const source of sources) {
    if (source.status === "stopped") continue;
    const { stats } = source;

    if (stats.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      stopSource(source, `feed unreachable (${stats.consecutiveErrors} consecutive errors)`);
      changes.push(`${source.name}: → stopped (${source.stoppedReason})`);
      continue;
    }

    if (source.status === "candidate") {
      if (stats.adopted >= PROMOTE_ADOPTED) {
        source.status = "active";
        changes.push(`${source.name}: candidate → active (adopted ${stats.adopted})`);
      } else if (stats.runs >= CANDIDATE_GRACE_RUNS && stats.adopted === 0) {
        stopSource(source, `no contribution in ${stats.runs} runs`);
        changes.push(`${source.name}: candidate → stopped (${source.stoppedReason})`);
      }
      continue;
    }

    if (source.origin === "search" && stats.runs - stats.runsAtLastAdoption >= ACTIVE_IDLE_RUNS) {
      stopSource(source, `no contribution in ${stats.runs - stats.runsAtLastAdoption} runs`);
      changes.push(`${source.name}: active → stopped (${source.stoppedReason})`);
    }
  }

  await saveSources(sources);
  const active = sources.filter((s) => s.status === "active").length;
  const candidate = sources.filter((s) => s.status === "candidate").length;
  const stopped = sources.filter((s) => s.status === "stopped").length;
  console.log(`Sources: ${active} active / ${candidate} candidate / ${stopped} stopped`);
  if (changes.length === 0) console.log("No transitions.");
  for (const change of changes) console.log(`- ${change}`);
}

main().catch((error) => {
  console.error("news:evolve failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
