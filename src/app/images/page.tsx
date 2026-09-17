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

const sourceLabels: Record<ContentItem["source"], string> = {
  notecom: "note.com",
  github: "GitHub",
  bluesky: "Bluesky",
  zenn: "Zenn",
};

interface Figure {
  key: string;
  url: string;
  link: string;
  alt: string;
  source: ContentItem["source"];
  publishedAt: string;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}

// 画像は元のアスペクト比のまま。width/height は初期の枠取りで、h-auto が実寸に合わせる。
// 通常はモノクロ、マウスオンでカラー。
function FigureCard({ figure, index, sizes }: { figure: Figure; index: number; sizes: string }) {
  return (
    <figure className="mb-10 break-inside-avoid">
      <a
        href={figure.link}
        target="_blank"
        rel="noopener noreferrer"
        className="group block border border-foreground shadow-brutal-sm hover:shadow-brutal-md transition-shadow overflow-hidden"
      >
        <Image
          src={figure.url}
          alt={figure.alt}
          width={1200}
          height={800}
          sizes={sizes}
          className="w-full h-auto grayscale transition-[filter] duration-300 group-hover:grayscale-0"
        />
      </a>
      <figcaption className="mt-2 grid grid-cols-[3rem_1fr_auto] gap-3 text-xs text-muted">
        <span className="font-mono">{String(index + 1).padStart(3, "0")}</span>
        <span className="truncate">{figure.alt}</span>
        <span className="shrink-0 text-right">
          {sourceLabels[figure.source]}
          <br />
          {formatDate(figure.publishedAt)}
        </span>
      </figcaption>
    </figure>
  );
}

export default async function ImagesPage() {
  const items = await getImageContent();
  const figures: Figure[] = items.flatMap((item) =>
    item.imageUrls.map((url, i) => ({
      key: `${item.id}-${i}`,
      url,
      link: item.url,
      alt: item.title,
      source: item.source,
      publishedAt: item.publishedAt,
    }))
  );
  // 先頭 1 枚を全幅のリード、残りを 2 段組の縦流し（雑誌の見開きの要領）
  const [lead, ...rest] = figures;

  return (
    <Container size="lg">
      <div className="mb-10">
        <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4">
          Images
        </h1>
        <p className="text-muted">
          各種活動から集めたビジュアル.{" "}
          <span className="font-mono text-xs">{figures.length} FIGURES</span>
        </p>
      </div>

      {lead ? (
        <>
          <FigureCard figure={lead} index={0} sizes="(max-width: 768px) 100vw, 768px" />
          <div className="columns-1 md:columns-2 gap-8">
            {rest.map((figure, idx) => (
              <FigureCard
                key={figure.key}
                figure={figure}
                index={idx + 1}
                sizes="(max-width: 768px) 100vw, 384px"
              />
            ))}
          </div>
        </>
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
