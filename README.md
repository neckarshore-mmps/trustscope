# TrustScope

Paste a public GitHub repo → get a deterministic **four-pillar trust report** with constructive,
upstream-friendly fixes. Built on the [OpenSSF Scorecard](https://securityscorecards.dev). By
Neckarshore AI.

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

### Due-diligence signals

Alongside the pillars, the report surfaces a few quiet **due-diligence notes** — calm nudges
derived from existing data, never a score. One example: **install scripts.** Some npm packages
run their own steps automatically the moment they are installed (`preinstall` / `install` /
`postinstall`) — arbitrary code runs during `npm install`. Often legitimate (native builds), but
worth a look before adopting. The note points to a constructive next step
(`npm install --ignore-scripts` to inspect first) and never accuses.

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
npm test             # Vitest unit tests (see below)
npm run lint         # ESLint (strict — fails on any warning)
npm run typecheck    # tsc --noEmit
npm run build        # production build
npm run test:e2e     # Playwright e2e (legal + report pages; boots its own dev server)
```

The Vitest suite covers the pure **report-core** (build-report, normalize, pillars,
due-diligence), the swappable **adapters** (Scorecard fast-path/Docker/binary, GitHub API),
the **store** contract, **issue-markdown** + **report-export/-summary** serializers, and a
**fixture-sanitization guard** (no secrets / private-repo identity in `fixtures/`).

To score repos that aren't in the OpenSSF dataset (e.g. our own), the on-demand runner needs a
GitHub token and Docker locally:

```bash
GITHUB_AUTH_TOKEN=$(gh auth token) npm run start
```

The first report for a repo is generated + stored; re-runs are served from the store for a short
window (target 24h). **Note:** on serverless (Vercel) the file store lives on an ephemeral
filesystem, so the cache is best-effort per instance — a report may be regenerated after a cold
start or on another instance. A durable store is planned (see Architecture).

## Configuration

See [`.env.example`](.env.example). Nothing is required to read reports for OpenSSF-dataset repos.

| Variable | Purpose |
|----------|---------|
| `GITHUB_AUTH_TOKEN` | GitHub token for on-demand Scorecard runs + GitHub API (avoids rate limits). |
| `SCORECARD_RUNNER` | `auto` (default) · `fastpath` · `docker` · `binary`. |
| `SCORECARD_ONDEMAND` | Which runner `auto` uses on a fast-path miss: `docker` (default) · `binary`. |
| `SCORECARD_BIN` / `SCORECARD_IMAGE` | Path to the `scorecard` binary / the Docker image. |
| `REPORT_STORE` | `file` (default, persistent locally) · `memory`. |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` / `AUTH_SECRET` | GitHub OAuth App (one-click issue filing). Optional — the fallbacks work without it. |

## Architecture

- `lib/report-core/` — the **pure, framework-free** report builder (the AP-1 anchor). No I/O, no clock.
- `lib/adapters/` — the swappable Scorecard source (fast-path → Docker/binary) + GitHub-API adapter.
- `lib/store/` — the `ReportStore`. `memory` + `file` today (the file store is ephemeral on
  serverless); a durable store (e.g. Postgres) is planned for production persistence.
- `auth.ts` + `app/api/` — env-gated GitHub OAuth issue filing (Auth.js), with credential-free fallbacks.
- `config/` — central product identity + config (`config/product.ts`).
- `components/` — `SiteHeader` / `SiteFooter` / `NavMenu`, the repo `RepoForm` + `RecentRepos`, and the report UI.
- `app/` — the marketing + product surface:
  - `/` home + `/report` — paste a repo, read the report.
  - `/how-it-works`, `/about`, `/faq`, `/feedback` — supporting pages.
  - `/for` + `/for/adopters` + `/for/maintainers` — the audience hub + spokes.
  - `/impressum`, `/datenschutz` — the German legal pages (DE Pflichtseiten).
  - `sitemap.ts`, `opengraph-image` / `twitter-image` — SEO + social surfaces.

See [DECISIONS.md](DECISIONS.md) for the locked product decisions and the AP-1 seam rationale.
