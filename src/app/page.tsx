import Link from "next/link";
import { Container } from "@/components/Container";
import { LifeIssueThoughts } from "@/components/life-issues/LifeIssueThoughts";
import {
  formatIssueNumber,
  formatJapaneseDate,
  formatJapaneseDateRange,
  getLatestLifeIssue,
  lifeIssueSourceLabels,
} from "@/lib/life-issue";

export default async function Home() {
  const latestLifeIssue = await getLatestLifeIssue();

  return (
    <Container>
      <div className="space-y-12">
        {latestLifeIssue ? (
          <article>
            <header className="border-b border-foreground pb-8">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="mb-2 text-xs font-bold tracking-[0.2em]">
                    LATEST LIFE ISSUES
                  </p>
                  <h1 className="font-serif text-5xl font-bold md:text-6xl">
                    #{formatIssueNumber(latestLifeIssue.issue)}
                  </h1>
                </div>
                <p className="text-right text-xs text-muted">
                  {formatJapaneseDate(latestLifeIssue.publishedAt)}
                  <br />
                  {formatJapaneseDateRange(
                    latestLifeIssue.periodStart,
                    latestLifeIssue.periodEnd
                  )}
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
            <h1 className="mb-3 font-serif text-4xl font-bold">創刊準備中</h1>
            <Link href="/life-issues" className="font-bold hover:underline">
              LIFE ISSUESについて →
            </Link>
          </section>
        )}

        <section className="border-t border-foreground pt-8">
          <p className="mb-4 text-xs font-bold tracking-[0.2em]">DIRECTORY</p>
          <div className="grid grid-cols-2 border-l border-t border-foreground md:grid-cols-5">
            {[
              ["/life-issues", "LIFE ISSUES"],
              ["/about", "ABOUT"],
              ["/research", "RESEARCH"],
              ["/timeline", "TIMELINE"],
              ["/images", "IMAGES"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="border-b border-r border-foreground p-3 text-xs font-bold hover:bg-foreground hover:text-background"
              >
                {label} →
              </Link>
            ))}
          </div>
        </section>
      </div>
    </Container>
  );
}
