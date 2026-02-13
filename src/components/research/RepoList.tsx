import { format } from "date-fns";
import { GitHubRepo } from "@/lib/types";

export function RepoList({ repos }: { repos: GitHubRepo[] }) {
  return (
    <div>
      <h2 className="font-serif font-bold text-lg mb-4">Repositories</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {repos.map((repo) => (
          <a
            key={repo.name}
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block border border-border p-4 hover:shadow-brutal-sm transition-shadow"
          >
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-sm truncate">{repo.name}</h3>
              {repo.language && (
                <span className="text-xs text-muted px-1.5 py-0.5 border border-border shrink-0">
                  {repo.language}
                </span>
              )}
            </div>
            {repo.description && (
              <p className="text-xs text-muted leading-relaxed line-clamp-2 mb-3">
                {repo.description}
              </p>
            )}
            <p className="text-xs text-muted">
              {format(new Date(repo.updatedAt), "yyyy-MM-dd")}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
