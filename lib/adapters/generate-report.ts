import { buildReport } from "@/lib/report-core";
import type { ReportModel } from "@/lib/report-core/types";
import { fetchGitHubData, type GitHubFetchOptions } from "./github";
import { fetchPackageManifest } from "./manifest";
import {
  getScorecard,
  type ScorecardRunOptions,
  type ScorecardSource,
} from "./scorecard-adapter";

/**
 * The orchestrator: repo ref -> live ReportModel (work-order §5 Phase 2 done-gate).
 * Runs the Scorecard source and the GitHub-API calls concurrently, then feeds both into the
 * pure Report-Core. This is the one place that touches the network + the clock; the core stays pure.
 */

export interface GenerateReportOptions
  extends ScorecardRunOptions,
    GitHubFetchOptions {
  /** ISO timestamp; defaults to now. Injectable for deterministic tests. */
  generatedAt?: string;
}

export interface GeneratedReport {
  report: ReportModel;
  scorecardSource: ScorecardSource;
}

export async function generateReport(
  owner: string,
  repo: string,
  opts: GenerateReportOptions = {},
): Promise<GeneratedReport> {
  const [{ result: scorecard, source }, github, manifest] = await Promise.all([
    getScorecard(owner, repo, opts),
    fetchGitHubData(owner, repo, opts),
    fetchPackageManifest(owner, repo, opts),
  ]);

  const report = buildReport({
    scorecard,
    github,
    manifest,
    generatedAt: opts.generatedAt ?? new Date().toISOString(),
  });

  return { report, scorecardSource: source };
}
