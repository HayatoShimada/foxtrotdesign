import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { LifeIssueThoughts } from "@/components/life-issues/LifeIssueThoughts";
import {
  formatIssueNumber,
  formatJapaneseDate,
  getPublishedLifeIssues,
} from "@/lib/life-issue";

export const metadata: Metadata = {
  title: "LIFE ISSUES | foxtrotdesign",
  description: "Hayato Shimadaのつくったものと、次に考える問い。",
  alternates: {
    types: {
      "application/rss+xml": "/life-issues/rss.xml",
    },
  },
};

export default async function LifeIssueIndexPage() {
  const issues = await getPublishedLifeIssues();
  const [latest, ...archive] = issues;

  return (
    <Container>
      <div className="space-y-12">
        <header className="space-y-4">
          <div className="flex items-center justify-between gap-4 text-xs">
            <p className="font-bold tracking-[0.2em]">IRREGULAR</p>
            <a
              href="/life-issues/rss.xml"
              className="text-muted hover:text-foreground hover:underline"
            >
              RSS ↗
            </a>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold">
            LIFE ISSUES
          </h1>
          <p className="max-w-xl text-muted leading-relaxed">
            つくったものと、次の問い。
            <br />
            GitHub、note、Zenn、画像を一号ずつ束ねた公開制作ログです。
          </p>
        </header>

        {latest ? (
          <section>
            <p className="mb-3 text-xs font-bold tracking-[0.2em]">
              LATEST ISSUE
            </p>
            <article className="border border-foreground p-5 shadow-brutal-sm md:p-7">
              <div className="mb-8 flex items-start justify-between gap-6">
                <Link
                  href={`/life-issues/${formatIssueNumber(latest.issue)}`}
                  className="font-serif text-4xl font-bold hover:underline"
                >
                  #{formatIssueNumber(latest.issue)} →
                </Link>
                <p className="text-right text-xs text-muted">
                  {formatJapaneseDate(latest.publishedAt)}
                </p>
              </div>
              <p className="mb-6 whitespace-pre-line text-base leading-loose">
                {latest.why}
              </p>
              <div className="border-t border-border pt-4">
                <p className="mb-4 text-[0.65rem] font-bold tracking-[0.2em]">
                  NEXT QUESTION
                </p>
                <div className="space-y-6">
                  <p className="whitespace-pre-line text-base leading-loose">
                    {latest.nextQuestion}
                  </p>
                  {latest.aiThoughts && (
                    <LifeIssueThoughts thoughts={latest.aiThoughts} />
                  )}
                  <Link
                    href={`/life-issues/${formatIssueNumber(latest.issue)}`}
                    className="inline-block text-xs font-bold hover:underline"
                  >
                    ISSUE #{formatIssueNumber(latest.issue)} を読む →
                  </Link>
                </div>
              </div>
            </article>
          </section>
        ) : (
          <section className="border border-foreground p-6 shadow-brutal-sm">
            <p className="mb-2 text-xs font-bold tracking-[0.2em]">
              ISSUE #001
            </p>
            <h2 className="mb-3 text-2xl font-serif font-bold">創刊準備中</h2>
            <p className="text-muted">
              今週のWHYとNEXT QUESTIONが揃い次第、最初の号を公開します。
            </p>
          </section>
        )}

        {archive.length > 0 && (
          <section className="border-t border-foreground pt-6">
            <h2 className="mb-2 text-xs font-bold tracking-[0.2em]">
              ALL ISSUES
            </h2>
            <div>
              {archive.map((issue) => (
                <Link
                  key={issue.issue}
                  href={`/life-issues/${formatIssueNumber(issue.issue)}`}
                  className="grid grid-cols-[5rem_1fr] gap-4 border-b border-border py-5 hover:underline"
                >
                  <span className="font-serif text-xl font-bold">
                    #{formatIssueNumber(issue.issue)}
                  </span>
                  <span>
                    <span className="mb-1 block text-xs text-muted">
                      {formatJapaneseDate(issue.publishedAt)}
                    </span>
                    <span className="line-clamp-2">{issue.nextQuestion}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </Container>
  );
}
