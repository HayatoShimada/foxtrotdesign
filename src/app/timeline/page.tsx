import fs from "fs/promises";
import path from "path";
import { Container } from "@/components/Container";
import { ActivityTimeline } from "@/components/research/ActivityTimeline";
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

export default async function TimelinePage() {
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
            <div className="space-y-12">
                <div>
                    <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4">
                        Timeline
                    </h1>
                    <p className="text-muted">
                        活動の軌跡と詳細な履歴.<br />
                        いつ、どのプロジェクトに関わっていたかを可視化します.
                    </p>
                </div>

                {reposWithCommits.length > 0 && (
                    <ActivityTimeline repos={reposWithCommits} />
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
