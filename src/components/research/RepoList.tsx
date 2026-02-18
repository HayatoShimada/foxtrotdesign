import { format } from "date-fns";
import { GitHubRepo } from "@/lib/types";

export function RepoList({
  repos,
  username,
}: {
  repos: GitHubRepo[];
  username: string;
}) {
  return (
    <div>
      <h2 className="font-serif font-bold text-lg mb-4">Repositories</h2>
      <div className="divide-y divide-border border-y border-border">
        {repos.map((repo) => {
          const latestCommit = repo.commits && repo.commits.length > 0 ? repo.commits[0] : null;

          return (
            <div
              key={repo.name}
              className="group py-4 px-2 -mx-2 hover:bg-foreground/5 transition-colors"
            >
              <a
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="flex items-baseline gap-4">
                  <h3 className="font-bold text-sm shrink-0 hover:underline">{repo.name}</h3>
                  <span className="ml-auto flex items-center gap-2 shrink-0">
                    {repo.language && (
                      <span className="text-xs text-muted px-1.5 py-0.5 border border-border">
                        {repo.language}
                      </span>
                    )}
                    <span className="text-xs text-muted">
                      {format(new Date(repo.updatedAt), "yyyy-MM-dd")}
                    </span>
                  </span>
                </div>
                {repo.description && (
                  <p className="text-xs text-muted leading-relaxed mt-1">
                    {repo.description}
                  </p>
                )}
                {latestCommit && (
                  <div className="mt-2 text-xs text-muted/80 flex gap-2 items-start">
                    <span className="shrink-0 font-mono">Latest:</span>
                    <span className="line-clamp-1">{latestCommit.summary || latestCommit.title}</span>
                    <span className="ml-auto shrink-0 opacity-70">
                      {format(new Date(latestCommit.publishedAt), "MM-dd")}
                    </span>
                  </div>
                )}
              </a>
            </div>
          );
        })}
      </div>
      <div className="mt-3">
        <a
          href={`https://github.com/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted hover:text-foreground transition-colors"
        >
          More projects →
        </a>
      </div>
    </div>
  );
}
