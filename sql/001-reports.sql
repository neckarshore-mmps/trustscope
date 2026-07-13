-- TrustScope shared report store (work-order 2026-07-13 C3).
-- The canonical cross-instance cache for generated reports, keyed (owner, repo, commit).
-- Idempotent: safe to re-run. See lib/store/neon-store.ts + lib/store/types.ts.

CREATE TABLE IF NOT EXISTS reports (
  owner            text        NOT NULL,
  repo             text        NOT NULL,
  "commit"         text        NOT NULL,  -- quoted: COMMIT is a SQL keyword
  report           jsonb       NOT NULL,
  scorecard_source text        NOT NULL,
  fetched_at       timestamptz NOT NULL,
  PRIMARY KEY (owner, repo, "commit")
);

-- Supports getLatest(owner, repo): newest row per repo across commits.
CREATE INDEX IF NOT EXISTS reports_latest_idx ON reports (owner, repo, fetched_at DESC);
