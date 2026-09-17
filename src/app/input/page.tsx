import Link from "next/link";
import { Container } from "@/components/Container";
import { CycleNext } from "@/components/CycleNext";
import { ReadingList } from "@/components/research/ReadingList";
import { SuggestedList } from "@/components/research/SuggestedList";
import { getReadingList, getSuggestedReading } from "@/lib/content-data";
import { formatIssueNumber, getLatestLifeIssue } from "@/lib/life-issue";

export default async function InputPage() {
  const [latest, reading, suggested] = await Promise.all([
    getLatestLifeIssue(),
    getReadingList(),
    getSuggestedReading(),
  ]);

  return (
    <Container>
      <div className="space-y-12">
        <div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4">
            Input
          </h1>
          <p className="text-muted">
            いまの問いに答えるために読むもの.<br />
            論文、本、そして次に読むべきものの提案.
          </p>
        </div>

        {latest && (
          <section className="border-t border-foreground pt-8">
            <p className="mb-4 text-xs font-bold tracking-[0.2em]">
              CURRENT QUESTION
            </p>
            <p className="text-2xl md:text-3xl font-serif font-bold leading-snug">
              {latest.nextQuestion}
            </p>
            <Link
              href={`/life-issues/${formatIssueNumber(latest.issue)}`}
              className="mt-4 inline-block text-xs text-muted hover:underline"
            >
              ISSUE #{formatIssueNumber(latest.issue)} より →
            </Link>
          </section>
        )}

        <section className="border-t border-foreground pt-8">
          <p className="mb-4 text-xs font-bold tracking-[0.2em]">01 / READING</p>
          {reading.length > 0 ? (
            <ReadingList items={reading} />
          ) : (
            <p className="text-muted text-center py-12">読書リストはまだありません.</p>
          )}
        </section>

        <section className="border-t border-foreground pt-8">
          <p className="mb-4 text-xs font-bold tracking-[0.2em]">02 / SUGGESTED</p>
          {suggested ? (
            <SuggestedList data={suggested} />
          ) : (
            <p className="text-muted text-center py-12">提案はまだありません.</p>
          )}
        </section>

        <CycleNext
          href="/output"
          label="OUTPUT"
          description="読んだことを、つくることに変える."
        />
      </div>
    </Container>
  );
}

export const revalidate = 86400;
