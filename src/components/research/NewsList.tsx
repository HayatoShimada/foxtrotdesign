"use client";

import { useState } from "react";
import { NewsCategory, NewsReport } from "@/lib/types";

// 問いに関係するニュース。Pi の timer が毎日入れ替える。
// 件数に上限は無いので、ReadingList と同じチップでカテゴリごとに絞れるようにする。

const categoryLabels: Record<NewsCategory, string> = {
  community: "COMMUNITY",
  vendor: "VENDOR",
  developer: "DEVELOPER",
  research: "RESEARCH",
  media: "MEDIA",
  newsletter: "NEWSLETTER",
  slides: "SLIDES",
  discovered: "DISCOVERED",
};

const categoryOrder = Object.keys(categoryLabels) as NewsCategory[];

// life-issue.ts は fs を import しているのでクライアントからは使えない。同じ書式をここで持つ
const dateFormat = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Tokyo",
});
const formatDate = (value: string) => dateFormat.format(new Date(value));

export function NewsList({ data }: { data: NewsReport }) {
  const [filter, setFilter] = useState<NewsCategory | "all">("all");

  const counts = new Map<NewsCategory, number>();
  for (const item of data.items) {
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }
  const chips: { value: NewsCategory | "all"; label: string; count: number }[] = [
    { value: "all", label: "All", count: data.items.length },
    ...categoryOrder
      .filter((c) => counts.has(c))
      .map((c) => ({ value: c, label: categoryLabels[c], count: counts.get(c)! })),
  ];
  const filtered =
    filter === "all" ? data.items : data.items.filter((item) => item.category === filter);

  return (
    <div>
      <p className="mb-4 text-xs text-muted">
        「{data.question}」に関して {data.items.length} 件.{" "}
        {formatDate(data.generatedAt)} 時点.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {chips.map((chip) => (
          <button
            key={chip.value}
            onClick={() => setFilter(chip.value)}
            className={`px-3 py-1 text-xs border transition-colors ${
              filter === chip.value
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted hover:border-foreground"
            }`}
          >
            {chip.label} {chip.count}
          </button>
        ))}
      </div>

      <div className="divide-y divide-border">
        {filtered.map((item) => (
          <div key={item.url} className="py-4 first:pt-0">
            <div className="flex items-start justify-between gap-4 mb-1">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold hover:underline"
              >
                {item.title} ↗
              </a>
              <span className="text-xs text-muted shrink-0 text-right">
                {item.sourceName}
                <br />
                {formatDate(item.publishedAt)}
              </span>
            </div>
            {item.reason && (
              <p className="text-sm text-muted leading-relaxed">{item.reason}</p>
            )}
            <p className="mt-1 font-mono text-xs text-muted">
              {categoryLabels[item.category]} · REL {item.relevance} · IMP {item.importance}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
