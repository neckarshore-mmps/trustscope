# Changelog

All notable changes to **TrustScope**. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[Semantic Versioning](https://semver.org/). Pre-1.0 (`0.x`) means the shape
can still move. Entries land under **[Unreleased]** per user-facing change;
each release links the pull requests it contains.

## [Unreleased]

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

### v0.2.0 — 2026-07-11

- Meet Bodo — TrustScope’s beaver mascot now guides you from the landing page through the report and into every export.
- A cleaner report — a fixed pillar order (Security → Trust → Community), each with its own colour, so the shape of a project reads at a glance.
- Three pillars, clearly named — the free report assesses three pillars; Functional Quality is a Pro-only pillar, never a faked score.
- A smoother start — a faster repository picker that fills your choice instead of jumping ahead.

### v0.1.0 — 2026-07-06

- Deterministic four-pillar trust reports built on the OpenSSF Scorecard — see where a project is strong or weak, never one misleading single score.
- “Show your work” — an orientation summary up front, expandable per-finding evidence, and a Due-Diligence panel that surfaces quiet signals like install-script detection.
- A searchable repository picker with a Recently-Viewed strip — from landing to report in a couple of keystrokes.
- File findings upstream as yourself, per pillar, each carrying a transparent “via TrustScope” attribution.
- Take any report with you — Markdown or HTML export — plus dedicated adopter and maintainer paths.
- A trust surface you can check — Impressum, Datenschutz, an Open-Graph preview card, and a dogfooded security-hardening pass.
