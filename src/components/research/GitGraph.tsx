"use client";

import { SummarizedContent } from "@/lib/types";

interface GitGraphProps {
    commits: SummarizedContent[];
}

export function GitGraph({ commits }: GitGraphProps) {
    if (commits.length === 0) return null;

    // Constants for the graph
    const width = 200;
    const height = 40;
    const dotRadius = 2.5;
    const padding = 10;

    // Sort commits by date (oldest first for left-to-right)
    const sortedCommits = [...commits].sort(
        (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
    );

    const points = sortedCommits.map((_, index) => {
        const x = padding + (index * (width - 2 * padding)) / (Math.max(1, sortedCommits.length - 1));
        // Subtle rhythmic variation in Y for a "hand-drawn" or organic feel
        const yArr = [15, 25, 10, 30, 20];
        const y = yArr[index % yArr.length];
        return { x, y };
    });

    // Calculate path
    let pathD = "";
    if (points.length > 1) {
        pathD = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            // Use cubic bezier for smooth curves
            const prev = points[i - 1];
            const curr = points[i];
            const cp1x = prev.x + (curr.x - prev.x) / 2;
            pathD += ` C ${cp1x} ${prev.y}, ${cp1x} ${curr.y}, ${curr.x} ${curr.y}`;
        }
    }

    return (
        <div className="mt-4 opacity-40 hover:opacity-100 transition-opacity">
            <svg
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                className="overflow-visible"
            >
                {/* Main path */}
                {pathD && (
                    <path
                        d={pathD}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-foreground"
                    />
                )}

                {/* Branch-like decorations */}
                {points.map((p, i) => (
                    <g key={i}>
                        <circle
                            cx={p.x}
                            cy={p.y}
                            r={dotRadius}
                            className="fill-foreground"
                        />
                        {i % 3 === 0 && i < points.length - 1 && (
                            <path
                                d={`M ${p.x} ${p.y} Q ${p.x + 10} ${p.y - 10}, ${p.x + 20} ${p.y - 5}`}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="0.5"
                                strokeDasharray="2,2"
                                className="text-muted opacity-50"
                            />
                        )}
                    </g>
                ))}
            </svg>
        </div>
    );
}
