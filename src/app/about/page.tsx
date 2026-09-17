import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { ChatCard } from "@/components/chat/ChatCard";

export const metadata: Metadata = {
  title: "About | foxtrotdesign",
  description:
    "Hayato Shimadaの個人名義 foxtrotdesign について。思考を外に出し、整理し、理解するための場所。",
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
            Hayato Shimadaの,個人としての自由表現の名義.
            <br />
            思考を外に出し,整理し,理解するための場所です.
          </p>
        </header>

        <section className="border-t border-foreground pt-8">
          <h2 className="mb-4 text-2xl font-bold">About</h2>
          <div className="space-y-4 text-muted">
            <p>活動を三つに分けています.</p>
            <dl className="space-y-2 font-mono text-sm">
              <div className="flex gap-4">
                <dt className="w-32 shrink-0 text-foreground">本業</dt>
                <dd>金銭を得るための活動.</dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-32 shrink-0 text-foreground">85-Store</dt>
                <dd>安心を得るための活動.</dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-32 shrink-0 text-foreground">foxtrotdesign</dt>
                <dd>個人の自由表現を行う活動.</dd>
              </div>
            </dl>
            <p>
              エンジニアとしては,Next.js,TypeScript,C#などを用いたフルスタック開発に従事.
              <br />
              アパレルでの経験を活かし,フィジカルとデジタルの境界を探求しています.
            </p>
            <p className="text-xs">
              名前はGenesisのアルバム『Foxtrot』から.特に意味はありません.
            </p>
          </div>
        </section>

        <section className="border-t border-border pt-8">
          <h2 className="mb-4 text-2xl font-bold">Why</h2>
          <div className="space-y-4 text-muted">
            <p>
              私は抽象的な思考パターンを持っています.
              自分の思考を自分で具体的に理解したり,他人に説明できるレベルにするには,一度構造化する必要があります.
              手っ取り早い方法は,人に説明する文章として整理することです.
            </p>
            <pre className="border border-foreground p-4 font-mono text-xs text-foreground">
{`思考する => 整理する => 理解する`}
            </pre>
            <p>
              外に出せる形に成形する過程で整理され,世に出たそれを眺め直すことで「ああ,そういうことだったのか」という理解を得ることもあります.
              誰かに見せる前提で整理すると,人に言えないレベルの思考も,社会との繋がりを保ったまま整理できます.
            </p>
            <p>
              言葉にできない抽象思考,つまづき,もやつきもあります.
              いまは整理するステップをAIに外注できる時代です.
              AIが勝手にラベリングして,他の活動と勝手に紐付けて「これってこうじゃないですかね」とまとめてくれれば,それが正解でなくても「そうじゃなくて,もっとこうなのに」と取捨ができます.
              その過程を俯瞰して眺めたいがために,このサイトの構造を少しずつ変えています.
            </p>
          </div>
        </section>

        <section className="border-t border-border pt-8">
          <h2 className="mb-4 text-2xl font-bold">How</h2>
          <div className="space-y-4 text-muted">
            <pre className="border border-foreground p-4 font-mono text-xs text-foreground">
{`LIFE ISSUES ──→ INPUT ──→ OUTPUT ──┐
問いを立てる    読む      つくる     │
     ↑                              │
     └──────────────────────────────┘`}
            </pre>
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              <li>毎日昼にサイトが再ビルドされる.</li>
              <li>GitHub,note.com,zenn.dev,Blueskyでの活動が収集される.</li>
              <li>収集した文章をAI(Gemini)が1件ずつ要約する.</li>
              <li>要約がOUTPUTとして並ぶ.</li>
            </ol>
            <p className="text-sm">
              LIFE ISSUESは私が書きます.そこで立てた問いが,INPUTの読書リストとAIの選書の入力になります.
              読書リストの既読・未読は手元のメモ帳から取り込みますが,メモの本文はサイトに渡しません.
              AIの提案は私が確認してから公開します.
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
              href="/input"
              className="block border border-foreground p-4 shadow-brutal-sm transition-shadow hover:shadow-brutal-md"
            >
              <h3 className="mb-2 font-bold">INPUT →</h3>
              <p className="text-xs text-muted">
                いまの問いに答えるために読むもの.
              </p>
            </Link>
            <Link
              href="/output"
              className="block border border-foreground p-4 shadow-brutal-sm transition-shadow hover:shadow-brutal-md"
            >
              <h3 className="mb-2 font-bold">OUTPUT →</h3>
              <p className="text-xs text-muted">
                GitHub,note.com,Zenn,Blueskyでつくったものの記録.
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
