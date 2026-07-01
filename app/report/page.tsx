import type { Metadata } from "next";
import { generateReport } from "@/lib/adapters";
import { RepoNotFoundError } from "@/lib/adapters/github";
import { ScorecardNotCoveredError } from "@/lib/adapters/scorecard-adapter";
import { parseRepoInput } from "@/lib/parse-repo-input";
import { getReportStore } from "@/lib/store";
import { ReportError } from "@/components/report/ReportError";
import { ReportView } from "@/components/report/ReportView";

/** Serve a stored report if it was fetched within this window (fast re-runs). */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Report generation touches the network (and may run Docker ~90s) — never cache/prerender.
export const dynamic = "force-dynamic";
export const maxDuration = 120;

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

  const store = getReportStore();

  try {
    // Cache-serve: a recent stored report skips the (possibly ~90s) on-demand run.
    const cached = await store.getLatest(parsed.owner, parsed.repo);
    if (cached && Date.now() - Date.parse(cached.fetchedAt) < CACHE_TTL_MS) {
      return (
        <ReportView report={cached.report} source={cached.scorecardSource} cached />
      );
    }

    const { report, scorecardSource } = await generateReport(parsed.owner, parsed.repo);
    await store.put({
      key: {
        owner: parsed.owner,
        repo: parsed.repo,
        commit: report.repo.commit ?? "unknown",
      },
      report,
      scorecardSource,
      fetchedAt: new Date().toISOString(),
    });
    return <ReportView report={report} source={scorecardSource} />;
  } catch (err) {
    if (err instanceof RepoNotFoundError) {
      return (
        <ReportError
          title="Repository not found"
          message={`We couldn’t find github.com/${parsed.owner}/${parsed.repo}. It may be private, renamed, or misspelled — TrustScope assesses public repos only.`}
        />
      );
    }
    if (err instanceof ScorecardNotCoveredError) {
      return (
        <ReportError
          title="Couldn’t run the Scorecard on demand"
          message={`${parsed.owner}/${parsed.repo} isn’t in the OpenSSF dataset, and the on-demand runner isn’t available in this environment. A container host is required for arbitrary repos (see the README).`}
        />
      );
    }
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return (
      <ReportError
        title="Couldn’t generate the report"
        message={message}
      />
    );
  }
}
