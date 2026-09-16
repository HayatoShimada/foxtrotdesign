import {
  thoughtSourceLabels,
  WeeknoteThought,
} from "@/lib/weeknote-thought";

export function WeeknoteThoughts({
  thoughts,
}: {
  thoughts: WeeknoteThought[];
}) {
  if (thoughts.length === 0) return null;

  return (
    <div className="space-y-6">
      {thoughts.map((thought) => (
        <div key={thought.id} className="space-y-3">
          <p className="whitespace-pre-line text-base leading-loose">
            {thought.conclusion}
          </p>
          <ul aria-label="参照" className="flex flex-wrap gap-x-4 gap-y-1">
            {thought.sources.map((source) => (
              <li key={source.url} className="text-[0.65rem] text-muted">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground hover:underline"
                >
                  {source.title} / {thoughtSourceLabels[source.kind]} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
