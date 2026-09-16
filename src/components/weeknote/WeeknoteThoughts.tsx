import {
  thoughtSourceLabels,
  WeeknoteThought,
} from "@/lib/weeknote-thought";
import { formatJapaneseDate } from "@/lib/weeknote";

export function WeeknoteThoughts({
  thoughts,
}: {
  thoughts: WeeknoteThought[];
}) {
  if (thoughts.length === 0) return null;

  return (
    <aside
      aria-labelledby="ai-thought-heading"
      className="mt-10 border border-foreground shadow-brutal-sm"
    >
      <div className="flex items-center justify-between gap-4 bg-foreground px-4 py-2 text-[0.65rem] font-bold tracking-[0.16em] text-background">
        <span>HAYATOSHIMADA AI / THOUGHT LOG</span>
        <span>CONFIRMED</span>
      </div>

      <div className="p-5 md:p-7">
        <div className="mb-7 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <h3
            id="ai-thought-heading"
            className="font-serif text-2xl font-bold leading-snug md:text-3xl"
          >
            HayatoShimada AI が考えたこと
          </h3>
          <p className="text-[0.65rem] text-muted">
            HUMAN CONFIRMED / AI WRITTEN
          </p>
        </div>

        <ol className="divide-y divide-foreground border-y border-foreground">
          {thoughts.map((thought, index) => (
            <li
              key={thought.id}
              className="grid gap-5 py-7 md:grid-cols-[7rem_1fr]"
            >
              <div className="text-[0.65rem] leading-relaxed text-muted">
                <p className="font-bold tracking-[0.16em] text-foreground">
                  THOUGHT {String(index + 1).padStart(2, "0")}
                </p>
                <time dateTime={thought.collectedAt}>
                  {formatJapaneseDate(thought.collectedAt)}
                </time>
              </div>

              <div>
                <p className="mb-6 text-base leading-loose">
                  {thought.conclusion}
                </p>
                <div>
                  <p className="mb-2 text-[0.65rem] font-bold tracking-[0.16em]">
                    SOURCES
                  </p>
                  <ul className="space-y-2">
                    {thought.sources.map((source, sourceIndex) => (
                      <li
                        key={source.url}
                        className="grid grid-cols-[1.5rem_1fr_auto] items-start gap-2 border-t border-border pt-2 text-xs"
                      >
                        <span className="text-muted">
                          {String(sourceIndex + 1).padStart(2, "0")}
                        </span>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold hover:underline"
                        >
                          {source.title} ↗
                        </a>
                        <span className="hidden text-[0.6rem] text-muted sm:block">
                          {thoughtSourceLabels[source.kind]}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}
