import Link from "next/link";
import { Container } from "@/components/Container";
import { ChatCard } from "@/components/chat/ChatCard";
import { LifeIssueThoughts } from "@/components/life-issues/LifeIssueThoughts";
import {
  formatIssueNumber,
  formatJapaneseDate,
  getLatestLifeIssue,
  lifeIssueSourceLabels,
} from "@/lib/life-issue";

export default async function Home() {
  const latestLifeIssue = await getLatestLifeIssue();

  return (
    <Container>
      <div className="space-y-12">
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

        {latestLifeIssue ? (
          <article>
            <header className="border-b border-foreground pb-8">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="mb-2 text-xs font-bold tracking-[0.2em]">
                    LATEST LIFE ISSUES
                  </p>
                  <h2 className="font-serif text-5xl font-bold md:text-6xl">
                    #{formatIssueNumber(latestLifeIssue.issue)}
                  </h2>
                </div>
                <p className="text-right text-xs text-muted">
                  {formatJapaneseDate(latestLifeIssue.publishedAt)}
                </p>
              </div>
            </header>

            <section className="grid gap-5 border-b border-foreground py-8 md:grid-cols-[8rem_1fr]">
              <h2 className="text-xs font-bold tracking-[0.2em]">01 / MADE</h2>
              <div className="divide-y divide-border">
                {latestLifeIssue.made.map((entry) => (
                  <a
                    key={entry.url}
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0 hover:underline"
                  >
                    <span className="font-bold">{entry.title} ↗</span>
                    <span className="shrink-0 text-[0.65rem] text-muted">
                      {lifeIssueSourceLabels[entry.source]}
                    </span>
                  </a>
                ))}
              </div>
            </section>

            <section className="grid gap-5 border-b border-foreground py-8 md:grid-cols-[8rem_1fr]">
              <h2 className="text-xs font-bold tracking-[0.2em]">02 / FOUND</h2>
              <a
                href={latestLifeIssue.found.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold hover:underline"
              >
                {latestLifeIssue.found.title} ↗
              </a>
            </section>

            <section className="grid gap-5 border-b border-foreground py-8 md:grid-cols-[8rem_1fr]">
              <h2 className="text-xs font-bold tracking-[0.2em]">03 / WHY</h2>
              <p className="whitespace-pre-line text-base leading-loose">
                {latestLifeIssue.why}
              </p>
            </section>

            <section className="grid gap-5 py-8 md:grid-cols-[8rem_1fr]">
              <h2 className="text-xs font-bold tracking-[0.2em]">
                04 / NEXT QUESTION
              </h2>
              <div className="space-y-6">
                <p className="whitespace-pre-line text-base leading-loose">
                  {latestLifeIssue.nextQuestion}
                </p>
                {latestLifeIssue.aiThoughts && (
                  <LifeIssueThoughts thoughts={latestLifeIssue.aiThoughts} />
                )}
                <Link
                  href={`/life-issues/${formatIssueNumber(latestLifeIssue.issue)}`}
                  className="inline-block border border-foreground px-4 py-2 font-bold shadow-brutal-sm transition-shadow hover:shadow-brutal-md"
                >
                  ISSUE #{formatIssueNumber(latestLifeIssue.issue)} を読む →
                </Link>
              </div>
            </section>
          </article>
        ) : (
          <section className="border border-foreground p-6 shadow-brutal-sm">
            <p className="mb-2 text-xs font-bold tracking-[0.2em]">LIFE ISSUES</p>
            <h2 className="mb-3 font-serif text-4xl font-bold">創刊準備中</h2>
            <Link href="/life-issues" className="font-bold hover:underline">
              LIFE ISSUESについて →
            </Link>
          </section>
        )}

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
              href="https://github.com/HayatoShimada/blackbullet"
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-foreground p-4 shadow-brutal-sm transition-shadow hover:shadow-brutal-md"
            >
              <p className="mb-1 text-xs text-muted">App · Local</p>
              <h3 className="mb-2 font-bold">BlackBullet →</h3>
              <p className="text-xs leading-relaxed text-muted">
                ローカルで動く,AIネイティブなMarkdownノートアプリ.
                SilverBulletのフォークに,意味検索・データベース表示・
                ノートへの質問(Ask)・MCPによるAI連携を加えたもの.
              </p>
            </a>
            <a
              href="https://graphic.85-store.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-foreground p-4 shadow-brutal-sm transition-shadow hover:shadow-brutal-md"
            >
              <p className="mb-1 text-xs text-muted">App · Web</p>
              <h3 className="mb-2 font-bold">VividAtmos →</h3>
              <p className="text-xs leading-relaxed text-muted">
                アルゴリズムで柄・色・動きを生成し,画像や動画,ライブ表示として書き出せる
                ジェネレーティブグラフィックのエディタ.
                柄は400種超,VJやサイネージ,SNS投稿にも対応.
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
