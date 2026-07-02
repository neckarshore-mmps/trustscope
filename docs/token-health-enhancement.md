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
   parse `github-authentication-token-expiration`; if `< now + 14d`, flag.
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
