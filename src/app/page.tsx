import Link from "next/link";
import { Container } from "@/components/Container";

export default function Home() {
  return (
    <Container>
      <div className="space-y-8">
        <section>
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6">
            foxtrotdesign
          </h1>
          <p className="text-base leading-relaxed">
            Hayato
            Shimadaによるクリエイティブとエンジニアリングの交差点。<br />
            アパレルからウェブ開発、デザインまで、技術と美学を融合させた活動を展開しています。
          </p>
        </section>

        <section className="border-t border-border pt-8">
          <h2 className="text-2xl font-bold mb-4">About</h2>
          <div className="space-y-4 text-muted">
            <p>
              <strong className="text-foreground">foxtrotdesign</strong>
              は、プロボノ活動として運営するクリエイティブプロジェクトの総称です。<br />
              ウェブサイト制作、グラフィックデザイン、空間デザインなど、様々な形で表現を追求しています。
            </p>
            <p>
              エンジニアとしては、Next.js、TypeScript、C#などを用いたフルスタック開発に従事。<br />
              アパレルでの経験を活かし、フィジカルとデジタルの境界を探求しています。
            </p>
          </div>
        </section>

        <section className="border-t border-border pt-8">
          <h2 className="text-2xl font-bold mb-4">Explore</h2>
          <div className="space-y-4">
            <Link
              href="/research"
              className="block border border-foreground p-4 shadow-brutal-sm hover:shadow-brutal-md transition-shadow"
            >
              <h3 className="font-bold mb-2">Research →</h3>
              <p className="text-muted text-xs">
                note.com、GitHubでの活動のまとめ。
              </p>
            </Link>
            <Link
              href="/images"
              className="block border border-foreground p-4 shadow-brutal-sm hover:shadow-brutal-md transition-shadow"
            >
              <h3 className="font-bold mb-2">Images →</h3>
              <p className="text-muted text-xs">
                各種活動から収集したビジュアルアーカイブ。
              </p>
            </Link>
          </div>
        </section>
      </div>
    </Container>
  );
}
