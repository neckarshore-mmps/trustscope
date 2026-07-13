import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { ScorecardSource } from "@/lib/adapters";
import type { ReportModel } from "@/lib/report-core/types";
import type { ReportKey, ReportStore, StoredReport } from "./types";

/**
 * Postgres-backed ReportStore (Neon) — the prod impl the persistence seam was designed for
 * (work-order §3 #6 / AP-1 seam #3). A PERSISTENT, queryable table, not an ephemeral cache:
 * the same store backs v2's public Trust-Gallery + user history with no rewrite.
 *
 * Why this class exists at all: on Vercel Fluid Compute the filesystem is per-instance and
 * ephemeral, so the `/report` page (which WRITES the report) and the `/report/og` route (which
 * READS it) run on different instances and the FileReportStore cache-misses → the OG card renders
 * "Not assessed". A shared table fixes that at the source.
 *
 * Driver: `@neondatabase/serverless` HTTP function (`neon()`) — no connection pool, so it is safe
 * under Fluid Compute's instance reuse (no pool exhaustion). One statement per call.
 */
export class NeonReportStore implements ReportStore {
  private readonly sql: NeonQueryFunction<false, false>;

  constructor(connectionString: string | undefined) {
    if (!connectionString) {
      throw new Error(
        "NeonReportStore requires a DATABASE_URL connection string (REPORT_STORE=neon).",
      );
    }
    this.sql = neon(connectionString);
  }

  /**
   * Map a DB row to a StoredReport.
   *
   * CRITICAL: `fetched_at` is `timestamptz`, which the driver hands back as a JS `Date`. The TTL
   * math in both callers is `Date.now() - Date.parse(fetchedAt)` — passing a `Date` (or anything
   * that isn't the exact ISO string) through would yield `NaN` in `Date.parse`, a false cache-miss,
   * and the very "Not assessed" card this store exists to fix. Normalize to ISO on read.
   */
  private static toStored(row: ReportRow): StoredReport {
    return {
      key: { owner: row.owner, repo: row.repo, commit: row.commit },
      report: row.report,
      scorecardSource: row.scorecard_source,
      fetchedAt: row.fetched_at.toISOString(),
    };
  }

  async get(key: ReportKey): Promise<StoredReport | null> {
    const rows = (await this.sql`
      SELECT owner, repo, "commit", report, scorecard_source, fetched_at
      FROM reports
      WHERE owner = ${key.owner} AND repo = ${key.repo} AND "commit" = ${key.commit}
      LIMIT 1
    `) as ReportRow[];
    return rows[0] ? NeonReportStore.toStored(rows[0]) : null;
  }

  async getLatest(owner: string, repo: string): Promise<StoredReport | null> {
    const rows = (await this.sql`
      SELECT owner, repo, "commit", report, scorecard_source, fetched_at
      FROM reports
      WHERE owner = ${owner} AND repo = ${repo}
      ORDER BY fetched_at DESC
      LIMIT 1
    `) as ReportRow[];
    return rows[0] ? NeonReportStore.toStored(rows[0]) : null;
  }

  async put(stored: StoredReport): Promise<void> {
    const { owner, repo, commit } = stored.key;
    await this.sql`
      INSERT INTO reports (owner, repo, "commit", report, scorecard_source, fetched_at)
      VALUES (
        ${owner}, ${repo}, ${commit},
        ${JSON.stringify(stored.report)}::jsonb,
        ${stored.scorecardSource},
        ${stored.fetchedAt}::timestamptz
      )
      ON CONFLICT (owner, repo, "commit") DO UPDATE SET
        report = EXCLUDED.report,
        scorecard_source = EXCLUDED.scorecard_source,
        fetched_at = EXCLUDED.fetched_at
    `;
  }
}

/** Shape of a `reports` row as the Neon HTTP driver returns it (jsonb → object, timestamptz → Date). */
interface ReportRow {
  owner: string;
  repo: string;
  commit: string;
  report: ReportModel;
  scorecard_source: ScorecardSource;
  fetched_at: Date;
}
