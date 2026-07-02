# Token-Health enhancement — build spec (next session)

Enhances the existing daily token-health monitoring (workflow `token-health.yml`,
script `token-health-check.sh`, shipped in PR #16) with two Founder-requested changes.
**Deferred to a fresh session by design** (context budget); this is the durable spec so it
can be built without re-deriving. Owner decided the alert channel + supplied the token data below.

## b — Alert as a repo Issue, not email (Founder preference)

On a failed health-check, **open or update a GitHub Issue** in the repo instead of relying on
GitHub's default Actions failure email.

- Dedup: one standing issue (e.g. title `⚠️ Token health-check failing` + a label like
  `token-health`); if an open one exists, comment/reopen rather than spawn duplicates. Close it
  automatically on the next green run (nice-to-have).
- Implementation: `gh issue` via the workflow `GITHUB_TOKEN`; add `permissions: issues: write`
  (keep `contents: read`). No third-party action needed. Do NOT put untrusted input in `run:`.

## c — Proactive expiry pre-warning (scoped down after the token data)

Open an Issue **N days before** a token expires (suggest N = 14). A workflow can read a token's
expiry from the GitHub API response header `github-authentication-token-expiration` (the workflow
holds the secret values; nobody has to hardcode dates).

**Scope — important, from the 2026-07-02 token audit:**

| Token | Storage | Expiry | Proactive check? |
|-------|---------|--------|------------------|
| `E2E_CLASSIC_PAT` | GitHub Actions secret | **Sep 30 2026** (90 d) | ✅ yes — readable via API header |
| `E2E_FINEGRAINED_PAT` | GitHub Actions secret | **Sep 30 2026** (90 d) | ✅ yes — readable via API header |
| `GITHUB_AUTH_TOKEN` (prod) | Vercel env | **no expiration date** | ❌ not needed (never expires) + not workflow-readable (lives in Vercel) |

So proactive expiry only applies to the two low-stakes E2E secrets; the important prod token has
**no expiry** and stays covered **reactively** by the existing health-check (now via Issue, per b).
Net: c is a nice-to-have, low urgency — b is the real value.

## Implementation sketch

1. Add an expiry step to `token-health.yml` (or a sibling workflow): for each of `E2E_CLASSIC_PAT`,
   `E2E_FINEGRAINED_PAT`, `curl -sI -H "Authorization: Bearer $TOKEN" https://api.github.com/` and
   parse `github-authentication-token-expiration`; if `<= now + 14d` (≤14 days remaining), flag.
2. Shared "open/update issue" helper step used by both the health-failure path (b) and the
   expiry-warning path (c).
3. `permissions: { contents: read, issues: write }`. Secrets only via `env:`.
4. Smoke: `workflow_dispatch` run → confirm it opens an issue on a forced failure and stays quiet
   when healthy.

## Out of scope (route elsewhere)

- **Prod-token proactive expiry** — moot (no expiry) and unreadable by a GitHub workflow (Vercel).
- **Ecosystem-wide token-expiry monitor** — the 2026-07-02 audit surfaced expiring/expired PATs in
  OTHER repos (e.g. `neckarshore-stats-action` expiring Jul 7 2026, `phonesis-voicebank` already
  expired). That is an org-wide concern across multiple products → **MASCHIN scope**, captured in the
  Linus session report (letter -e).

## Implementation (built 2026-07-02 — branch `feat/token-health-issue-alerts`)

Built to this spec with these locked decisions:

- **Helper as a script**, not inline YAML: `scripts/token-health-issue.sh`
  (`open-or-update` / `close-if-open` / `days-until` / `parse-expiry` / `self-test`). The pure
  logic is locally smoke-testable via `bash scripts/token-health-issue.sh self-test`.
- **b — RED + issue** (Founder-confirmed): a failed check opens/updates the standing issue **and**
  the job still ends red (`exit 1`), so the run-history stays honest and the default mail still
  fires. A green run closes the standing issue.
- **Dedup by a hidden body marker**, not the label alone (`<!-- token-health:health-fail -->`,
  `<!-- token-health:expiry:<name> -->`), so the health and expiry issues never overwrite each
  other. Lookups use the primary-consistent REST list plus a strongly-consistent single-issue
  state re-check, so the rare close-together race fails toward a benign duplicate, never a lost alert.
- **c — expiry pre-warn** is best-effort and never fails the run; a missing
  `github-authentication-token-expiration` header is skipped cleanly. Verified live: both E2E PATs
  report 89 days left (Sep 30 2026), correctly no warning at the 14-day threshold.
- **Security:** `permissions: { contents: read, issues: write }`; secrets and issue bodies flow via
  `env:` / body-files only, never inline `${{ }}` in `run:`. Triggers stay `schedule` + `workflow_dispatch`
  (no attacker-controlled event payloads).

Smoke (all green, 2026-07-02): local `self-test`; a live `gh` full cycle (create → dedup-comment →
close → reopen); a `workflow_dispatch` fail-path (run RED + issue opened) and healthy-path (run green
+ issue closed).
