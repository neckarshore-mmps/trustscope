# Due-Diligence signal: install-scripts — design spec (batch 2, slice 1)

Adds **one** quiet Due-Diligence signal to the shipped panel: a calm note when a package runs
npm install-time lifecycle scripts. This is the second batch of the Due-Diligence framework
(batch 1 = no-license / no-security-contact / archived / low-activity, shipped in #639, `lib/report-core/due-diligence.ts`).

**Design approved by the Founder 2026-07-04.** The Founder chose the MASCHIN-lock route over a direct
build, so this is the durable design; **MASCHIN turns it into the locked implementation plan** (task
order, file-by-file, commit boundaries) and Linus builds. The other batch-2 candidate — star-anomaly
(TS7) — is deliberately split into its own later slice (heavier data, bias risk).

## Product decisions (locked in the brainstorm)

| # | Decision | Value |
|---|----------|-------|
| 1 | Slice scope | **install-scripts only**; star-anomaly = separate later slice |
| 2 | Trigger | the **three auto-run npm hooks**: `preinstall`, `install`, `postinstall`. Ordinary scripts (`build`, `test`, …) never fire the signal |
| 3 | Pillar | **Security & Supply Chain** (pillar 2, key `security-supply-chain`) |
| 4 | Tone | **calm + constructive** (D1/D2): state the fact + a real next step; never an accusation, never "malicious/backdoor" |
| 5 | Manifest scope | **root `package.json`, npm only** (thin, per scope-decision D3). Monorepo workspaces + other ecosystems out |
| 6 | Determinism | deterministic (D9), no LLM, no `Date.now`; **no score** (DECISIONS #4) |

## Architecture — a manifest seam (approach B)

Grounds on the batch-1 shape: pure detector in `lib/report-core/due-diligence.ts`, panel
`components/report/DueDiligencePanel.tsx`, populated on `ReportModel.dueDiligence` by `buildReport`.
The new data source is the package manifest — added as **its own seam** (AP-1) so the future thin
manifest-scan (D3 / TS11 dep-ranking) rides the same seam instead of replacing a field bolted onto
`GitHubData`.

- **New type** `ManifestData` (`lib/report-core/types.ts`): `{ installHooks: InstallHook[] }` where
  `InstallHook = "preinstall" | "install" | "postinstall"`. **Shape contract:** `null` = manifest
  missing / not npm / **failed fetch**; `{ installHooks: [] }` = manifest **parsed, no install hooks**.
- **New adapter** `lib/adapters/manifest.ts`: `fetchPackageManifest(owner, repo, opts?) → ManifestData | null`.
  One call `GET /repos/{owner}/{repo}/contents/package.json` (reuse the token-header pattern from
  `lib/adapters/github.ts`); base64-decode `content`, `JSON.parse`, read `.scripts`, keep the hook
  names present. A **hard timeout** (`AbortController`, ~5 s deadline) fires an abort so a slow/hanging
  GitHub response degrades to `null` instead of blocking the report path. **Any failure**
  (404 / non-JSON / rate-limit / network / **timeout**) **→ `null`; a parsed manifest with no install
  hooks → `{ installHooks: [] }`; never throws to the caller.**
- **Detector** becomes `detectDueDiligence(github, manifest, assessedAt)` — `manifest` is the **2nd**
  argument (`ManifestData | null`, required), `assessedAt` 3rd; pushes the signal when
  `manifest?.installHooks.length`. Stays pure; the fetch lives in the adapter layer, not the core.
- **`buildReport`** (adapter layer, `lib/adapters/generate-report.ts`) calls `fetchPackageManifest`
  alongside the existing GitHub fetch and passes `manifest` into the detector. A `null` manifest
  simply yields no signal — the rest of the report is unaffected.
- **Panel unchanged** — a new `DueDiligenceSignal` renders automatically.

## Deliverable 1 — the signal (in-report copy)

`DueDiligenceSignal`:

- `id`: `install-scripts`
- `title`: `Runs scripts on install`
- `detail`: names the hooks actually present, e.g. *"This package runs its own steps automatically
  when it is installed (`postinstall`) — arbitrary code executes on `npm install`. Often legitimate
  (native builds, setup), but worth a look before you adopt it."*
- `mitigation`: *"Review what the install steps do — `npm install --ignore-scripts` lets you hold
  them back and inspect first."*
- `pillarKey`: `security-supply-chain`, `pillarId`: 2

> **Note (language):** the in-report string stays **English**, matching batch 1 ("No license", "No
> security policy"). The approved **German** plain-language version is the source for Deliverables 2 + 3
> below, not the in-report string. Report-vs-docs language LOCKED (below): both English for this slice.

## Deliverable 2 — documentation

A short doc section that **reuses the approved plain-language copy** (the artifact): what the signal
means, why it matters to someone evaluating a third-party tool, how to act on it. One design source,
no duplication (R3). **Placement LOCKED (MASCHIN 2026-07-04):** a section near the README "four pillars"
area, in **English** (README is English → consistent). The German artifact copy stays the source for a
later German surface.

## Deliverable 3 — FAQ entry (DEFERRED, LOCKED)

One Q&A — *"Why does TrustScope flag install scripts?"* — plain answer drawn from the same copy.
**DEFERRED for this slice (MASCHIN 2026-07-04):** TrustScope has no FAQ surface today (routes: `/`,
`/about`, `/report`, `/impressum`, `/datenschutz`), and a product-FAQ is a **separate, broader V2
content decision** (a later in-app `/faq` or the neckarshore-website product page). Do **not** build a
FAQ surface here — the plain-language copy lives in **this spec as the source**. Ship the signal + the
README doc note; defer the FAQ deliverable.

## Trust properties (must hold)

1. **Deterministic** — same repo → same report; no `Date.now`, no randomness, no LLM.
2. **Never breaks the report** — any manifest failure → the one signal is silently absent, everything
   else renders (graceful degradation).
3. **Never accuses** — states + points to a next step; no "malicious" / "bought" / "backdoor".
4. **No score** (DECISIONS #4) — a qualitative note, never counted.

## Testing (TDD — repo's Vitest + Playwright setup)

1. **Unit adapter** (`lib/adapters/manifest.test.ts`): base64-decode + hook extraction; `package.json`
   with hooks → those hooks; parsed manifest with no install hooks (incl. no `scripts` key) → `[]`;
   404 / non-JSON / network / aborted-fetch → `null`; never throws.
2. **Unit detector** (extend `lib/report-core/due-diligence.test.ts`): manifest with hooks → the
   signal (correct pillar + copy); no hooks / `null` → nothing.
3. **Unit buildReport** (extend `lib/report-core/build-report.dd.test.ts`): `dueDiligence` contains
   `install-scripts` when the manifest has hooks.
4. **e2e**: extend the offline fixture (`fixture-org/fixture-repo`) so its stored report carries the
   signal; assert the panel shows it. (Confirm the fixture-seeding mechanism during the plan.)

## Out of scope / route elsewhere

- **star-anomaly (TS7)** — separate later slice; heavier (paginated stargazers) + bias risk.
- **Monorepo workspaces + non-npm ecosystems** — the future thin manifest-scan (D3).
- **`prepare` hook** — consciously excluded (Founder chose the three auto-install hooks only).

## Lock decisions (MASCHIN plan-review, 2026-07-04)

1. **Docs placement** (Deliverable 2) — **README section, English** (README is English → consistent).
2. **FAQ surface + language** (Deliverable 3) — **DEFERRED, not built this slice.** No in-app `/faq`
   now; the copy is sourced from this spec. A product-FAQ is a separate broader V2 content decision
   (later `/faq` or the neckarshore-website product page). DE artifact copy stays the source for a
   later German surface.
3. **In-report string language** — **English** (like batch 1), confirmed.
4. **Manifest shape** — `null` = missing / not npm / failed fetch; `{ installHooks: [] }` = parsed,
   no install hooks. Adapter carries a hard timeout (abort → `null`).

The locked task-plan is `docs/due-diligence-install-scripts-plan.md` → Linus builds (TDD, gates green)
→ Founder visual-accepts the live note.
