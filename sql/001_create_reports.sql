-- TrustScope shared cross-instance report store (work-order 2026-07-13).
-- The canonical row is keyed (owner, repo, commit) and holds the ReportModel JSON + fetchedAt.
-- v1 reads it as a cache; v2 ADDS a public Trust-Gallery + user history on the SAME table.
-- Idempotent: safe to run repeatedly (migration is reproducible from the repo).

CREATE TABLE IF NOT EXISTS reports (
  owner            text        NOT NULL,
  repo             text        NOT NULL,
  commit           text        NOT NULL,
  report           jsonb       NOT NULL,
  scorecard_source text        NOT NULL,
  fetched_at       timestamptz NOT NULL,
  PRIMARY KEY (owner, repo, commit)
);

-- getLatest() = WHERE owner=$1 AND repo=$2 ORDER BY fetched_at DESC LIMIT 1.
CREATE INDEX IF NOT EXISTS reports_latest_idx ON reports (owner, repo, fetched_at DESC);
