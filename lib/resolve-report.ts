import {
  generateReport as defaultGenerateReport,
  RepoNotFoundError,
  ScorecardNotCoveredError,
  type GeneratedReport,
  type ScorecardSource,
} from "@/lib/adapters";
import { AtCapacityError } from "@/lib/concurrency-gate";
import type { ReportModel } from "@/lib/report-core/types";
import { getReportStore } from "@/lib/store";
import type { ReportStore } from "@/lib/store/types";

/**
 * The /report orchestration seam (extracted from app/report/page.tsx for testability — same AP-1
 * philosophy that keeps the rest of the codebase testable). Dependencies are injected so the cache
 * TTL boundary, the error-type -> message mapping, and the "a store write failure must never turn a
 * good report into an error" invariant can all be unit-tested without a live store or clock.
 */

/** Serve a stored report if it was fetched within this window (fast re-runs). */
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export type ReportOutcome =
  | { kind: "ok"; report: ReportModel; source: ScorecardSource; cached: boolean }
  | { kind: "error"; title: string; message: string };

export interface ResolveReportDeps {
  store?: ReportStore;
  generateReport?: (owner: string, repo: string) => Promise<GeneratedReport>;
  /** Injectable clock (ms since epoch) for deterministic TTL tests. Defaults to Date.now. */
  now?: () => number;
}

export async function resolveReport(
  parsed: { owner: string; repo: string },
  deps: ResolveReportDeps = {},
): Promise<ReportOutcome> {
  const store = deps.store ?? getReportStore();
  const generate = deps.generateReport ?? defaultGenerateReport;
  const now = deps.now ?? Date.now;

  try {
    // Cache-serve: a recent stored report skips the (possibly ~90s) on-demand run.
    const cached = await store.getLatest(parsed.owner, parsed.repo);
    if (cached && now() - Date.parse(cached.fetchedAt) < CACHE_TTL_MS) {
      return {
        kind: "ok",
        report: cached.report,
        source: cached.scorecardSource,
        cached: true,
      };
    }

    const { report, scorecardSource } = await generate(parsed.owner, parsed.repo);
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
        fetchedAt: new Date(now()).toISOString(),
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
    if (err instanceof AtCapacityError) {
      // §1 DoS: the on-demand runner is saturated. Shed this request with a friendly retry hint
      // rather than spawning — never leak the internal capacity/concurrency detail to the user.
      return {
        kind: "error",
        title: "TrustScope is at capacity",
        message: `We’re running several reports right now and couldn’t start a new one for ${parsed.owner}/${parsed.repo}. Please try again in a minute — reports we’ve already run stay instant.`,
      };
    }
    return {
      kind: "error",
      title: "Couldn’t generate the report",
      message: err instanceof Error ? err.message : "Unexpected error.",
    };
  }
}
