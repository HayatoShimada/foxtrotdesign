"use client";

import { useState } from "react";
import { SummarizedContent } from "@/lib/types";
import { ResearchItem } from "./ResearchItem";

type Filter = "all" | "notecom" | "github";

export function ResearchList({ items }: { items: SummarizedContent[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered =
    filter === "all" ? items : items.filter((item) => item.source === filter);

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {([
          ["all", "All"],
          ["notecom", "note.com"],
          ["github", "GitHub"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`text-xs px-2 py-1 border transition-colors ${
              filter === value
                ? "border-foreground text-foreground"
                : "border-border text-muted hover:text-foreground hover:border-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="divide-y divide-border">
        {filtered.map((item) => (
          <ResearchItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
