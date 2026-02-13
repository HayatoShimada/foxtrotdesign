import fs from "fs/promises";
import path from "path";
import { Container } from "@/components/Container";
import { ResearchList } from "@/components/research/ResearchList";
import { SummarizedContent } from "@/lib/types";

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

export default async function ResearchPage() {
  const items = await getResearchContent();

  return (
    <Container>
      <div className="space-y-8">
        <div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4">
            Research
          </h1>
          <p className="text-muted">
            note.com、GitHubでの活動をまとめた研究ノート。各種プロジェクトやアイデアの記録を時系列で追跡できます。
          </p>
        </div>

        <div className="mt-8">
          {items.length > 0 ? (
            <ResearchList items={items} />
          ) : (
            <p className="text-muted text-center py-12">
              コンテンツがまだありません。npm run aggregate
              を実行してコンテンツを取得してください。
            </p>
          )}
        </div>
      </div>
    </Container>
  );
}

export const revalidate = 86400;
