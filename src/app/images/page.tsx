import fs from "fs/promises";
import path from "path";
import Image from "next/image";
import { format } from "date-fns";
import { Container } from "@/components/Container";
import { ContentItem } from "@/lib/types";

const sourceLabels: Record<string, string> = {
  notecom: "note.com",
  github: "GitHub",
};

async function getImageContent(): Promise<ContentItem[]> {
  const filePath = path.join(
    process.cwd(),
    "content",
    "research",
    "images.json"
  );

  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const data: ContentItem[] = JSON.parse(raw);
    return data.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  } catch {
    return [];
  }
}

export default async function ImagesPage() {
  const items = await getImageContent();

  return (
    <Container size="lg">
      <div className="space-y-8">
        <div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4">
            Images
          </h1>
          <p className="text-muted">
            各種活動から収集したビジュアルアーカイブ。時系列順に並んでいます。
          </p>
        </div>

        <div className="mt-8 space-y-12">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {item.imageUrls.map((url, idx) => (
                    <a
                      key={idx}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block border border-foreground shadow-brutal-sm hover:shadow-brutal-md transition-shadow overflow-hidden"
                    >
                      <div className="relative aspect-square bg-gray-100">
                        <Image
                          src={url}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                    </a>
                  ))}
                </div>

                <div className="text-sm">
                  <p className="font-bold">{item.title}</p>
                  <p className="text-xs text-muted">
                    {format(new Date(item.publishedAt), "yyyy-MM-dd")} ·{" "}
                    {sourceLabels[item.source] || item.source}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted text-center py-12">
              画像がまだありません。npm run aggregate
              を実行してコンテンツを取得してください。
            </p>
          )}
        </div>
      </div>
    </Container>
  );
}

export const revalidate = 86400;
