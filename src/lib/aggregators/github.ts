import { ContentItem, GitHubRepo as GitHubRepoType } from "../types";

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: { date: string };
  };
  html_url: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  updated_at: string;
}

export async function fetchGitHubActivity(
  username: string
): Promise<ContentItem[]> {
  const items: ContentItem[] = [];

  const reposRes = await fetch(
    `https://api.github.com/users/${username}/repos?sort=pushed&per_page=10`,
    { headers: { Accept: "application/vnd.github+json" } }
  );

  if (!reposRes.ok) {
    console.error(`GitHub repos API error: ${reposRes.status}`);
    return [];
  }

  const repos: GitHubRepo[] = await reposRes.json();

  // Fetch recent commits for each repo
  const commitFetches = repos.map(async (repo) => {
    const commitsRes = await fetch(
      `https://api.github.com/repos/${repo.full_name}/commits?per_page=5`,
      { headers: { Accept: "application/vnd.github+json" } }
    );

    if (!commitsRes.ok) return [];

    const commits: GitHubCommit[] = await commitsRes.json();

    return commits.map((commit) => ({
      id: `github-commit-${commit.sha.slice(0, 7)}`,
      source: "github" as const,
      type: "commit" as const,
      title: repo.name,
      content: commit.commit.message,
      url: commit.html_url,
      imageUrls: [],
      publishedAt: commit.commit.author.date,
      metadata: {
        repo: repo.name,
        repoUrl: repo.html_url,
        sha: commit.sha.slice(0, 7),
        language: repo.language,
      },
    }));
  });

  const allCommits = await Promise.all(commitFetches);
  items.push(...allCommits.flat());

  return items.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export async function fetchGitHubRepos(
  username: string
): Promise<GitHubRepoType[]> {
  const reposRes = await fetch(
    `https://api.github.com/users/${username}/repos?sort=pushed&per_page=5`,
    { headers: { Accept: "application/vnd.github+json" } }
  );

  if (!reposRes.ok) {
    console.error(`GitHub repos API error: ${reposRes.status}`);
    return [];
  }

  const repos: GitHubRepo[] = await reposRes.json();

  return repos.map((repo) => ({
    name: repo.name,
    description: repo.description,
    language: repo.language,
    url: repo.html_url,
    updatedAt: repo.updated_at,
  }));
}
