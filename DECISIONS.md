# TrustScope — Decisions

Why TrustScope is built the way it is. Format: **Decision → Rationale → Affects**. Grounds on the
[v1 Build Work-Order](https://github.com/neckarshore-ai/neckarshore-planning/blob/main/docs/plans/2026-07-01-trustscope-v1-linus-build-workorder.md)
(#274, Founder-decided).

## 1. The six locked product decisions

| # | Fork | Decision |
|---|------|----------|
| 1 | Audience | **Adopter/Evaluator** — someone vetting a *third-party* tool before adopting it. Not the maintainer/badge path (that competes with OpenSSF's own badge). |
| 2 | Format | **Web report-generator** — repo URL in → report out. |
| 3 | Depth | **Deterministic-pure — no LLM, no API key.** Rule-based fix text from the Hardening Standard §3. |
| 4 | Pillars | **All four shown.** P2 full Scorecard · P3 Trust/Governance · P4 lifecycle. **P1 = "not assessed" — never faked.** **No single aggregate score.** |
| 5 | Third-party posture | **Constructive + consent.** Offer to file a constructive fix-issue upstream. |
| 6 | Fix-issue mechanism | **File via GitHub OAuth AS THE USER** (the issue is the user's own action) with a "via TrustScope" footer. **Bot-identity forbidden** — unsolicited bot-issues break consent. |

**Reputation mechanism:** the four-pillar synthesis is the visible differentiator beyond raw
Scorecard, and the "via TrustScope" constructive issues put Neckarshore's name on concrete
improvements to real projects. Both are foregrounded in the UI, not footnoted.

## 2. Org-home = `neckarshore-mmps/trustscope`

- **Decision:** the repo lives in `neckarshore-mmps`, public, owner Linus.
- **Rationale:** org placement follows **artifact class, not business model.** TrustScope is a
  full-stack app (Next.js + backend: Scorecard run, GitHub API, store, OAuth), not a brochure site —
  so it does not belong in `neckarshore-websites` (six static marketing sites). "Reputation-first,
  no revenue" does **not** imply "no MMP org." Public because it is a reputation surface that
  dogfoods its own Scorecard and gets free branch protection.
- **Affects:** v1 stays reputation-first (no monetisation modelling, no launch machinery), but the
  AP-1 seams (§3) keep the full-MMP option open without a rewrite.

## 3. AP-1 seams — what v1 builds scalable NOW vs what v2 ADDs later

The concern AP-1 answers: does lean-v1 force a REPLACE to reach a full MMP? **No** — the
infrastructure seams are scalable from the start; v2 is pure ADD.

| # | Seam | v1 | v2 ADDs |
|---|------|----|---------|
| 1 | Report generation | Pure `ReportModel` function (`lib/report-core`) | unchanged — everything builds on it |
| 2 | Scorecard source | One swappable adapter: fast-path → Docker/**binary** | more sources behind the adapter |
| 3 | Persistence | `ReportStore` interface, keyed `(owner, repo, commit)` — memory + file locally | Trust-Gallery view + user history on the same store |
| 4 | Identity | Auth.js GitHub provider (`auth.ts`), env-gated | accounts/history on the same provider |
| 5 | Scorecard run host | Runner abstracted behind the adapter | swap host / add a queue, no rewrite |

> **"Scalable" ≠ "build v2 now."** Persistence is one keyed store, not an accounts/billing schema.
> Identity is a reusable provider, not a built-out account system. Deferred (pure ADD, not built):
> Trust-Gallery · accounts/history · payments · launch ops · dedicated owner-persona.

## 4. No single aggregate score

- **Decision:** the `ReportModel.aggregateScore` is always `null`; per-pillar scores only.
- **Rationale:** framework doctrine. Each pillar answers a different question; a lone number hides
  the trade-off an adopter is weighing (a secure solo-maintained library is not "7/10").
- **Affects:** the UI foregrounds the four-pillar rationale; there is no place a mean-of-means could leak in.

## 5. Scorecard runner: fast-path → Docker (dev) / binary (prod)

- **Decision:** one `ScorecardAdapter`; `auto` tries the fast-path API, then an on-demand runner.
  Local dev = `docker`; prod = the `scorecard` **Go binary** (Vercel Sandbox / Fluid-Compute).
- **Rationale:** the fast-path only covers repos in the OpenSSF dataset (our own repos 404). The
  ~90s on-demand run is not pure-serverless — but it is a deploy-config choice, not a code fork.
  Sharpened work-order §7 #4 prefers a Vercel-native binary run over an external container host.
- **Affects:** the prod-host decision (§7 #4) is the one open infra fork; the adapter absorbs it via
  `SCORECARD_RUNNER` / `SCORECARD_ONDEMAND`. Security: `execFile` + array args (no shell), token via child env.

## 6. OAuth issue-filing is env-gated; fallbacks are the default

- **Decision:** one-click "file as yourself" needs a GitHub OAuth App (`GITHUB_CLIENT_ID/SECRET`).
  Without it, `/api/file-issue` returns 501 and the UI offers Copy-Markdown + a pre-filled GitHub
  issue URL.
- **Rationale:** the OAuth App is a launch-gated User-Action (§7 #3); the local MVP must not depend
  on it. The pre-filled-issue path is still the user's own authenticated action (consent intact, no bot).
- **Affects:** every filing path carries the "via TrustScope" attribution footer; no stored bot token.

## 7. Stack + tooling

- **Next.js 16 (App Router) + TypeScript + Tailwind v4**, all deps **exactly pinned** (`.npmrc`
  `save-exact`). Vitest for the pure cores. Rationale: the work-order stack call; exact pins per the
  global no-`^`/`~` rule. Affects: reproducible builds; the report-core has zero framework imports so
  it is trivially unit-tested.
