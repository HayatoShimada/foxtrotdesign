import { Container } from "@/components/Container";
import { CycleNext } from "@/components/CycleNext";
import { ActivityTimeline } from "@/components/research/ActivityTimeline";
import { RepoList } from "@/components/research/RepoList";
import { ResearchList } from "@/components/research/ResearchList";
import { getReposWithCommits } from "@/lib/content-data";

export default async function OutputPage() {
  const { items, repos } = await getReposWithCommits();

  return (
    <Container>
      <div className="space-y-12">
        <div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4">
            Output
          </h1>
          <p className="text-muted">
            つくったものの記録.<br />
            GitHub、note.com、Zenn、Blueskyでの活動を一望します.
          </p>
        </div>

        <section className="border-t border-foreground pt-8">
          <p className="mb-4 text-xs font-bold tracking-[0.2em]">01 / ACTIVITY</p>
          {repos.length > 0 ? (
            <ActivityTimeline repos={repos} />
          ) : (
            <p className="text-muted text-center py-12">活動がありません.</p>
          )}
        </section>

        <section className="border-t border-foreground pt-8">
          <p className="mb-4 text-xs font-bold tracking-[0.2em]">02 / REPOSITORIES</p>
          {repos.length > 0 ? (
            <RepoList repos={repos} username="HayatoShimada" />
          ) : (
            <p className="text-muted text-center py-12">リポジトリがありません.</p>
          )}
        </section>

        <section className="border-t border-foreground pt-8">
          <p className="mb-4 text-xs font-bold tracking-[0.2em]">03 / ALL</p>
          {items.length > 0 ? (
            <ResearchList items={items} />
          ) : (
            <p className="text-muted text-center py-12">
              コンテンツがまだありません.
            </p>
          )}
        </section>

        <CycleNext
          href="/life-issues"
          label="LIFE ISSUES"
          description="つくったものを振り返り、次の問いを立てる."
        />
      </div>
    </Container>
  );
}

export const revalidate = 86400;
