import fs from "fs/promises";
import path from "path";
import Image from "next/image";
import { Container } from "@/components/Container";
import { ContentItem } from "@/lib/types";

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
  const allImages = items.flatMap((item) =>
    item.imageUrls.map((url) => ({ url, link: item.url, alt: item.title }))
  );

  return (
    <Container>
      <h1 className="text-5xl md:text-6xl font-serif font-bold mb-8">
        Images
      </h1>

      {allImages.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allImages.map((img, idx) => (
            <a
              key={idx}
              href={img.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-foreground shadow-brutal-sm hover:shadow-brutal-md transition-shadow overflow-hidden"
            >
              <div className="relative aspect-square bg-gray-100 dark:bg-gray-900">
                <Image
                  src={img.url}
                  alt={img.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </a>
          ))}
        </div>
      ) : (
        <p className="text-muted text-center py-12">
          画像がまだありません.npm run aggregate
          を実行してコンテンツを取得してください.
        </p>
      )}
    </Container>
  );
}

export const revalidate = 86400;
