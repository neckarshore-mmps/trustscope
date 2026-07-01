import type { ScorecardSource } from "@/lib/adapters";
import type { ReportModel } from "@/lib/report-core/types";

/**
 * Persistence seam (work-order §3 #6 / §5 Phase 5 / AP-1 seam #3).
 *
 * A PERSISTENT, queryable store — not an ephemeral cache. v1 reads it as a cache (fast re-runs);
 * v2 ADDS a public Trust-Gallery + user history on the SAME store, no rewrite. The canonical row
 * is keyed (owner, repo, commit) holding the ReportModel JSON + fetchedAt. Local impls are memory
 * (tests) and file (dev persistence); the prod impl is a Postgres table behind this same interface.
 */

export interface ReportKey {
  owner: string;
  repo: string;
  commit: string;
}

export interface StoredReport {
  key: ReportKey;
  report: ReportModel;
  scorecardSource: ScorecardSource;
  /** ISO timestamp the report was generated + stored. */
  fetchedAt: string;
}

export interface ReportStore {
  /** Exact lookup by (owner, repo, commit). */
  get(key: ReportKey): Promise<StoredReport | null>;
  /** Most-recently-fetched stored report for a repo (any commit) — the cache-serve query. */
  getLatest(owner: string, repo: string): Promise<StoredReport | null>;
  put(stored: StoredReport): Promise<void>;
}

export function keyId(k: ReportKey): string {
  return `${k.owner}/${k.repo}@${k.commit}`;
}
