import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { ChatCard } from "@/components/chat/ChatCard";

export const metadata: Metadata = {
  title: "About | foxtrotdesign",
  description:
    "Hayato Shimadaによる、クリエイティブとエンジニアリングを横断する活動について。",
};

export default function AboutPage() {
  return (
    <Container>
      <div className="space-y-10">
        <header>
          <p className="mb-2 text-xs font-bold tracking-[0.2em]">ABOUT</p>
          <h1 className="mb-6 text-5xl font-serif font-bold md:text-6xl">
            foxtrotdesign
          </h1>
          <p className="text-base leading-relaxed">
            Hayato
            Shimadaによるクリエイティブとエンジニアリングの交差点.
            <br />
            アパレルからウェブ開発,デザインまで,技術と美学を融合させた活動を展開しています.
          </p>
        </header>

        <section className="border-t border-foreground pt-8">
          <h2 className="mb-4 text-2xl font-bold">About</h2>
          <div className="space-y-4 text-muted">
            <p>
              <strong className="text-foreground">foxtrotdesign</strong>
              は,プロボノ活動として運営するクリエイティブプロジェクトの総称です.
              <br />
              ウェブサイト制作,グラフィックデザイン,空間デザインなど,様々な形で表現を追求しています.
            </p>
            <p>
              エンジニアとしては,Next.js,TypeScript,C#などを用いたフルスタック開発に従事.
              <br />
              アパレルでの経験を活かし,フィジカルとデジタルの境界を探求しています.
            </p>
          </div>
        </section>

        <section className="border-t border-border pt-8">
          <h2 className="mb-2 text-2xl font-bold">Focus</h2>
          <p className="mb-4 text-xs text-muted">
            最近特に力を入れていること.
          </p>
          <div className="space-y-4">
            <a
              href="https://85-store.com/blog/aymjo79tj"
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-foreground p-4 shadow-brutal-sm transition-shadow hover:shadow-brutal-md"
            >
              <p className="mb-1 text-xs text-muted">Event · 2026.08.23</p>
              <h3 className="mb-2 font-bold">AIの疑問をみんなで解消する会 →</h3>
              <p className="text-xs leading-relaxed text-muted">
                8/23(日) @85-Store.現役AIエンジニアと台湾茶を飲みながら,
                AIの疑問をざっくばらんに語り合う対談・対話会.
                技術と日常の溝を埋める参加型イベント.
              </p>
            </a>
            <a
              href="https://85-store.com/hakoneko"
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-foreground p-4 shadow-brutal-sm transition-shadow hover:shadow-brutal-md"
            >
              <p className="mb-1 text-xs text-muted">Game · iOS</p>
              <h3 className="mb-2 font-bold">ハコネコはこちらを見ている →</h3>
              <p className="text-xs leading-relaxed text-muted">
                一見キュート,中身はハードなコズミックホラー・マージパズル.
                増え続けるモフモフから宇宙を救い,最果ての姿で対消滅させよ.
              </p>
            </a>
            <a
              href="https://github.com/HayatoShimada/assa_movie"
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-foreground p-4 shadow-brutal-sm transition-shadow hover:shadow-brutal-md"
            >
              <p className="mb-1 text-xs text-muted">
                App · KirinukiStudio
              </p>
              <h3 className="mb-2 font-bold">assa_movie →</h3>
              <p className="text-xs leading-relaxed text-muted">
                長尺の対談・イベント動画から,文字起こし・話者分離・字幕・
                切り抜きまでを一気通貫で行うローカルGPU対応アプリ.
              </p>
            </a>
          </div>
        </section>

        <section className="border-t border-border pt-8">
          <h2 className="mb-4 text-2xl font-bold">Explore</h2>
          <div className="space-y-4">
            <Link
              href="/life-issues"
              className="block border border-foreground p-4 shadow-brutal-sm transition-shadow hover:shadow-brutal-md"
            >
              <h3 className="mb-2 font-bold">LIFE ISSUES →</h3>
              <p className="text-xs text-muted">
                つくったものと、次に考える問い。
              </p>
            </Link>
            <Link
              href="/research"
              className="block border border-foreground p-4 shadow-brutal-sm transition-shadow hover:shadow-brutal-md"
            >
              <h3 className="mb-2 font-bold">Research →</h3>
              <p className="text-xs text-muted">
                note.com,GitHub,Blueskyでの活動のまとめ.
              </p>
            </Link>
            <Link
              href="/images"
              className="block border border-foreground p-4 shadow-brutal-sm transition-shadow hover:shadow-brutal-md"
            >
              <h3 className="mb-2 font-bold">Images →</h3>
              <p className="text-xs text-muted">
                各種活動から収集したビジュアルアーカイブ.
              </p>
            </Link>
            <Link
              href="/timeline"
              className="block border border-foreground p-4 shadow-brutal-sm transition-shadow hover:shadow-brutal-md"
            >
              <h3 className="mb-2 font-bold">Timeline →</h3>
              <p className="text-xs text-muted">時系列で追う活動の記録.</p>
            </Link>
            <a
              href="https://85-store.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-foreground p-4 shadow-brutal-sm transition-shadow hover:shadow-brutal-md"
            >
              <h3 className="mb-2 font-bold">85-Store ↗</h3>
              <p className="text-xs text-muted">
                Vintage &amp; New Clothing Select Shop.
              </p>
            </a>
            <ChatCard />
          </div>
        </section>
      </div>
    </Container>
  );
}
