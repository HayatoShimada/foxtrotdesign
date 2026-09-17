import fs from "fs/promises";
import path from "path";
import {
  SummarizedContent,
  GitHubRepo,
  ReadingItem,
  SuggestedReading,
  NewsReport,
} from "./types";

// /input と /output が同じデータを別の切り口で見せる。
// ローダーは一箇所に置き、両ページから使う。

const researchDirectory = path.join(process.cwd(), "content", "research");

export async function getResearchContent(): Promise<SummarizedContent[]> {
  try {
    const raw = await fs.readFile(
      path.join(researchDirectory, "summarized.json"),
      "utf-8"
    );
    const data: SummarizedContent[] = JSON.parse(raw);
    return data.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  } catch {
    return [];
  }
}

export async function getRepos(): Promise<GitHubRepo[]> {
  try {
    const raw = await fs.readFile(
      path.join(researchDirectory, "repos.json"),
      "utf-8"
    );
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * 読書リスト。Pi 上で `npm run reading:sync` が SilverBullet から生成したもの。
 * Vercel 上では生成できないため、コミット済みの JSON をそのまま読む。
 */
export async function getReadingList(): Promise<ReadingItem[]> {
  try {
    const raw = await fs.readFile(
      path.join(researchDirectory, "reading.json"),
      "utf-8"
    );
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * AI の提案。status が published のときだけ返す。
 * draft は人間が確認するまでサイトに出さない。
 */
export async function getSuggestedReading(): Promise<SuggestedReading | null> {
  try {
    const raw = await fs.readFile(
      path.join(researchDirectory, "suggested.json"),
      "utf-8"
    );
    const data: SuggestedReading = JSON.parse(raw);
    return data.status === "published" ? data : null;
  } catch {
    return null;
  }
}

/**
 * いまの問いに関係するニュース。Pi の timer が `news:sync` で毎日書き換えて push する。
 * Vercel は読むだけ。
 */
export async function getNewsReport(): Promise<NewsReport | null> {
  try {
    const raw = await fs.readFile(
      path.join(researchDirectory, "news.json"),
      "utf-8"
    );
    const data: NewsReport = JSON.parse(raw);
    return data.items.length > 0 ? data : null;
  } catch {
    return null;
  }
}

/**
 * リポジトリに、そのリポジトリのコミットを新しい順で全件付ける。
 * 以前はここで 10 件に切っていたが、ActivityTimeline が期間で絞る前に
 * 切ってしまうため 1y 表示でも 10 個までしか出なかった。
 * RepoList は先頭 1 件しか使わないので、切らずに渡して使う側で絞る。
 */
export async function getReposWithCommits(): Promise<{
  items: SummarizedContent[];
  repos: GitHubRepo[];
}> {
  const [items, repos] = await Promise.all([getResearchContent(), getRepos()]);

  const withCommits = repos.map((repo) => ({
    ...repo,
    commits: items.filter(
      (item) =>
        item.source === "github" &&
        (item.metadata?.repo === repo.name || item.title === repo.name)
    ),
  }));

  return { items, repos: withCommits };
}
