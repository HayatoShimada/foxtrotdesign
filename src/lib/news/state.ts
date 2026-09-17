import fs from "fs/promises";
import path from "path";
import { NewsState } from "../types";

// 採点キャッシュと探索の実行履歴。data/ は .gitignore 済みで、Pi でしか使わない。
// 消えても 1 回余分に採点するだけなので git には載せない。

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const MAX_AGE_DAYS = 30;

export const statePath = path.join(process.cwd(), "data", "news-state.json");

export function questionKeyOf(issue: number, question: string): string {
  return `${issue}:${question}`;
}

function emptyState(questionKey: string): NewsState {
  return { questionKey, scores: {}, lastDiscovery: null };
}

/**
 * 問いが変わっていれば採点を全部捨てる（前の問いに対する点数は使えない）。
 * 古い採点も落として、ファイルが無限に育たないようにする。
 */
export async function loadState(questionKey: string): Promise<NewsState> {
  let state: NewsState;
  try {
    state = JSON.parse(await fs.readFile(statePath, "utf-8")) as NewsState;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return emptyState(questionKey);
  }

  if (state.questionKey !== questionKey) {
    console.log("  question changed; discarding cached scores");
    return { ...emptyState(questionKey), lastDiscovery: state.lastDiscovery ?? null };
  }

  const cutoff = Date.now() - MAX_AGE_DAYS * DAY_IN_MS;
  const fresh: NewsState["scores"] = {};
  let dropped = 0;
  for (const [url, entry] of Object.entries(state.scores ?? {})) {
    if (Date.parse(entry.scoredAt) >= cutoff) fresh[url] = entry;
    else dropped += 1;
  }
  if (dropped > 0) console.log(`  pruned ${dropped} scores older than ${MAX_AGE_DAYS} days`);

  return { ...state, scores: fresh };
}

export async function saveState(state: NewsState): Promise<void> {
  await fs.mkdir(path.dirname(statePath), { recursive: true });
  await fs.writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
}
