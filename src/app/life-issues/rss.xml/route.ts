import {
  formatIssueNumber,
  getPublishedLifeIssues,
  lifeIssueSourceLabels,
} from "@/lib/life-issue";

const siteUrl = "https://foxtrotdesign.dev";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const issues = await getPublishedLifeIssues();
  const items = issues
    .map((issue) => {
      const issueNumber = formatIssueNumber(issue.issue);
      const url = `${siteUrl}/life-issues/${issueNumber}`;
      const sources = [...issue.made, issue.found]
        .map(
          (entry) =>
            `${lifeIssueSourceLabels[entry.source]}: ${entry.title} ${entry.url}`
        )
        .join("\n");
      const collectedThoughts = issue.aiThoughts
        ?.map(
          (thought) =>
            `${thought.conclusion}\n${thought.sources
              .map((source) => `${source.title} ${source.url}`)
              .join("\n")}`
        )
        .join("\n\n");
      const description = [
        issue.why,
        `NEXT QUESTION: ${issue.nextQuestion}`,
        collectedThoughts,
        sources,
      ]
        .filter(Boolean)
        .join("\n\n");

      return `    <item>
      <title>LIFE ISSUES #${issueNumber}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(issue.publishedAt).toUTCString()}</pubDate>
      <description>${escapeXml(description)}</description>
    </item>`;
    })
    .join("\n");

  const latestBuildDate = issues[0]
    ? new Date(issues[0].publishedAt).toUTCString()
    : new Date(0).toUTCString();
  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>LIFE ISSUES — foxtrotdesign</title>
    <link>${siteUrl}/life-issues</link>
    <description>Hayato Shimadaのつくったものと、次に考える問い。</description>
    <language>ja</language>
    <lastBuildDate>${latestBuildDate}</lastBuildDate>
    <atom:link href="${siteUrl}/life-issues/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}

export const dynamic = "force-static";
