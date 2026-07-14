# Changelog

All notable changes to **TrustScope**. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[Semantic Versioning](https://semver.org/). Pre-1.0 (`0.x`) means the shape
can still move. Entries land under **[Unreleased]** per user-facing change;
each release links the pull requests it contains.

## [Unreleased]

## [0.3.0] — 2026-07-14

### Added

- **Light and dark mode.** The site follows your system preference; a header toggle
  overrides it and the choice persists (`ts-mode`), applied before first paint so
  there is no flash. ([#86](https://github.com/neckarshore-mmps/trustscope/pull/86))
- **Share and embed any report** — a per-report Open-Graph card, a one-click share
  action, a sibling-report block, and a copy-to-README trust badge. ([#96](https://github.com/neckarshore-mmps/trustscope/pull/96))
- **An install-scripts due-diligence Q&A** on the FAQ — what it means when a package
  runs its own code during `npm install`, and how to inspect it first. ([#94](https://github.com/neckarshore-mmps/trustscope/pull/94))
- **`NeonReportStore`** — a cross-instance report store, so a shared report link
  resolves on any instance instead of rendering "Not assessed". ([#100](https://github.com/neckarshore-mmps/trustscope/pull/100))
- **A rotating, loss-framed landing headline** — ten CTAs alternating between the
  adopter and maintainer sides of the table. ([#106](https://github.com/neckarshore-mmps/trustscope/pull/106), [#107](https://github.com/neckarshore-mmps/trustscope/pull/107))
- **Bodo as the favicon and on the social-preview + report OG cards** — the last
  shields retired. ([#103](https://github.com/neckarshore-mmps/trustscope/pull/103), [#104](https://github.com/neckarshore-mmps/trustscope/pull/104))
- **A `/vs/openssf-scorecard` comparison page** — how TrustScope differs from the
  Scorecard it is built on. ([#113](https://github.com/neckarshore-mmps/trustscope/pull/113))
- **An AI-crawler surface** — a rewritten `llms.txt` plus a new `llms-full.txt` of
  quotable prose, and a trust strip above the fold. ([#109](https://github.com/neckarshore-mmps/trustscope/pull/109), [#113](https://github.com/neckarshore-mmps/trustscope/pull/113))
- **SEO metadata** — canonicals on every route, an `@id`-linked
  Organization/WebSite/SoftwareApplication `@graph`, breadcrumbs, `/changelog` in the
  sitemap, and IndexNow submission. ([#113](https://github.com/neckarshore-mmps/trustscope/pull/113))

### Changed

- **Impressum, Datenschutz and About are binding** — the DRAFT markers are gone. ([#101](https://github.com/neckarshore-mmps/trustscope/pull/101))
- **Legal disclosures** — the stored theme preference (`ts-mode`) disclosed under §6;
  the Art. 45 DPF adequacy decision made the primary transfer basis under §5. ([#95](https://github.com/neckarshore-mmps/trustscope/pull/95))
- **Pillar 4 is absent from every user-facing surface**, and a CI grep-gate now holds
  that line against regressions. ([#85](https://github.com/neckarshore-mmps/trustscope/pull/85), [#99](https://github.com/neckarshore-mmps/trustscope/pull/99))
- Toolchain, CI and dependency upkeep — including a guard that fails the build when an
  HTML entity collapses the space out of a rendered word. ([#67](https://github.com/neckarshore-mmps/trustscope/pull/67), [#87](https://github.com/neckarshore-mmps/trustscope/pull/87), [#88](https://github.com/neckarshore-mmps/trustscope/pull/88), [#89](https://github.com/neckarshore-mmps/trustscope/pull/89), [#90](https://github.com/neckarshore-mmps/trustscope/pull/90), [#93](https://github.com/neckarshore-mmps/trustscope/pull/93), [#114](https://github.com/neckarshore-mmps/trustscope/pull/114))

### Fixed

- **WCAG-AA contrast in light mode** across the marketing and report pages — pillar
  accents, status pills, muted text and heading order. ([#108](https://github.com/neckarshore-mmps/trustscope/pull/108))
- Three live defects: a 404 link inside `llms.txt`, a glued "TrustScopegrew" on
  `/about`, and a light-mode CTA at 1.76:1 contrast. ([#109](https://github.com/neckarshore-mmps/trustscope/pull/109))
- The favicon backdrop, for browser-tab contrast. ([#105](https://github.com/neckarshore-mmps/trustscope/pull/105))

### Security

- **Six response headers** (CSP `frame-ancestors`, `X-Content-Type-Options`,
  `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, hardened HSTS) plus
  `poweredByHeader: false`. ([#113](https://github.com/neckarshore-mmps/trustscope/pull/113))
- The `emit-stats` write token is scoped to the push step. ([#92](https://github.com/neckarshore-mmps/trustscope/pull/92))

## [0.2.0] — 2026-07-11

### Added

- **Bodo, the beaver mascot**, across the landing hero, the report masthead, and
  both exports (HTML inline SVG + Markdown ASCII banner) — single-sourced from one
  `public/bodo.svg` so every surface stays in sync. ([#75](https://github.com/neckarshore-mmps/trustscope/pull/75), [#76](https://github.com/neckarshore-mmps/trustscope/pull/76), [#77](https://github.com/neckarshore-mmps/trustscope/pull/77), [#78](https://github.com/neckarshore-mmps/trustscope/pull/78), [#79](https://github.com/neckarshore-mmps/trustscope/pull/79))
- **Functional Quality is a Pro-only fourth pillar.** The free report now
  explicitly assesses **three** pillars; the fourth is never a faked score. ([#80](https://github.com/neckarshore-mmps/trustscope/pull/80))

### Changed

- **Report redesign** — a fixed Pillar 1 → 2 → 3 order with a per-pillar identity
  colour, plus an input reset on a fresh run. ([#69](https://github.com/neckarshore-mmps/trustscope/pull/69), [#74](https://github.com/neckarshore-mmps/trustscope/pull/74))
- The landing leads with a single-line hook and a "Run the report" CTA at pillar
  width. ([#81](https://github.com/neckarshore-mmps/trustscope/pull/81))
- **Repository picker** — a server-rendered default list; selecting a repo fills
  the field instead of auto-assessing. ([#73](https://github.com/neckarshore-mmps/trustscope/pull/73))
- The in-app `/changelog` page now renders **curated end-user highlights** sourced
  from this file's `## [public]` section (parsed at build time) — a single source of
  truth that replaces the separate typed `config/changelog.ts` and ends the
  CHANGELOG.md ↔ in-app drift. ([#71](https://github.com/neckarshore-mmps/trustscope/pull/71), [#72](https://github.com/neckarshore-mmps/trustscope/pull/72))

## [baseline] — 2026-07-10

Notable changes to date — TrustScope's public **v0.1.0** surface, condensed to
the milestones a new user would notice. Prior history in git.

- **A four-pillar trust report, not a single misleading score.** Every report is
  deterministic, built on the OpenSSF Scorecard, and split into four pillars so
  you can see *where* a project is strong or weak — never one aggregate number
  that hides the trade-offs. ([#57](https://github.com/neckarshore-mmps/trustscope/pull/57), [#69](https://github.com/neckarshore-mmps/trustscope/pull/69))
- **See the reasoning, not just a verdict.** An orientation layer summarises the
  report up front, every finding can disclose its own evidence ("show your
  work"), and a Due-Diligence panel surfaces quiet signals like install-script
  detection. ([#33](https://github.com/neckarshore-mmps/trustscope/pull/33), [#34](https://github.com/neckarshore-mmps/trustscope/pull/34), [#35](https://github.com/neckarshore-mmps/trustscope/pull/35), [#43](https://github.com/neckarshore-mmps/trustscope/pull/43))
- **Find any repository fast.** A searchable repo picker with a Recently-Viewed
  strip gets you from landing to report in a couple of keystrokes. ([#42](https://github.com/neckarshore-mmps/trustscope/pull/42))
- **Act on findings, constructively.** File a finding upstream as *yourself* —
  each issue carries a transparent "via TrustScope" attribution — now available
  per pillar rather than as a single bulk action. ([#53](https://github.com/neckarshore-mmps/trustscope/pull/53), [#70](https://github.com/neckarshore-mmps/trustscope/pull/70))
- **Take the report with you.** Export the full report as Markdown or HTML. ([#36](https://github.com/neckarshore-mmps/trustscope/pull/36))
- **A path for each side of the table.** Dedicated adopter and maintainer
  journeys, a `/for` persona hub, and a dual-role landing hero. ([#44](https://github.com/neckarshore-mmps/trustscope/pull/44), [#45](https://github.com/neckarshore-mmps/trustscope/pull/45), [#56](https://github.com/neckarshore-mmps/trustscope/pull/56))
- **A trust surface you can check.** Impressum, Datenschutz, an Open-Graph
  preview card, and Made-in-Germany credibility throughout. ([#31](https://github.com/neckarshore-mmps/trustscope/pull/31), [#46](https://github.com/neckarshore-mmps/trustscope/pull/46), [#52](https://github.com/neckarshore-mmps/trustscope/pull/52))
- **We run TrustScope on TrustScope.** A security-hardening pass across six areas
  (§1–§6) worked through the findings our own report surfaced on this
  repository. ([#58](https://github.com/neckarshore-mmps/trustscope/pull/58), [#59](https://github.com/neckarshore-mmps/trustscope/pull/59), [#60](https://github.com/neckarshore-mmps/trustscope/pull/60), [#61](https://github.com/neckarshore-mmps/trustscope/pull/61))

## [public]

<!--
  CURATED END-USER HIGHLIGHTS — the single source for the website /changelog page
  (parsed at build time by lib/changelog.ts). Not a mechanical subset of the dev
  changelog above: curate it. Lead with new features an end-user notices; bundle
  small stuff (bugfixes, dependency bumps, chores) under one collective line, or
  omit a release here entirely if nothing user-facing shipped. Newest version first.
  Format the parser expects, per release: "### v<x.y.z> — <YYYY-MM-DD>" followed by
  "- " bullets in plain prose (no PR links, no markdown emphasis — rendered as text).
-->

### v0.3.0 — 2026-07-14

- Light and dark mode — TrustScope follows your system theme, and a toggle in the header lets you override it.
- Share a report in one click — every report now has its own preview card, a share action, and a badge you can paste into your README.
- Shared report links open the real report, wherever they are opened from, instead of an empty one.
- A new side-by-side page shows how TrustScope differs from the OpenSSF Scorecard it is built on.
- Easier to read in bright light — a contrast pass across the landing pages and the whole report.
- A new FAQ answer on install scripts: what it means when a package runs its own code during installation, and how to look before you adopt.
- Plus the smaller things — Bodo on your browser tab, a reworked landing headline, binding Impressum and Datenschutz, and the usual upkeep.

### v0.2.0 — 2026-07-11

- Meet Bodo — TrustScope’s beaver mascot now guides you from the landing page through the report and into every export.
- A cleaner report — a fixed pillar order (Security → Trust → Community), each with its own colour, so the shape of a project reads at a glance.
- Three pillars, clearly named — the free report assesses exactly three, and never fakes a score it can't stand behind.
- A smoother start — a faster repository picker that fills your choice instead of jumping ahead.

### v0.1.0 — 2026-07-06

- Deterministic trust reports built on the OpenSSF Scorecard — see where a project is strong or weak, never one misleading single score.
- “Show your work” — an orientation summary up front, expandable per-finding evidence, and a Due-Diligence panel that surfaces quiet signals like install-script detection.
- A searchable repository picker with a Recently-Viewed strip — from landing to report in a couple of keystrokes.
- File findings upstream as yourself, per pillar, each carrying a transparent “via TrustScope” attribution.
- Take any report with you — Markdown or HTML export — plus dedicated adopter and maintainer paths.
- A trust surface you can check — Impressum, Datenschutz, an Open-Graph preview card, and a dogfooded security-hardening pass.
