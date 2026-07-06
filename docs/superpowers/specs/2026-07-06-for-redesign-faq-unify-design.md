# `/for` Redesign + FAQ Unification + Header Polish — Design

**Date:** 2026-07-06
**Author:** Linus (Frontend)
**Status:** Design accepted (visual signed off by Founder on the final `/for` mockup, both personas)
**Branch:** `linus/2026-07-06-for-redesign-faq-unify` (off `main` @ `d9b509b`)

## Goal

Turn the two persona pages (`/for/adopters`, `/for/maintainers`) into one shared, product-style subpage template modelled on the neckarshore.ai product pages (clearpath). Remove the `/for` Overview page. Unify the FAQ interface so `/faq` uses the same accordion component as the persona pages, with a deduplicated content split. Add the Bodo mascot and a Feedback link to the header.

Non-goals for this plan are listed under [Out of scope](#out-of-scope).

## Design decisions (all Founder-confirmed)

1. **One shared template** drives both persona pages. Same section order, same components; only content and persona accent differ.
2. **Persona accent colors:** Adopter = teal (`--brand` `#2dd4bf`), Maintainer = amber (`#fbbf24`). Applied to eyebrow, flow rail, picker button, cross-link, and FAQ open-state.
3. **Overview page removed.** `/for` (the hub) and its "Who is TrustScope for?" framing go away as a standalone destination.

## Template structure (both personas)

Section order, top to bottom:

1. **Hero** — persona eyebrow (with icon) → short headline → one-line lede → **repo picker directly below** (the existing `RepoForm`) → subtle text cross-link to the other persona.
   - Adopter headline framing: *"before you depend on a project."*
   - Maintainer headline framing: *"before you publish a project."*
2. **Who does what — and why** — a three-step narrative flow (You → TrustScope → You) with a vertical accent rail and a small icon per step.
3. **How TrustScope helps** — section heading + a one-sentence explanatory subtitle + the **four pillars as a 2×2 grid of colored cards** (pillar hues match the landing page: slate / emerald / sky / amber) + a **"No single aggregate score"** box with an equal-width **Adopt / Proceed / Avoid** traffic light.
4. **Frequently asked** — the shared **card accordion** (bordered cards, rotating `+`), persona-specific questions only.

Removed from the old design: the "What makes this hard" pains section and the post-FAQ footer cross-link block.

The rendered reference is the accepted mockup (final version, both personas).

## Component & file plan

### New / changed components

1. `components/PersonaSpoke.tsx` — rewritten to the new template. Consumes the extended persona config; renders hero+picker, the who/what/why flow, the pillars grid + verdict light, and the shared FAQ accordion.
2. `components/FaqAccordion.tsx` — **new shared component**. A list of `<details>` cards (bordered, rotating `+`, accent-on-open). Props: `items: FaqItem[]`, optional `accent` token. Used by both `/faq` and the persona pages. This is the single source of the FAQ interface (rule-of-three met: 3 call sites).
3. `components/SiteHeader.tsx` — add the Bodo mascot (`public/bodo.svg`) top-left, immediately left of / beside the TrustScope wordmark. Add a **Feedback** entry to the header nav (via `config/nav.ts`).
4. **Pillar hues → `config/pillars.ts`** — extract the four pillar hues + questions into one config. The 2×2 grid + verdict light render **inline in `PersonaSpoke`** (not a separate component — only used there). The landing page's existing four-pillar block is refactored to read the same hue config so the two cannot drift (single source of truth for pillar color).

### Config

5. `config/personas.ts` — extend each persona's `spoke` with: `heroTitle`, `heroLede`, the three `whoWhatWhy` steps (role + text), the `verdictCaption` (maintainer only), and `faqs: FaqItem[]` (persona-specific, deduped). Keep the existing `PERSONA_ORDER` seam.
6. `config/faq.ts` — reduce `FAQ_ITEMS` to **general, product-wide questions only** (see FAQ split). No persona-specific duplicates.
7. `config/nav.ts` — remove the `Overview` child from the "For whom" dropdown (leaving Adopters + Maintainers). Add a `Feedback` top-level item → `/feedback`.

### Routes

8. **Delete** `app/for/page.tsx` (the Overview route). Remove its entry from `app/sitemap.ts`.
9. `app/faq/page.tsx` — render via the new `FaqAccordion` instead of the plain `<dl>`. Keep the `FAQPage` JSON-LD (built from `FAQ_ITEMS`).
10. `app/for/adopters/page.tsx`, `app/for/maintainers/page.tsx` — unchanged wiring (still `PersonaSpoke`), the new template renders through the extended config.
11. `components/PersonaSpoke.tsx` breadcrumb JSON-LD — drop the now-dead `/for` "Who is TrustScope for?" list item. The breadcrumb becomes **Home → persona page** (2 items).

## FAQ content split (dedup)

| # | Question | Lives on |
|---|----------|----------|
| 1 | Do I need an account to read a report? | `/faq` (general) |
| 2 | Why is there no single score? | `/faq` (general) |
| 3 | Where does the data come from? | `/faq` (general) |
| 4 | Does TrustScope store my data? | `/faq` (general) |
| 5 | What is an adopter? / What is a maintainer? | `/faq` (allowed persona-defining) |
| 6 | What does TrustScope do for adopters? | `/for/adopters` |
| 7 | How is this different from a star count or a green badge? | `/for/adopters` |
| 8 | What is the "xz pattern", and how does TrustScope surface it? | `/for/adopters` |
| 9 | What does TrustScope do for maintainers? | `/for/maintainers` |
| 10 | Will TrustScope give my project a badge or score? | `/for/maintainers` |
| 11 | What do evaluators actually look for? | `/for/maintainers` |
| 12 | How do I fix a finding? | `/for/maintainers` |

Rule: the persona pages carry no question that duplicates a `/faq` entry. "Account" and "no single score" live on `/faq` and are dropped from the persona FAQs.

## SEO / GEO

- Every FAQ set keeps its `FAQPage` JSON-LD. Persona pages gain their own `FAQPage` block from the persona `faqs`.
- Questions stay in question form, entity-named, with self-contained answers (AI-Overviews / Perplexity citability).
- No duplicate `Question` names across the site's `FAQPage` graphs (the dedup enforces this).

## Testing

- `e2e/repo-selection.spec.ts` — unaffected combobox behavior must still pass on the persona pages (the picker is now in the persona hero too).
- **New e2e:** `/for` (Overview) returns 404/removed; the "For whom" dropdown has exactly two children; `/faq` renders accordion `<details>` and each opens; persona pages render their pillars grid, verdict light, and persona FAQ.
- **New unit:** a guard test asserting **no duplicate question strings** across `FAQ_ITEMS` ∪ all persona `faqs` (locks the dedup invariant).
- Pillar-hue single-source unit: persona pages and landing read the same hue config.

## Out of scope (backlog / other lanes)

1. **Feedback backend** — the `/feedback` submission opening GitHub issues via the ITSM process is **backend (Bob)** and the ITSM process is still being designed. This plan ships only the **frontend** header link + the existing `/feedback` page. → dependency note for MASCHIN/Bob.
2. **Bodo position + size on the landing page** — to be discussed separately (this plan only places Bodo in the header).
3. **`/about` content** — Founder wants to revisit copy; not a showstopper. Backlog.
4. **Report / Scorecard A/B designs** — a separate design round, later.
