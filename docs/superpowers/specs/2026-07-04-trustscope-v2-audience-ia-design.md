# TrustScope V2 — Audience & Public-Site Information Architecture (Design Spec)

> **Status:** DRAFT for review (MASCHIN gegen-check + Founder spec-review). Brainstormed 2026-07-04 (Linus + Founder).
> **Author:** Linus (Frontend). **Scope-boundary decision:** ONE focused spec — the audience/persona surface + the
> public-site IA + navigation. Landing-`/` hook-rework (TS3), Roadmap page (TS20), Pillar-Explainer subpages (TS23),
> and the full Dashboard (`/explore` + `/dashboard`) are **separate later specs**.
> **Grounds on** (planning repo = SSOT for the locked decisions):
> [v1-scope](https://github.com/neckarshore-ai/neckarshore-planning/blob/main/docs/plans/2026-07-01-trustscope-v1-scope.md) ·
> [v2-scope-decisions](https://github.com/neckarshore-ai/neckarshore-planning/blob/main/docs/plans/2026-07-03-trustscope-v2-scope-decisions.md).

## 1. Context & Goal

The current landing page (`app/page.tsx`) explains the product well (four pillars, no-score, how-it-works) but is
**adopter-only** and **proves nothing** about TrustScope itself — no "who's behind it", no persona orientation, no
credibility surface. For a *trust* product, that is self-undermining.

**Goal priority (Founder-ranked 2026-07-04):**

| Rank | Goal | What it means here |
|------|------|--------------------|
| 1 | **Credibility & trust** | A skeptical CTO must believe the tool itself is honest and serious before pasting a repo. |
| 2 | **Positioning / differentiation** | Sharpen "honest, no-score, constructive, upstream-friendly" vs. raw Scorecard / Snyk / Socket. |
| 3 | **Conversion** | Turn orientation into a paste-a-repo action. |
| 4 | **Discoverability (SEO/GEO)** | Be the cited source for "who is this OSS-trust tool for". |

**Audience & language (locked):** EN-first, global OSS-developer/CTO audience; **"Made in Germany / EU" as a trust
signal**, not the headline. Two **co-equal** personas — **Adopter** and **Maintainer** (V2 decision D-TS4).

## 2. Personas (first version — Linus-authored, Gary-review pending)

Both personas ask the **same question — "how trustworthy is this repository?"** — from opposite directions. Same
tool, same report, two vantage points. That shared question is the spine of the `/for` page.

### 2a. Adopter (Evaluator)

| Field | Value |
|-------|-------|
| Who | Developer / tech-lead / CTO evaluating a *third-party* OSS tool before taking on the dependency. |
| Recognition (on-page, EN) | *"You're about to build on someone else's code."* |
| Job-to-be-done | "Before I depend on this — how much can I trust it? Secure? Well-governed? Alive in a year?" → adopt / caution / avoid. |
| Pain today | Raw Scorecard is cryptic; no single trustworthy signal; hidden trade-offs; supply-chain risk (xz pattern); due diligence is manual + slow. |
| What TrustScope gives | Calm 4-pillar report · Due-Diligence panel · honest "no single score" · evidence transparency · verdict + note to save. |
| Primary CTA (EN) | *"Assess a repo you're evaluating"* → repo input. |
| Tone | Sober, decision-supporting. |

### 2b. Maintainer

| Field | Value |
|-------|-------|
| Who | Someone maintaining their *own* project (or their org's) who wants to know how trustworthy it *looks* to adopters. |
| Recognition (on-page, EN) | *"You want people to trust **your** code."* |
| Job-to-be-done | "How do evaluators see my project? Where are my trust gaps — and how do I close them?" → self-check + hardening roadmap. |
| Pain today | Doesn't know what evaluators look for; Scorecard feels intimidating; wants a friendly fix-list, not a verdict. |
| What TrustScope gives | The same report an adopter sees (mirror) · constructive rule-based fixes (Estate Hardening Standard) · file as issue to self · "Bring your own LLM" prompt export. |
| Primary CTA (EN) | *"Check how your own project looks"* → repo input (own repo). |
| Tone | Constructive, encouraging. |
| **Guardrail** | **Mirror + hardening guide, NOT a badge.** V1 deliberately rejected the maintainer/badge path (competes with scorecard.dev). No "badge to display" language. |

## 3. Information Architecture & URL map

Legend: ✅ exists · 🔁 changed by this spec · 🆕 new in this spec · 🔶 later spec · V3 deferred.

| URL | Status | Purpose |
|-----|--------|---------|
| `/` | ✅ | Landing — conversion surface (hook + repo input + tiles). Gains the global header (§5). |
| `/for` | 🆕 | **Persona hub** — "Who is TrustScope for?" Two co-equal sections, config order, Layout B (§4a). |
| `/for/adopters` | 🆕 | Spoke — Adopter explainer (find yourself). |
| `/for/maintainers` | 🆕 | Spoke — Maintainer explainer. |
| `/how-it-works` | 🔁 | **Renamed from `/about`** — product mechanics (§4d). |
| `/about` | 🔁 | **Repurposed** — company / who's-behind-it → neckarshore.ai + Made-in-Germany (§4d). |
| `/faq` | 🆕 | GEO workhorse — canonical `FAQPage` schema (§4c). |
| `/feedback` | 🆕 | **Reserved slug + nav slot; mechanism deferred** (ITSM-hold, §4e). |
| `/explore` | 🆕 (slot only) | Public curated "explore reports" — KPI tiles + curated examples. **Full design = own Dashboard spec** (§9). |
| `/report`, `/impressum`, `/datenschutz` | ✅ | Report; legal (DRAFT live). |
| `/roadmap`, `/pillars/…` | 🔶 | Later specs (TS20, TS23). |

**Funnel:** `/` is conversion (paste directly). `/for` is orientation for the hesitant ("is this for me?"); it links
from `/` via a quiet line (*"Not sure this fits you? See who TrustScope is for →"*) and every persona section funnels
back to the input. **Internal linking:** hub↔spokes; each spoke cross-links the *other* persona + back to the hub —
so the hub concentrates authority and the spokes catch long-tail without going thin.

**Slug conventions (locked):** nested spokes `/for/adopters` · `/for/maintainers` (hierarchy + long-tail). The
`/about`→`/how-it-works` rename moves the product-mechanics content to `/how-it-works` and repurposes `/about` for
the company page.

**Migration contract (`/about`) — explicit:** `/about` is **not** server-redirected — it stays a live URL serving
the new company page. So there is no 301 on the slug (a redirect would kill the repurposed page). The **canonical URL
for product-mechanics content is now `/how-it-works`**, and it is the sole target of every internal mechanics link.
For the pre-launch edge case of stray inbound that expected the old product `/about`, the repurposed `/about`
company page carries a **visible contextual link to `/how-it-works`** ("Looking for how TrustScope works? →"). This is
low-risk pre-launch (no established external bookmarks yet); if real legacy inbound ever materializes, revisit with a
dedicated redirect/landing decision. The earlier "optional 301" wording is retired as ambiguous.

## 4. Page designs (WHAT + structure — final optics belong to the TS30 design session)

### 4a. `/for` — persona hub (Layout B)

Chosen layout **B — "two doors" (side-by-side)**; **A (stacked) is the responsive form of B** below the `sm`
breakpoint (640px), where the 2-column grid collapses to one column.

**Structure (top → bottom):**
1. Header: H1 *"Who is TrustScope for?"* + subline *"Same tool, same report — two vantage points."*
2. Bracket paragraph: the shared question, both directions.
3. **Two co-equal persona sections** — order from a **config/prop-driven ordered array** (default Adopter-first),
   swappable without code change (foundation for the V3 slider). Each: recognition headline · "this is you if…" ·
   primary CTA → input · "Learn more →" deep-link to the spoke.
4. Contextual FAQ (2–3 questions) → deep-link to `/faq` (no schema here, to avoid FAQPage duplication).
5. CTA band → repo input.

**Desktop measurements (build target; consistent with existing tokens):** content container `max-w-5xl` = **1024px**
centered; two columns each **≈480px**; column gap **24px** (`gap-6`); inner padding **20px** (`px-5`). Content caps at
1024px — on wider screens only the side gutters grow. Stacks to one column below **640px** (`sm`).

### 4b. `/for/adopters` + `/for/maintainers` — spokes (mirrored structure)

1. H1 *"TrustScope for adopters"* / *"…for maintainers"* (long-tail).
2. Deep persona explainer: full JTBD + pain + how TrustScope pays off *per pillar* for this persona.
3. Concrete walkthrough: what the report shows this persona (Adopter: verdict/trade-off · Maintainer: fix-list).
4. Persona-specific FAQ — **unique** questions, so it *may* carry its own `FAQPage` schema (no duplication).
5. Cross-link to the other persona + back to hub + CTA → input.

### 4c. `/faq`

Canonical home for `FAQPage` JSON-LD (all Q&A in one place → strongest citability + one rich-result surface).
Guardrail: **do not duplicate FAQPage schema across URLs** — inline FAQ blocks elsewhere are plain content or carry
only their page-unique questions.

### 4d. `/how-it-works` (renamed) + `/about` (repurposed)

- `/how-it-works` — the current `/about` product-mechanics content, moved. **Canonical URL for product mechanics;**
  every internal mechanics link points here. Internal links updated.
- `/about` — **company / who's-behind-it**: Neckarshore AI, Made-in-Germany/EU, link to neckarshore.ai. This is the
  concrete home for the credibility signal (Goal 1). Carries `Organization` schema (§6). No separate `/about-us`.
  Carries a **visible contextual link to `/how-it-works`** ("Looking for how TrustScope works? →") for anyone who
  reached the repurposed slug expecting product mechanics (the migration contract, §3).

### 4e. `/feedback` (reserved, ITSM-gated)

Reserve the slug + nav slot. **Mechanism deferred** per the locked ITSM-hold (TS21/TS33 route through central ITSM,
not bespoke). "Appreciation" is really social proof (a separate, still-open V2 gap) — different bucket from bug/idea.
No feedback intake is built until the ITSM direction is decided (Founder confirmed reserve-and-defer 2026-07-04).

## 5. Navigation (V2)

Today there is **no header nav**. This spec adds a **global header** on every page.

| Slot | Content |
|------|---------|
| Left | Wordmark "TrustScope" → `/`. **Placeholder** — real logo = TS1 branding (gated on Founder design patterns / Neckarshore Brand-Kit). |
| Center | **`For whom ▾`** menu **button** — opens the menu only, **does not navigate** (one job, per a11y below). Menu items: **Overview → `/for`** (the hub, first item) · Adopters → `/for/adopters` · Maintainers → `/for/maintainers`. Alongside it: `How it works` · `Explore` · `FAQ` · `About`. |
| Right | **`Log in`** button → **"Coming soon"** (tooltip/toast, not navigable). Placeholder for TS6 Accounts/Login (a V2 feature not yet built). |
| Mobile | Hamburger → drawer with the same links + Login. |
| Footer | Legal (`/impressum`, `/datenschutz`) + Feedback + Neckarshore credibility line (*"A Neckarshore AI product · Made in Germany"* → neckarshore.ai). **Not** in the header. |

**Dropdown chosen (Founder, 2026-07-04)** over a flat link. **Single responsibility (a11y):** the `For whom ▾`
trigger **only toggles the menu — it never navigates**; the `/for` hub is reached as the **first menu item**
("Overview → `/for`"). This avoids one control doing two jobs (navigate + toggle), which is fragile for
keyboard/screen-reader users. **A11y is a hard build requirement:** the trigger is a `button` with
`aria-haspopup`/`aria-expanded`, keyboard operable (Enter/Space toggles, Arrow keys move within, Escape closes),
focus management, no hover-only. Roadmap link is added when TS20 ships.

## 6. SEO/GEO treatment

| Lever | Implementation |
|-------|----------------|
| Per-page metadata | Own `<title>` + description per page. `/for`: "Who is TrustScope for? — Adopters & Maintainers". Spokes persona-targeted. |
| `FAQPage` schema | Canonical on `/faq`; spokes optional for their unique questions; never duplicated. |
| `Organization` schema | On `/about` (Neckarshore AI) — entity/trust signal for GEO. |
| `BreadcrumbList` | Hub → spoke (`/for` → `/for/adopters`) — SERP + GEO. |
| `llms.txt` | TrustScope-own `llms.txt` listing the core pages for AI crawlers (GPTBot / ClaudeBot / PerplexityBot). |
| Citability (GEO) | `/for` + `/faq` written in clear, quotable sentences, e.g. *"TrustScope is for two audiences: adopters evaluating a third-party project, and maintainers checking their own."* |
| Sitemap + canonicals | New routes added to `sitemap.xml`; clean canonicals. |

## 7. Swap semantics (locked)

The two `/for` sections render from a **config/prop-driven ordered list** (default Adopter-first). Swapping = reorder
the list (campaign / A-B / future personalization). **Not** a runtime visitor toggle. This is the lightest correct
build and sets the foundation for the V3 persona-weighting slider (§9).

## 8. Component boundaries (isolation)

Each unit has one purpose, a clear interface, and is testable alone:

1. `SiteHeader` (nav + dropdown + Login-coming-soon) — global, prop: active route.
2. `SiteFooter` (credibility line + legal + feedback links) — global.
3. `PersonaSection` — one persona block; prop: persona data + variant (hub-card vs spoke-hero). Reused on `/for` and spokes.
4. `PersonaHub` (`/for`) — renders an **ordered array** of `PersonaSection` (the swap seam).
5. `Faq` — question/answer list; prop: whether to emit `FAQPage` schema (canonical on `/faq`, off on `/for`).
6. Per-page metadata + schema via the existing `lib/seo`-style helper.

## 9. Out of scope / deferred to V3

| Item | Why deferred |
|------|--------------|
| **Persona-weighting slider** | Registered users weight their persona 1–10 (left Adopter · right Maintainer · middle both). Needs accounts + personalization. **V3 backlog.** |
| **"Buy me a coffee"** | Support link. Moved V2→V3 (Founder, 2026-07-04). Must be a **self-hosted `<a>`**, never the external `cdnjs.buymeacoffee.com` widget script (GDPR + Lighthouse). Also removes any D6 monetization-tension from V2. **V3 backlog.** |
| **Full public gallery** | A live grading-list of recently-run third-party repos = the ethics-deferred public Trust-Gallery (V1 OUT, V2 D7 → V3). V2 `/explore` stays **curated** (KPI tiles + our dogfood/known examples), not a live feed. |
| **`/dashboard` (registered)** | Personalized private view — needs accounts (V3). The public curated `/explore` is V2-safe; the full Dashboard is its **own brainstorm/spec**. |

## 10. Dependencies

1. **Persona copy:** Linus authors v1 (this spec), **Gary reviews** — a deliberate reversal of the locked copy-pipeline
   (was: MASCHIN → Gary drafts → Linus builds). Rationale: Gary would have to read into the same docs we already hold.
2. **Logo / branding (TS1):** wordmark is a text placeholder until the Neckarshore Brand-Kit / Founder design patterns land.
3. **Final optics (TS30):** all visual/theme design is the dedicated TS30 design session (`frontend-design`). This spec
   fixes WHAT + structure + measurements, not the final look.

## 11. FOR MASCHIN (reconcile in the locked planning docs)

1. **D-TS4 delta:** the persona surface is **one authoritative hub `/for` + two explainer spokes**, not only "je eigene
   Unterseite". Reconcile D-TS4's wording (co-equal is honored; the hub is added above the subpages).
2. **Copy-pipeline reversal:** Linus authors persona copy v1, Gary reviews — reconcile the V2 scope-decisions housekeeping note.
3. **ITSM-hold confirmed:** `/feedback` = reserve-and-defer (Founder). No bespoke feedback build in V2.
4. **Dashboard = own spec:** `/explore` (V2 curated) + `/dashboard` (V3 registered); full public gallery stays V3 (ethics).
5. **Backlog to file:** persona-weighting slider (V3), Buy-me-a-coffee self-hosted link (V3), Gary persona-copy review.

## 12. Decision log (this session, 2026-07-04)

| # | Decision |
|---|----------|
| 1 | Goal priority: credibility > positioning > conversion > SEO/GEO. |
| 2 | EN-first; personas Adopter + Maintainer co-equal; Made-in-Germany = trust signal. |
| 3 | Persona surface = one `/for` hub + two nested spokes (reconciles D-TS4). |
| 4 | `/for` layout = **B** (two doors); A = its responsive/mobile form; config-driven order; default Adopter-first. |
| 5 | FAQ = canonical `/faq` (FAQPage schema) + contextual page blocks without schema. |
| 6 | `/about` → `/how-it-works` (product); `/about` repurposed = company → neckarshore.ai + Made-in-Germany. |
| 7 | `/feedback` reserved, mechanism ITSM-gated (deferred). |
| 8 | Login = "Coming soon" placeholder button (TS6 V2 feature, not yet built). |
| 9 | Navigation = **dropdown** "For whom ▾" (A11y-mandatory) + global header + footer. |
| 10 | Dashboard split: `/explore` (V2 curated, ethics-safe) + `/dashboard` (V3 registered) — own spec. |
| 11 | V3: persona-weighting slider; Buy-me-a-coffee (self-hosted link); full public gallery. |
