import {
  formatIssueNumber,
  getPublishedWeeknotes,
  weeknoteSourceLabels,
} from "@/lib/weeknote";

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
  const issues = await getPublishedWeeknotes();
  const items = issues
    .map((issue) => {
      const issueNumber = formatIssueNumber(issue.issue);
      const url = `${siteUrl}/weeknote/${issueNumber}`;
      const sources = [...issue.made, issue.found]
        .map(
          (entry) =>
            `${weeknoteSourceLabels[entry.source]}: ${entry.title} ${entry.url}`
        )
        .join("\n");
      const description = [
        issue.why,
        `NEXT QUESTION: ${issue.nextQuestion}`,
        sources,
      ].join("\n\n");

      return `    <item>
      <title>WEEKNOTE #${issueNumber}</title>
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
    <title>WEEKNOTE — foxtrotdesign</title>
    <link>${siteUrl}/weeknote</link>
    <description>Hayato Shimadaの一週間の制作と、次に考える問い。</description>
    <language>ja</language>
    <lastBuildDate>${latestBuildDate}</lastBuildDate>
    <atom:link href="${siteUrl}/weeknote/rss.xml" rel="self" type="application/rss+xml" />
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
