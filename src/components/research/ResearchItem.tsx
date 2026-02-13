import { format } from "date-fns";
import { SummarizedContent } from "@/lib/types";

const sourceLabels: Record<string, string> = {
  notecom: "note.com",
  github: "GitHub",
};

export function ResearchItem({ item }: { item: SummarizedContent }) {
  return (
    <div className="py-6 first:pt-0">
      <div className="flex items-start justify-between gap-4 mb-2">
        <h3 className="font-bold text-base">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {item.title}
          </a>
        </h3>
        <span className="text-xs text-muted shrink-0">
          {format(new Date(item.publishedAt), "yyyy-MM-dd")}
        </span>
      </div>

      <p className="text-sm text-muted mb-2 leading-relaxed">{item.summary}</p>

      <div className="flex items-center gap-2 text-xs text-muted">
        <span className="px-2 py-0.5 border border-border">
          {sourceLabels[item.source] || item.source}
        </span>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          View source →
        </a>
      </div>
    </div>
  );
}
