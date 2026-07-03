import type { Metadata } from "next";
import { parseRepoInput } from "@/lib/parse-repo-input";
import { resolveReport } from "@/lib/resolve-report";
import { ReportError } from "@/components/report/ReportError";
import { ReportView } from "@/components/report/ReportView";

// Report generation touches the network — never cache/prerender.
export const dynamic = "force-dynamic";
// 300s (Vercel Pro): headroom for the ~90s on-demand Scorecard run to happen ON Vercel via a
// Fluid-Compute function running the scorecard binary (§7 #4). Fast-path returns in seconds.
export const maxDuration = 300;

type SearchParams = Promise<{ repo?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { repo } = await searchParams;
  const parsed = repo ? parseRepoInput(repo) : null;
  const title = parsed ? `${parsed.owner}/${parsed.repo}` : "Report";
  return { title, robots: { index: false, follow: true } };
}

export default async function ReportPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { repo } = await searchParams;
  const parsed = repo ? parseRepoInput(repo) : null;

  if (!parsed) {
    return (
      <ReportError
        title="That doesn’t look like a repository"
        message="Enter a public GitHub repo as owner/repo (e.g. ossf/scorecard) or a full github.com URL."
      />
    );
  }

  // Resolve to a plain outcome first; render JSX outside the try/catch
  // (react-hooks/error-boundaries: no JSX construction inside try/catch).
  const outcome = await resolveReport(parsed);

  if (outcome.kind === "error") {
    return <ReportError title={outcome.title} message={outcome.message} />;
  }
  return (
    <ReportView
      report={outcome.report}
      source={outcome.source}
      cached={outcome.cached}
    />
  );
}
