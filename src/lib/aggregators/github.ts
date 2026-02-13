import { ContentItem } from "../types";

export async function fetchGitHubActivity(
  username: string
): Promise<ContentItem[]> {
  const items: ContentItem[] = [];

  const reposRes = await fetch(
    `https://api.github.com/users/${username}/repos?sort=updated&per_page=10`,
    { headers: { Accept: "application/vnd.github+json" } }
  );

  if (!reposRes.ok) {
    console.error(`GitHub repos API error: ${reposRes.status}`);
    return [];
  }

  const repos = await reposRes.json();

  for (const repo of repos) {
    items.push({
      id: `github-repo-${repo.id}`,
      source: "github",
      type: "repository",
      title: repo.name,
      content: repo.description || "",
      url: repo.html_url,
      imageUrls: [],
      publishedAt: repo.updated_at,
      metadata: {
        stars: repo.stargazers_count,
        language: repo.language,
        topics: repo.topics,
      },
    });
  }

  const eventsRes = await fetch(
    `https://api.github.com/users/${username}/events/public?per_page=30`,
    { headers: { Accept: "application/vnd.github+json" } }
  );

  if (eventsRes.ok) {
    const events = await eventsRes.json();
    const pushEvents = events
      .filter((e: Record<string, unknown>) => e.type === "PushEvent")
      .slice(0, 10);

    for (const event of pushEvents) {
      const payload = event.payload as { commits?: Array<{ message: string }> };
      const commits = payload.commits || [];
      if (commits.length > 0) {
        const repo = event.repo as { name: string };
        items.push({
          id: `github-push-${event.id}`,
          source: "github",
          type: "commit",
          title: `${repo.name}: ${commits[0].message}`,
          content: commits.map((c) => c.message).join("\n"),
          url: `https://github.com/${repo.name}`,
          imageUrls: [],
          publishedAt: event.created_at as string,
        });
      }
    }
  }

  return items.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
