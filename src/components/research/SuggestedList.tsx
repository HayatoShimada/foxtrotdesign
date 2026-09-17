import { SuggestedReading } from "@/lib/types";

const kindLabels: Record<SuggestedReading["items"][number]["kind"], string> = {
  paper: "PAPER",
  book: "BOOK",
  news: "NEWS",
  other: "OTHER",
};

// 公開済みの提案だけが渡される。URL が無いものは検索の手がかりを出す。
export function SuggestedList({ data }: { data: SuggestedReading }) {
  return (
    <div>
      <p className="mb-6 text-xs text-muted">
        「{data.question}」に対して、{data.model} が提案. {data.publishedAt}
      </p>
      <div className="divide-y divide-border">
        {data.items.map((item) => (
          <div key={item.title} className="py-4 first:pt-0">
            <div className="flex items-start justify-between gap-4 mb-1">
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold hover:underline"
                >
                  {item.title} ↗
                </a>
              ) : (
                <span className="font-bold">{item.title}</span>
              )}
              <span className="text-xs text-muted shrink-0 px-2 py-0.5 border border-border">
                {kindLabels[item.kind]}
              </span>
            </div>
            <p className="text-sm text-muted leading-relaxed">{item.reason}</p>
            {!item.url && (
              <p className="mt-1 text-xs text-muted">
                検索: <code className="font-mono">{item.searchHint}</code>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
