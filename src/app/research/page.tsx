import fs from "fs/promises";
import path from "path";
import { Container } from "@/components/Container";
import { RepoList } from "@/components/research/RepoList";
import { SummarizedContent, GitHubRepo } from "@/lib/types";

async function getResearchContent(): Promise<SummarizedContent[]> {
  const filePath = path.join(
    process.cwd(),
    "content",
    "research",
    "summarized.json"
  );

  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const data: SummarizedContent[] = JSON.parse(raw);
    return data.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  } catch {
    return [];
  }
}

async function getRepos(): Promise<GitHubRepo[]> {
  const filePath = path.join(
    process.cwd(),
    "content",
    "research",
    "repos.json"
  );

  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export default async function ResearchPage() {
  const [items, repos] = await Promise.all([
    getResearchContent(),
    getRepos(),
  ]);

  const reposWithCommits = repos.map(repo => ({
    ...repo,
    commits: items.filter(item =>
      item.source === "github" &&
      ((item as any).metadata?.repo === repo.name || item.title === repo.name)
    ).slice(0, 10)
  }));

  return (
    <Container>
      <div className="space-y-8">
        <div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4">
            Research
          </h1>
          <p className="text-muted">
            GitHubリポジトリ一覧.<br />
            各プロジェクトの概要と直近の活動状況を確認できます.
          </p>
        </div>

        {reposWithCommits.length > 0 ? (
          <RepoList repos={reposWithCommits} username="HayatoShimada" />
        ) : (
          <p className="text-muted text-center py-12">
            リポジトリがありません.
          </p>
        )}
      </div>
    </Container>
  );
}

export const revalidate = 86400;
