"use client";

import { useState } from "react";
import { ReadingItem } from "@/lib/types";

const kindLabels: Record<ReadingItem["kind"], string> = {
  paper: "PAPER",
  book: "BOOK",
  news: "NEWS",
  other: "OTHER",
};

type Filter = "all" | "unread" | "read";

// 状態の正はメモ側。ここは表示だけで、チェックは押せない。
export function ReadingList({ items }: { items: ReadingItem[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = items.filter((item) => {
    if (filter === "unread") return !item.done;
    if (filter === "read") return item.done;
    return true;
  });

  const unread = items.filter((i) => !i.done).length;
  const read = items.length - unread;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {(
          [
            ["all", `All ${items.length}`],
            ["unread", `Unread ${unread}`],
            ["read", `Read ${read}`],
          ] as const
        ).map(([value, label]) => (
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
          <div key={item.url} className="py-4 first:pt-0 flex gap-3">
            <span
              aria-label={item.done ? "読了" : "未読"}
              className={`font-mono text-sm shrink-0 ${item.done ? "text-muted" : ""}`}
            >
              {item.done ? "[x]" : "[ ]"}
            </span>
            <div className="min-w-0 flex-1">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`font-bold hover:underline ${item.done ? "text-muted" : ""}`}
              >
                {item.title} ↗
              </a>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                <span className="px-2 py-0.5 border border-border">
                  {kindLabels[item.kind]}
                </span>
                {item.done && item.completedAt && <span>{item.completedAt}</span>}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-muted text-center py-12">該当なし.</p>
        )}
      </div>
    </div>
  );
}
