import { neon } from "@neondatabase/serverless";
import type { ScorecardSource } from "@/lib/adapters";
import type { ReportModel } from "@/lib/report-core/types";
import type { ReportKey, ReportStore, StoredReport } from "./types";

/**
 * A tagged-template SQL executor. `@neondatabase/serverless`'s `neon(url)` satisfies this directly
 * (HTTP driver, one round-trip per query, no connection pool — Fluid-Compute-safe). Tests inject a
 * pglite-backed adapter with the same shape so the store passes the ReportStore contract in CI.
 */
export type SqlExecutor = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<Record<string, unknown>[]>;

interface Row {
  owner: string;
  repo: string;
  commit: string;
  report: ReportModel | string;
  scorecard_source: string;
  fetched_at: string | Date;
}

/**
 * Postgres-backed ReportStore (prod: Neon). The `/report` page (writes) and the `/report/og` route
 * (reads) run as separate Fluid-Compute function invocations on different instances — a per-instance
 * file/memory store cache-misses across them, so the shared OG card renders "Not assessed". This
 * cross-instance store is the fix: one row per (owner, repo, commit), the third impl behind the
 * existing getReportStore() seam (AP-1 — no caller rewrite).
 *
 * TTL is intentionally NOT applied here: resolve-report.ts and the OG route own CACHE_TTL_MS. The
 * store returns raw rows so freshness stays single-sourced (no divergent rule).
 */
export class NeonReportStore implements ReportStore {
  private readonly sql: SqlExecutor;

  constructor(connectionStringOrSql: string | SqlExecutor) {
    this.sql =
      typeof connectionStringOrSql === "string"
        ? (neon(connectionStringOrSql) as unknown as SqlExecutor)
        : connectionStringOrSql;
  }

  async get(key: ReportKey): Promise<StoredReport | null> {
    const rows = await this.sql`
      SELECT owner, repo, commit, report, scorecard_source, fetched_at
      FROM reports
      WHERE owner = ${key.owner} AND repo = ${key.repo} AND commit = ${key.commit}
      LIMIT 1`;
    return rows.length ? mapRow(rows[0] as unknown as Row) : null;
  }

  async getLatest(owner: string, repo: string): Promise<StoredReport | null> {
    const rows = await this.sql`
      SELECT owner, repo, commit, report, scorecard_source, fetched_at
      FROM reports
      WHERE owner = ${owner} AND repo = ${repo}
      ORDER BY fetched_at DESC
      LIMIT 1`;
    return rows.length ? mapRow(rows[0] as unknown as Row) : null;
  }

  async put(stored: StoredReport): Promise<void> {
    const { owner, repo, commit } = stored.key;
    await this.sql`
      INSERT INTO reports (owner, repo, commit, report, scorecard_source, fetched_at)
      VALUES (
        ${owner}, ${repo}, ${commit},
        ${JSON.stringify(stored.report)}, ${stored.scorecardSource}, ${stored.fetchedAt}
      )
      ON CONFLICT (owner, repo, commit) DO UPDATE SET
        report = EXCLUDED.report,
        scorecard_source = EXCLUDED.scorecard_source,
        fetched_at = EXCLUDED.fetched_at`;
  }
}

function mapRow(r: Row): StoredReport {
  return {
    key: { owner: r.owner, repo: r.repo, commit: r.commit },
    report: (typeof r.report === "string" ? JSON.parse(r.report) : r.report) as ReportModel,
    scorecardSource: r.scorecard_source as ScorecardSource,
    // Normalize timestamptz (Date from pglite, string from neon) back to the millis-ISO the
    // StoredReport.fetchedAt contract uses. Byte-exact round-trip: 2026-07-01T10:00:00.000Z.
    fetchedAt: new Date(r.fetched_at).toISOString(),
  };
}
