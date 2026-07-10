# Convert-to-issue per Pillar — Design

**Item:** `L-TS-CONVERT-TO-ISSUE-PER-PILLAR` (P2) · **Repo:** `neckarshore-mmps/trustscope` · **Date:** 2026-07-10

## Problem

The report redesign (#69) shipped a per-pillar **"Convert to issue"** button as an inert
placeholder (`title="coming soon"`, no handler). The working issue-filing path was the single
**bulk** section `IssueActions` ("Send the suggestions upstream") at the bottom of the report.
An inert affordance on the lead product's face reads as broken. This wires the per-pillar button
and **retires the bulk section** — each pillar's concern travels upstream as its own scoped issue,
consistent with TrustScope's anti-aggregation doctrine.

## Decisions (Founder-directed, this session)

1. **Per-pillar replaces bulk.** The `IssueActions` bulk section is deleted; each `PillarCard` with
   fixes carries its own filing UI. A repo with concerns in 3 pillars files 3 scoped issues.
2. **One adaptive "File issue" button + a "Copy issue" button.** Uniform colour (cyan-outline) in
   both states — the difference is carried by the **icon** and the **hint**, not by colour.
   - **OAuth configured** → one-click POST to `/api/file-issue` (files as the user); icon = **issue-dot**.
   - **OAuth absent** (current prod / the iPhone case) → opens the **pre-filled** GitHub issue form;
     icon = **person** ("you submit it yourself"). This is the graceful fallback that fixes the
     "couldn't file without OAuth" pain.
3. **Icons carry the mode.** Gender-neutral person icon (pre-filled) vs issue-dot (direct). No `↗`
   arrow. Both action buttons are **equal width** (2-col grid). Copy button label = **"Copy issue"**.
4. **Long explanation lives in a tap-reveal hint** (`<details>`, mobile-safe — not a hover `title`,
   which fails on touch). Hint text is state-specific and always states "as yourself, never a bot"
   + the "via TrustScope" attribution (doctrine guard against the direct icon reading as a bot).

## Architecture (pure engine + thin component — mirrors `report-display.ts`)

| Unit | Kind | Responsibility |
|------|------|----------------|
| `lib/issue-markdown.ts` | pure | `buildPillarIssueTitle`, `buildPillarIssueMarkdown`, `prefilledPillarIssueUrl` — scoped to ONE pillar (that pillar's `### {title}` section + its fixes), sharing the friendly intro + "via TrustScope" footer. Replaces the retired bulk builders. |
| `lib/pillar-issue-ui.ts` | pure | `pillarIssueUi(oauthConfigured)` → `{ mode, label, iconKind, copyLabel, hint[] }`. The two-state UI descriptor, unit-tested for both states (icon, label, hint doctrine text). |
| `components/report/PillarIssueButton.tsx` | client | Thin renderer: reads `pillarIssueUi()`, draws the two equal-width buttons + hint, does clipboard copy + the `fetch('/api/file-issue')` one-click (mirrors the retired `IssueActions` filing logic incl. 401→sign-in redirect). Icons inline SVG, `currentColor`. |
| `components/report/PillarCard.tsx` | server | Gains `report` + `oauthConfigured` props; computes the per-pillar `{title, body, prefilledUrl}` via the pure builders; renders `PillarIssueButton` in place of the placeholder. |
| `components/report/ReportView.tsx` | server | Removes the `IssueActions` block; passes `report` + `oauthConfigured` into each `PillarCard`. |
| `components/report/IssueActions.tsx` | — | **DELETED.** |

**Data flow:** `ReportView` (server, computes `oauthConfigured` from env) → `PillarCard` (server,
computes per-pillar issue strings via pure builders) → `PillarIssueButton` (client, receives
`{owner, repo, title, body, prefilledUrl, oauthConfigured}` — serializable strings only; POSTs to
the unchanged generic `/api/file-issue`). The button only renders when `pillar.fixes.length > 0`,
and only DISPLAYED pillars carry it (Functional Quality is never shown → per-pillar filing is
inherently FQ-safe, no leak filter needed).

## Doctrine invariants (PIR-critical)

- `/api/file-issue` is **unchanged** — no backend / no Bob. Per-pillar just posts a different title+body.
- Every filed issue keeps the "via TrustScope" attribution footer; every path is the user's own action.
- **Export (`report-export.ts`) is untouched and stays pure** — filing is UI-only, never serialized.
- The pure builders are deterministic (no clock/LLM/I/O).

## Testing (no new toolchain — unit for pure, Playwright for UI)

- **Unit** `lib/issue-markdown.test.ts` (rewritten to the per-pillar API): only the target pillar's
  fixes appear; other pillars excluded; title names the pillar; footer present; deterministic;
  URL-encoded params.
- **Unit** `lib/pillar-issue-ui.test.ts` (new): both states → correct `mode`/`iconKind`/`label`/
  `copyLabel`; hint always carries "as yourself"/"never a bot"/"via TrustScope".
- **e2e** `e2e/report-summary.spec.ts` (extended): the offline fixture (OAuth absent) shows a
  per-pillar **File issue** control (pre-filled link with the correct `issues/new` href) + a **Copy
  issue** button + a togglable hint; the old "Send the suggestions upstream" bulk section is **gone**.

## Tasks

1. Pure per-pillar builders in `issue-markdown.ts` (TDD: rewrite the unit test first) + remove dead bulk builders.
2. `pillar-issue-ui.ts` pure descriptor (TDD).
3. `PillarIssueButton.tsx` client component (icons, equal-width grid, copy, one-click fetch, hint).
4. Wire `PillarCard` + `ReportView`; delete `IssueActions`.
5. Extend e2e; run `test` + `typecheck` + `lint` + `test:e2e`; commit per block.
6. Push branch, open PR (Vercel preview = visual-accept surface, not direct-to-main).
