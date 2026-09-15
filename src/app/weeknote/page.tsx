import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import {
  formatIssueNumber,
  formatJapaneseDate,
  formatJapaneseDateRange,
  getPublishedWeeknotes,
} from "@/lib/weeknote";

export const metadata: Metadata = {
  title: "WEEKNOTE | foxtrotdesign",
  description: "Hayato Shimadaの一週間の制作と、次に考える問い。",
  alternates: {
    types: {
      "application/rss+xml": "/weeknote/rss.xml",
    },
  },
};

export default async function WeeknotePage() {
  const issues = await getPublishedWeeknotes();
  const [latest, ...archive] = issues;

  return (
    <Container>
      <div className="space-y-12">
        <header className="space-y-4">
          <div className="flex items-center justify-between gap-4 text-xs">
            <p className="font-bold tracking-[0.2em]">WEEKLY / FRIDAY</p>
            <a
              href="/weeknote/rss.xml"
              className="text-muted hover:text-foreground hover:underline"
            >
              RSS ↗
            </a>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold">
            WEEKNOTE
          </h1>
          <p className="max-w-xl text-muted leading-relaxed">
            つくったものと、次の問い。
            <br />
            GitHub、note、画像を一週間ごとに束ねた公開制作ログです。
          </p>
        </header>

        {latest ? (
          <section>
            <p className="mb-3 text-xs font-bold tracking-[0.2em]">
              LATEST ISSUE
            </p>
            <Link
              href={`/weeknote/${formatIssueNumber(latest.issue)}`}
              className="group block border border-foreground p-5 md:p-7 shadow-brutal-sm transition-shadow hover:shadow-brutal-md"
            >
              <div className="mb-8 flex items-start justify-between gap-6">
                <p className="font-serif text-4xl font-bold">
                  #{formatIssueNumber(latest.issue)}
                </p>
                <div className="text-right text-xs text-muted">
                  <p>{formatJapaneseDate(latest.publishedAt)}</p>
                  <p>
                    {formatJapaneseDateRange(
                      latest.periodStart,
                      latest.periodEnd
                    )}
                  </p>
                </div>
              </div>
              <p className="mb-6 whitespace-pre-line text-base leading-relaxed">
                {latest.why}
              </p>
              <div className="border-t border-border pt-4">
                <p className="mb-1 text-[0.65rem] font-bold tracking-[0.2em]">
                  NEXT QUESTION
                </p>
                <p className="font-bold group-hover:underline">
                  {latest.nextQuestion} →
                </p>
              </div>
            </Link>
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
                  href={`/weeknote/${formatIssueNumber(issue.issue)}`}
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
