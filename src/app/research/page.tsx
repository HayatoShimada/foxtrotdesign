import fs from "fs/promises";
import path from "path";
import { Container } from "@/components/Container";
import { RepoList } from "@/components/research/RepoList";
import { ResearchList } from "@/components/research/ResearchList";
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

  return (
    <Container>
      <div className="space-y-8">
        <div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4">
            Research
          </h1>
          <p className="text-muted">
            note.com,GitHubでの活動まとめ.<br />
            各種プロジェクトやアイデアの記録を時系列で追跡できます.
          </p>
        </div>

        {repos.length > 0 && (
          <RepoList repos={repos} username="HayatoShimada" />
        )}

        <div className="mt-8">
          <h2 className="font-serif font-bold text-lg mb-4">Commit History</h2>
            {items.length > 0 ? (
              <ResearchList items={items} />
            ) : (
              <p className="text-muted text-center py-12">
                コンテンツがまだありません.npm run aggregate
                を実行してコンテンツを取得してください.
              </p>
            )}
          </div>
        </div>

    </Container>
  );
}

export const revalidate = 86400;
