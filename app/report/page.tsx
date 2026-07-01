import type { Metadata } from "next";
import { generateReport } from "@/lib/adapters";
import type { ScorecardSource } from "@/lib/adapters";
import { RepoNotFoundError } from "@/lib/adapters/github";
import { ScorecardNotCoveredError } from "@/lib/adapters/scorecard-adapter";
import type { ReportModel } from "@/lib/report-core/types";
import { parseRepoInput } from "@/lib/parse-repo-input";
import { getReportStore } from "@/lib/store";
import { ReportError } from "@/components/report/ReportError";
import { ReportView } from "@/components/report/ReportView";

/** Serve a stored report if it was fetched within this window (fast re-runs). */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

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

type ReportOutcome =
  | { kind: "ok"; report: ReportModel; source: ScorecardSource; cached: boolean }
  | { kind: "error"; title: string; message: string };

async function resolveReport(parsed: {
  owner: string;
  repo: string;
}): Promise<ReportOutcome> {
  const store = getReportStore();
  try {
    // Cache-serve: a recent stored report skips the (possibly ~90s) on-demand run.
    const cached = await store.getLatest(parsed.owner, parsed.repo);
    if (cached && Date.now() - Date.parse(cached.fetchedAt) < CACHE_TTL_MS) {
      return {
        kind: "ok",
        report: cached.report,
        source: cached.scorecardSource,
        cached: true,
      };
    }

    const { report, scorecardSource } = await generateReport(parsed.owner, parsed.repo);
    // Persist as a best-effort cache — a write failure (e.g. a read-only serverless FS) must
    // NEVER turn a successfully generated report into an error.
    try {
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
    } catch (storeErr) {
      console.error("ReportStore.put failed (serving report anyway):", storeErr);
    }
    return { kind: "ok", report, source: scorecardSource, cached: false };
  } catch (err) {
    if (err instanceof RepoNotFoundError) {
      return {
        kind: "error",
        title: "Repository not found",
        message: `We couldn’t find github.com/${parsed.owner}/${parsed.repo}. It may be private, renamed, or misspelled — TrustScope assesses public repos only.`,
      };
    }
    if (err instanceof ScorecardNotCoveredError) {
      return {
        kind: "error",
        title: "Couldn’t run the Scorecard on demand",
        message: `${parsed.owner}/${parsed.repo} isn’t in the OpenSSF dataset, and the on-demand runner isn’t available in this environment. A container host is required for arbitrary repos (see the README).`,
      };
    }
    return {
      kind: "error",
      title: "Couldn’t generate the report",
      message: err instanceof Error ? err.message : "Unexpected error.",
    };
  }
}
