# TrustScope

Paste a public GitHub repo → get a deterministic **four-pillar trust report** with constructive,
upstream-friendly fixes. Built on the [OpenSSF Scorecard](https://securityscorecards.dev). A
reputation surface by Neckarshore AI.

TrustScope helps someone **evaluating a third-party open-source tool** decide how much to trust it —
across security, governance, and community — and never hides the trade-offs behind a single score.

## The four pillars

| Pillar | Question | Source |
|--------|----------|--------|
| 1 — Functional Quality | Is it well-built? | **Not assessed** — a hands-on judgement, never faked. |
| 2 — Security & Supply Chain | Is it built securely? | The full OpenSSF Scorecard. |
| 3 — Trust & Governance | Can I trust the project behind it? | Scorecard License/Security-Policy + GitHub API (owner, contact). |
| 4 — Community & Sustainability | Will it be here in a year? | Scorecard Maintained/Contributors + activity — a lifecycle stage, not a grade. |

**No single aggregate score, by design** — each pillar answers a different question; collapsing them
hides exactly the trade-off you are weighing.

## How it works

1. **Input** — one public GitHub repo (URL or `owner/repo`).
2. **Scorecard** — fetched from the OpenSSF public dataset (fast-path) when covered, otherwise run
   on demand. Plus a few GitHub-API calls for the governance + lifecycle signals Scorecard omits.
3. **Report-Core** — a pure function turns `(scorecard, github)` into the `ReportModel`.
4. **Constructive fixes** — low findings get rule-based fix text (from the Estate Hardening
   Standard). File them upstream as a friendly, attributed issue.

## Local development

```bash
npm install
npm run dev          # http://localhost:3000
```

```bash
npm test             # Vitest unit tests (report-core, adapters, store, issue-markdown)
npm run typecheck    # tsc --noEmit
npm run build        # production build
```

To score repos that aren't in the OpenSSF dataset (e.g. our own), the on-demand runner needs a
GitHub token and Docker locally:

```bash
GITHUB_AUTH_TOKEN=$(gh auth token) npm run start
```

The first report for a repo is generated + stored; re-runs within 24h are served from the store.

## Configuration

See [`.env.example`](.env.example). Nothing is required to read reports for OpenSSF-dataset repos.

| Variable | Purpose |
|----------|---------|
| `GITHUB_AUTH_TOKEN` | GitHub token for on-demand Scorecard runs + GitHub API (avoids rate limits). |
| `SCORECARD_RUNNER` | `auto` (default) · `fastpath` · `docker` · `binary`. |
| `SCORECARD_ONDEMAND` | Which runner `auto` uses on a fast-path miss: `docker` (default) · `binary`. |
| `SCORECARD_BIN` / `SCORECARD_IMAGE` | Path to the `scorecard` binary / the Docker image. |
| `REPORT_STORE` | `file` (default, persistent) · `memory`. |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` / `AUTH_SECRET` | GitHub OAuth App (one-click issue filing). Optional — the fallbacks work without it. |

## Architecture

- `lib/report-core/` — the **pure, framework-free** report builder (the AP-1 anchor). No I/O, no clock.
- `lib/adapters/` — the swappable Scorecard source (fast-path → Docker/binary) + GitHub-API adapter.
- `lib/store/` — the persistent `ReportStore` (memory + file locally; Postgres in prod).
- `auth.ts` + `app/api/` — env-gated GitHub OAuth issue filing (Auth.js), with credential-free fallbacks.
- `app/` — the home + `/report` surface.

See [DECISIONS.md](DECISIONS.md) for the locked product decisions and the AP-1 seam rationale.

## Open User-Actions (gate the LIVE launch — not the local build)

| # | Action | Status |
|---|--------|--------|
| 1 | Lock the name "TrustScope" | ✅ locked (the subdomain slug). |
| 2 | Subdomain `trustscope.neckarshore.ai` | ✅ DNS live (CNAME → Vercel). **Add the domain to the Vercel project so the TLS cert issues.** |
| 3 | GitHub OAuth App creds (`GITHUB_CLIENT_ID/SECRET` + `AUTH_SECRET`) | ✅ set in Vercel **Production** — one-click "file as yourself" is live. Not in Preview/Dev (those fall back to Copy-Markdown / pre-filled issue). Callback URL must track the final production domain (see #2). |
| 4 | **Scorecard-run host** (the ~90s job is not pure-serverless) | 🔲 the one open infra fork. Evaluate Vercel-native first (Sandbox / Fluid-Compute running the `scorecard` **binary**) before an external host. The adapter absorbs the choice via `SCORECARD_RUNNER`. |
| 5 | Hosting (Vercel project) | ✅ confirmed. |
