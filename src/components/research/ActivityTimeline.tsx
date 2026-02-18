"use client";

import { useState, useMemo } from "react";
import { format, subWeeks, subMonths, subYears, isAfter } from "date-fns";
import { GitHubRepo } from "@/lib/types";

type Period = "1w" | "1m" | "1y";

export function ActivityTimeline({ repos }: { repos: GitHubRepo[] }) {
    const [period, setPeriod] = useState<Period>("1w");

    // Filter repos that have commits within the selected period
    const { filteredRepos, startDate, endDate } = useMemo(() => {
        const end = new Date();
        let start = new Date();

        switch (period) {
            case "1w":
                start = subWeeks(end, 1);
                break;
            case "1m":
                start = subMonths(end, 1);
                break;
            case "1y":
                start = subYears(end, 1);
                break;
        }

        const relevantRepos = repos
            .map((repo) => {
                const relevantCommits = (repo.commits || []).filter((commit) =>
                    isAfter(new Date(commit.publishedAt), start)
                );
                return { ...repo, relevantCommits };
            })
            .filter((repo) => repo.relevantCommits.length > 0);

        return { filteredRepos: relevantRepos, startDate: start, endDate: end };
    }, [repos, period]);

    // Chart dimensions
    const rowHeight = 60;
    const height = Math.max(200, filteredRepos.length * rowHeight + 40);
    const paddingLeft = 0;
    const paddingRight = 0;
    const paddingTop = 20;

    // Generate grid lines and labels
    const gridLines = useMemo(() => {
        const lines = [];
        const totalDuration = endDate.getTime() - startDate.getTime();

        if (period === "1w") {
            // Daily lines
            let current = new Date(startDate);
            while (current <= endDate) {
                const pos =
                    ((current.getTime() - startDate.getTime()) / totalDuration) * 100;
                lines.push({ pos, label: format(current, "EEE") }); // Mon, Tue...
                current.setDate(current.getDate() + 1);
            }
        } else if (period === "1m") {
            // Every 5 days
            let current = new Date(startDate);
            while (current <= endDate) {
                const day = current.getDate();
                if (day % 5 === 0 || day === 1) {
                    const pos =
                        ((current.getTime() - startDate.getTime()) / totalDuration) * 100;
                    lines.push({ pos, label: String(day) }); // 1, 5, 10...
                }
                current.setDate(current.getDate() + 1);
            }
        } else if (period === "1y") {
            // Monthly
            let current = new Date(startDate);
            current.setDate(1); // Align to month start
            while (current <= endDate) {
                if (current >= startDate) {
                    const pos =
                        ((current.getTime() - startDate.getTime()) / totalDuration) * 100;
                    lines.push({ pos, label: format(current, "MMM") }); // Jan, Feb...
                }
                current.setMonth(current.getMonth() + 1);
            }
        }
        return lines;
    }, [startDate, endDate, period]);

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif font-bold text-lg">Activity Timeline</h2>
                <div className="flex gap-2 text-sm">
                    {(["1w", "1m", "1y"] as Period[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-3 py-1 border transition-colors text-xs ${period === p
                                ? "bg-foreground text-background border-foreground"
                                : "bg-transparent text-muted hover:text-foreground border-border hover:border-foreground"
                                }`}
                        >
                            {p.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="w-full border border-border p-4 bg-background/50">
                <div className="w-full relative" style={{ height: `${height}px` }}>
                    <svg
                        className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden"
                    >
                        {/* Vertical Grid Lines and Labels */}
                        {gridLines.map((line, i) => (
                            <g key={i}>
                                <line
                                    x1={`${line.pos}%`}
                                    y1={paddingTop}
                                    x2={`${line.pos}%`}
                                    y2="100%"
                                    className="stroke-border/50"
                                    strokeWidth="1"
                                    strokeDasharray="2 2"
                                />
                                <text
                                    x={`${line.pos}%`}
                                    y={paddingTop - 10}
                                    textAnchor={
                                        line.pos > 95
                                            ? "end"
                                            : line.pos < 5
                                                ? "start"
                                                : "middle"
                                    }
                                    className="fill-muted text-[10px] uppercase font-mono"
                                >
                                    {line.label}
                                </text>
                            </g>
                        ))}

                        {/* Horizontal Lines and Repo Names */}
                        {filteredRepos.map((repo, i) => {
                            const y = paddingTop + i * rowHeight + rowHeight / 2;
                            return (
                                <g key={repo.name}>
                                    {/* Repo Name (Moved above the line) */}
                                    <text
                                        x="0"
                                        y={y - 8}
                                        className="fill-foreground text-xs font-bold"
                                    >
                                        {repo.name}
                                    </text>
                                    {/* Horizontal Line */}
                                    <line
                                        x1="0"
                                        y1={y}
                                        x2="100%"
                                        y2={y}
                                        className="stroke-border"
                                        strokeWidth="1"
                                    />
                                </g>
                            );
                        })}
                    </svg>

                    {/* Data Points */}
                    <div
                        className="absolute inset-0 w-full h-full"
                        style={{ paddingTop: `${paddingTop}px` }}
                    >
                        {filteredRepos.map((repo, i) => {
                            const y = i * rowHeight + rowHeight / 2;
                            return (
                                <div
                                    key={repo.name}
                                    className="relative w-full h-0"
                                    style={{ top: `${y}px` }}
                                >
                                    {repo.relevantCommits.map((commit) => {
                                        const commitDate = new Date(commit.publishedAt);
                                        const totalDuration =
                                            endDate.getTime() - startDate.getTime();
                                        const position =
                                            commitDate.getTime() - startDate.getTime();
                                        const leftPercent = Math.max(
                                            0,
                                            Math.min(100, (position / totalDuration) * 100)
                                        );

                                        return (
                                            <div
                                                key={commit.id}
                                                className="absolute w-3 h-3 bg-transparent border border-foreground rounded-full -mt-1.5 -ml-1.5 hover:scale-150 hover:bg-background hover:z-50 transition-all cursor-help group"
                                                style={{ left: `${leftPercent}%` }}
                                            >
                                                {/* Tooltip */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] p-2 bg-background border border-border text-xs z-20 hidden group-hover:block shadow-brutal-sm">
                                                    <div className="font-bold mb-1 font-mono">
                                                        {format(commitDate, "yyyy-MM-dd HH:mm")}
                                                    </div>
                                                    <div className="line-clamp-2">
                                                        {commit.summary || commit.title}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>

                    {filteredRepos.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-muted text-sm">
                            No activity in this period
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
