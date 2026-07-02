# Scorecard-Run-Host — Measurement & Sign-off (§7 #4)

Formal sign-off of the **one open infra fork**: is the Vercel-native `scorecard` **binary** runner
(a Fluid-Compute function) a viable host for the on-demand run, or is an external container host
needed? **Verdict: Vercel-native binary is viable — signed off.**

## Setup under test (production)

- `/report` route: `export const dynamic = "force-dynamic"`, `export const maxDuration = 300`
  (`app/report/page.tsx`) — a Fluid-Compute function with a 300 s ceiling.
- Runner (prod env): `SCORECARD_RUNNER=binary`, `SCORECARD_ONDEMAND=binary`,
  `SCORECARD_BIN=./bin/scorecard` — the Go binary, no Docker (the README's preferred Option 4b).
- On-demand path = fast-path 404 → binary runner. The measured repos were pre-screened to 404 on
  `api.securityscorecards.dev` (guaranteed on-demand, not fast-path) and were uncached (first run).

## Method

End-to-end wall-clock from the production domain: `curl -w %{time_total}` on
`https://trustscope.neckarshore.ai/report?repo=<owner>/<repo>`. The route is a streamed,
blocking Server Component (the `loading.tsx` shell streams first, the resolved report streams when
`generateReport` returns) — so `time_total` for a held connection ≈ the full server-side on-demand
duration (Scorecard binary + GitHub-API calls + render). Measured 2026-07-02.

## Results

| Repo | Character | On-demand duration | HTTP | Rendered |
|------|-----------|--------------------|------|----------|
| `kelseyhightower/nocode` | trivial (README only) | 4.0 s | 200 | full 4-pillar report |
| `octocat/octocat.github.io` | small | 5.0 s | 200 | full 4-pillar report |
| `octocat/git-consortium` | trivial | 5.2 s | 200 | full 4-pillar report |
| `rubygems/bundler-site` | real history | 18.7 s | 200 | full 4-pillar report |

Duration scales with repo history (trivial ~4–5 s, more-history ~19 s), confirming these are real
on-demand runs rather than cache-serves (a cache-serve would be uniformly fast regardless of size).

## Verdict & headroom

- **Signed off: the Vercel-native Fluid-Compute binary runner is the chosen host** (Option 4b).
  No external container host (Fly/Railway/Cloud-Run) is needed for v1.
- **Headroom:** measured 4–19 s against a 300 s ceiling — >15× for typical third-party repos. Even
  against the original conservative ~90 s worst-case estimate (a very large repo), the margin is >3×.
- **Cold start:** Fluid-Compute cold start (Node) is sub-second and is already included in the
  fastest measured run (4.0 s); not a limiting factor.

## Caveat / monitor

Very large repos (facebook/react-scale) were **not** measured on-demand because they are in the
OpenSSF dataset and resolve via the instant fast-path. If a very large repo ever 404s the fast-path
and must run on-demand, the 300 s ceiling is the guard; the token-lifecycle health-check (see the
V1 open-items brief) is the early-warning signal if on-demand runs start failing.
