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
  /**
   * §5 single-flight registry: concurrent cache-misses for the SAME repo share ONE generation
   * instead of each running the full ~90s pipeline (cache-stampede). Injectable for deterministic
   * tests; defaults to a module-level map (per-instance coalescing on Vercel Fluid Compute).
   */
  inFlight?: Map<string, Promise<GeneratedReport>>;
}

/** Module-level single-flight registry — one in-flight generation per "owner/repo" per instance. */
const moduleInFlight = new Map<string, Promise<GeneratedReport>>();

export async function resolveReport(
  parsed: { owner: string; repo: string },
  deps: ResolveReportDeps = {},
): Promise<ReportOutcome> {
  const store = deps.store ?? getReportStore();
  const generate = deps.generateReport ?? defaultGenerateReport;
  const now = deps.now ?? Date.now;
  const inFlight = deps.inFlight ?? moduleInFlight;

  // §6: the cache READ lives OUTSIDE the generation try/catch. A store.getLatest() failure is a
  // cache miss, never a generation failure — otherwise a flaky store returns "couldn't generate the
  // report" and never even attempts generation (a §3-class fail-open on the cache path).
  try {
    const cached = await store.getLatest(parsed.owner, parsed.repo);
    if (cached && now() - Date.parse(cached.fetchedAt) < CACHE_TTL_MS) {
      return {
        kind: "ok",
        report: cached.report,
        source: cached.scorecardSource,
        cached: true,
      };
    }
  } catch (cacheErr) {
    console.error("ReportStore.getLatest failed (falling through to generation):", cacheErr);
  }

  try {
    // §5 single-flight: coalesce concurrent misses for the same repo onto one generation+persist,
    // so a cache-miss stampede runs the ~90s pipeline exactly once, not once per concurrent request.
    const key = `${parsed.owner}/${parsed.repo}`;
    let flight = inFlight.get(key);
    if (!flight) {
      flight = (async () => {
        const generated = await generate(parsed.owner, parsed.repo);
        // Persist as a best-effort cache — a write failure (e.g. a read-only serverless FS) must
        // NEVER turn a successfully generated report into an error.
        try {
          await store.put({
            key: {
              owner: parsed.owner,
              repo: parsed.repo,
              commit: generated.report.repo.commit ?? "unknown",
            },
            report: generated.report,
            scorecardSource: generated.scorecardSource,
            fetchedAt: new Date(now()).toISOString(),
          });
        } catch (storeErr) {
          console.error("ReportStore.put failed (serving report anyway):", storeErr);
        }
        return generated;
      })();
      inFlight.set(key, flight);
      // Free the slot once settled (success OR failure) so the next miss regenerates. The no-throw
      // handlers keep this cleanup chain from surfacing as an unhandled rejection.
      const clear = () => {
        if (inFlight.get(key) === flight) inFlight.delete(key);
      };
      flight.then(clear, clear);
    }

    const { report, scorecardSource } = await flight;
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
