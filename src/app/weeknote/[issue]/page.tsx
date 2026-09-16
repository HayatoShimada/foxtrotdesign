import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { WeeknoteThoughts } from "@/components/weeknote/WeeknoteThoughts";
import {
  formatIssueNumber,
  formatJapaneseDate,
  formatJapaneseDateRange,
  getPublishedWeeknotes,
  getWeeknote,
  WeeknoteEntry,
  weeknoteSourceLabels,
} from "@/lib/weeknote";

interface WeeknoteIssuePageProps {
  params: Promise<{ issue: string }>;
}

function SourceLink({ entry }: { entry: WeeknoteEntry }) {
  return (
    <a
      href={entry.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <div className="mb-2 flex items-start justify-between gap-4">
        <h3 className="font-bold group-hover:underline">{entry.title} ↗</h3>
        <span className="shrink-0 border border-border px-2 py-0.5 text-[0.65rem] text-muted">
          {weeknoteSourceLabels[entry.source]}
        </span>
      </div>
      {entry.excerpt && (
        <p className="text-sm leading-relaxed text-muted">{entry.excerpt}</p>
      )}
    </a>
  );
}

export async function generateStaticParams() {
  const issues = await getPublishedWeeknotes();
  return issues.map((issue) => ({
    issue: formatIssueNumber(issue.issue),
  }));
}

export async function generateMetadata({
  params,
}: WeeknoteIssuePageProps): Promise<Metadata> {
  const { issue: issueNumber } = await params;
  const issue = await getWeeknote(issueNumber);

  if (!issue) return {};

  return {
    title: `WEEKNOTE #${formatIssueNumber(issue.issue)} | foxtrotdesign`,
    description: `${issue.why} NEXT QUESTION: ${issue.nextQuestion}`,
  };
}

export default async function WeeknoteIssuePage({
  params,
}: WeeknoteIssuePageProps) {
  const { issue: issueNumber } = await params;
  const issue = await getWeeknote(issueNumber);

  if (!issue) notFound();

  return (
    <Container>
      <article>
        <header className="mb-12">
          <Link
            href="/weeknote"
            className="mb-5 inline-block text-xs text-muted hover:text-foreground hover:underline"
          >
            ← WEEKNOTE
          </Link>
          <div className="mb-5 flex items-start justify-between gap-6">
            <h1 className="font-serif text-5xl font-bold md:text-6xl">
              #{formatIssueNumber(issue.issue)}
            </h1>
            <p className="text-right text-xs text-muted">
              PUBLISHED
              <br />
              {formatJapaneseDate(issue.publishedAt)}
            </p>
          </div>
          <p className="border-y border-foreground py-3 text-xs">
            {formatJapaneseDateRange(issue.periodStart, issue.periodEnd)}
          </p>
        </header>

        <div>
          <section className="grid gap-5 border-b border-foreground pb-10 md:grid-cols-[8rem_1fr]">
            <h2 className="text-xs font-bold tracking-[0.2em]">01 / MADE</h2>
            <div className="divide-y divide-border">
              {issue.made.map((entry, index) => (
                <div
                  key={`${entry.url}-${index}`}
                  className="py-5 first:pt-0 last:pb-0"
                >
                  <SourceLink entry={entry} />
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-5 border-b border-foreground py-10 md:grid-cols-[8rem_1fr]">
            <h2 className="text-xs font-bold tracking-[0.2em]">02 / FOUND</h2>
            <div className="space-y-5">
              {issue.found.imageUrl && (
                <a
                  href={issue.found.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative block aspect-[16/9] overflow-hidden border border-foreground bg-background"
                >
                  <Image
                    src={issue.found.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 480px"
                    className="object-cover grayscale"
                  />
                </a>
              )}
              <SourceLink entry={issue.found} />
            </div>
          </section>

          <section className="grid gap-5 border-b border-foreground py-10 md:grid-cols-[8rem_1fr]">
            <h2 className="text-xs font-bold tracking-[0.2em]">03 / WHY</h2>
            <p className="whitespace-pre-line text-base leading-loose">
              {issue.why}
            </p>
          </section>

          <section className="grid gap-5 py-10 md:grid-cols-[8rem_1fr]">
            <h2 className="text-xs font-bold tracking-[0.2em]">
              04 / NEXT QUESTION
            </h2>
            <div>
              <p className="font-serif text-2xl font-bold leading-relaxed md:text-3xl">
                {issue.nextQuestion}
              </p>
              {issue.aiThoughts && (
                <WeeknoteThoughts thoughts={issue.aiThoughts} />
              )}
            </div>
          </section>
        </div>
      </article>
    </Container>
  );
}

export const dynamicParams = false;
