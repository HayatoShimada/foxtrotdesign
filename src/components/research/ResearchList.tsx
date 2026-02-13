import { SummarizedContent } from "@/lib/types";
import { ResearchItem } from "./ResearchItem";

export function ResearchList({ items }: { items: SummarizedContent[] }) {
  return (
    <div className="divide-y divide-border">
      {items.map((item) => (
        <ResearchItem key={item.id} item={item} />
      ))}
    </div>
  );
}
