import Link from "next/link";
import { Container } from "@/components/Container";
import {
  formatIssueNumber,
  formatJapaneseDate,
  formatJapaneseDateRange,
  getLatestWeeknote,
  weeknoteSourceLabels,
} from "@/lib/weeknote";

export default async function Home() {
  const latestWeeknote = await getLatestWeeknote();

  return (
    <Container>
      <div className="space-y-12">
        {latestWeeknote ? (
          <article>
            <header className="border-b border-foreground pb-8">
              <div className="mb-8 flex items-start justify-between gap-6">
                <div>
                  <p className="mb-2 text-xs font-bold tracking-[0.2em]">
                    LATEST WEEKNOTE
                  </p>
                  <h1 className="font-serif text-5xl font-bold md:text-6xl">
                    #{formatIssueNumber(latestWeeknote.issue)}
                  </h1>
                </div>
                <p className="text-right text-xs text-muted">
                  {formatJapaneseDate(latestWeeknote.publishedAt)}
                  <br />
                  {formatJapaneseDateRange(
                    latestWeeknote.periodStart,
                    latestWeeknote.periodEnd
                  )}
                </p>
              </div>
              <p className="font-serif text-3xl font-bold leading-relaxed md:text-4xl">
                {latestWeeknote.nextQuestion}
              </p>
            </header>

            <section className="grid gap-5 border-b border-foreground py-8 md:grid-cols-[8rem_1fr]">
              <h2 className="text-xs font-bold tracking-[0.2em]">01 / MADE</h2>
              <div className="divide-y divide-border">
                {latestWeeknote.made.map((entry) => (
                  <a
                    key={entry.url}
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0 hover:underline"
                  >
                    <span className="font-bold">{entry.title} ↗</span>
                    <span className="shrink-0 text-[0.65rem] text-muted">
                      {weeknoteSourceLabels[entry.source]}
                    </span>
                  </a>
                ))}
              </div>
            </section>

            <section className="grid gap-5 border-b border-foreground py-8 md:grid-cols-[8rem_1fr]">
              <h2 className="text-xs font-bold tracking-[0.2em]">02 / FOUND</h2>
              <a
                href={latestWeeknote.found.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold hover:underline"
              >
                {latestWeeknote.found.title} ↗
              </a>
            </section>

            <section className="grid gap-5 border-b border-foreground py-8 md:grid-cols-[8rem_1fr]">
              <h2 className="text-xs font-bold tracking-[0.2em]">03 / WHY</h2>
              <p className="whitespace-pre-line leading-relaxed">
                {latestWeeknote.why}
              </p>
            </section>

            <section className="grid gap-5 py-8 md:grid-cols-[8rem_1fr]">
              <h2 className="text-xs font-bold tracking-[0.2em]">
                04 / NEXT QUESTION
              </h2>
              <div>
                <p className="mb-6 font-serif text-2xl font-bold leading-relaxed">
                  {latestWeeknote.nextQuestion}
                </p>
                <Link
                  href={`/weeknote/${formatIssueNumber(latestWeeknote.issue)}`}
                  className="inline-block border border-foreground px-4 py-2 font-bold shadow-brutal-sm transition-shadow hover:shadow-brutal-md"
                >
                  ISSUE #{formatIssueNumber(latestWeeknote.issue)} を読む →
                </Link>
              </div>
            </section>
          </article>
        ) : (
          <section className="border border-foreground p-6 shadow-brutal-sm">
            <p className="mb-2 text-xs font-bold tracking-[0.2em]">WEEKNOTE</p>
            <h1 className="mb-3 font-serif text-4xl font-bold">創刊準備中</h1>
            <Link href="/weeknote" className="font-bold hover:underline">
              WEEKNOTEについて →
            </Link>
          </section>
        )}

        <section className="border-t border-foreground pt-8">
          <p className="mb-4 text-xs font-bold tracking-[0.2em]">DIRECTORY</p>
          <div className="grid grid-cols-2 border-l border-t border-foreground md:grid-cols-5">
            {[
              ["/weeknote", "WEEKNOTE"],
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
