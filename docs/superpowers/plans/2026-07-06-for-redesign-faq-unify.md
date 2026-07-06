# `/for` Redesign + FAQ Unification + Header Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/for/adopters` + `/for/maintainers` into one shared product-style template, remove the `/for` Overview page, unify the FAQ interface across `/faq` and the persona pages with deduplicated content, single-source the pillar colors, and add Bodo + a Feedback link to the header.

**Architecture:** Data lives in `config/*` (personas, pillar meta, general FAQ). Presentation lives in `components/*` (`PersonaSpoke` renders the template; `FaqAccordion` is the one shared FAQ interface used by three call sites). Pillar colors are single-sourced in `config/pillars.ts` so persona pages and the landing page cannot drift. Persona accent is a CSS custom property (`--accent`) set on the page wrapper — no dynamic Tailwind class names.

**Tech Stack:** Next.js 15 (App Router, RSC), Tailwind CSS, Vitest (unit, `lib/*.test.ts`), Playwright (e2e, `e2e/*.spec.ts`).

**Visual reference:** The Founder-accepted mockup (final, both personas) — Artifact `https://claude.ai/code/artifact/1282e264-d009-4cdc-8e74-51817fe136e2`. Port its layout to Tailwind using the repo's existing token classes (`bg-surface`, `text-muted`, `border-border`, `text-brand`, …).

## Global Constraints

- Dependencies: exact versions, no `^`/`~` (none added in this plan).
- No aggregate score anywhere — always four pillars, verdict per pillar.
- Persona accent: **Adopter = teal `#2dd4bf` (ink `#04211d`)**, **Maintainer = amber `#fbbf24` (ink `#2a1c00`)**.
- Pillar hues (fixed, from landing): Functional `#94a3b8` · Security `#6ee7b7` · Governance `#7dd3fc` · Community `#fcd34d`.
- FAQ answers stay question-form, entity-named, self-contained (GEO). **No duplicate question string** across `/faq` ∪ persona FAQs.
- Feedback **backend** (ITSM/GitHub issues) is out of scope (Bob lane); this plan ships the frontend header link only.
- Commit after every task. Run `npm run lint && npm run typecheck` before each commit.

---

### Task 1: Single-source pillar colors (`config/pillars.ts`)

**Files:**
- Create: `config/pillars.ts`
- Create: `config/pillars.test.ts`
- Modify: `app/page.tsx:41-70` (landing `PILLARS` reads title+hue from the new config)

**Interfaces:**
- Produces: `PILLARS_META: readonly PillarMeta[]` where `PillarMeta = { id: 1|2|3|4; key: string; title: string; hue: string }`.

- [ ] **Step 1: Write the failing test**

```ts
// config/pillars.test.ts
import { describe, it, expect } from "vitest";
import { PILLARS_META } from "./pillars";

describe("PILLARS_META", () => {
  it("has exactly four pillars with ids 1..4", () => {
    expect(PILLARS_META.map((p) => p.id)).toEqual([1, 2, 3, 4]);
  });
  it("carries the fixed landing hues", () => {
    expect(PILLARS_META.map((p) => p.hue)).toEqual([
      "#94a3b8", "#6ee7b7", "#7dd3fc", "#fcd34d",
    ]);
  });
  it("titles match the report-core pillar titles", () => {
    expect(PILLARS_META.map((p) => p.title)).toEqual([
      "Functional Quality", "Security & Supply Chain",
      "Trust & Governance", "Community & Sustainability",
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run config/pillars.test.ts`
Expected: FAIL — cannot find module `./pillars`.

- [ ] **Step 3: Write minimal implementation**

```ts
// config/pillars.ts
export type PillarMeta = {
  readonly id: 1 | 2 | 3 | 4;
  readonly key: string;
  readonly title: string;
  readonly hue: string; // fixed accent color, single source of truth
};

/** Canonical pillar identity — title + hue. Question/blurb are surface-specific.
 *  Landing and persona pages BOTH read hue from here so colors cannot drift. */
export const PILLARS_META: readonly PillarMeta[] = [
  { id: 1, key: "functional-quality", title: "Functional Quality", hue: "#94a3b8" },
  { id: 2, key: "security-supply-chain", title: "Security & Supply Chain", hue: "#6ee7b7" },
  { id: 3, key: "trust-governance", title: "Trust & Governance", hue: "#7dd3fc" },
  { id: 4, key: "community-sustainability", title: "Community & Sustainability", hue: "#fcd34d" },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run config/pillars.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Refactor landing to read hue+title from the config**

In `app/page.tsx`, replace the inline `PILLARS` array's `title` and `accent` usage so the color comes from `PILLARS_META[i].hue` via an inline style, keeping the landing's own `q` + `body` copy. Set the pillar label color with `style={{ color: meta.hue }}` instead of the `text-slate-400`-style class. Keep the section markup otherwise unchanged.

- [ ] **Step 6: Verify landing still builds + typechecks**

Run: `npm run typecheck && npm run build`
Expected: PASS, no type errors.

- [ ] **Step 7: Commit**

```bash
git add config/pillars.ts config/pillars.test.ts app/page.tsx
git commit -m "feat(pillars): single-source pillar hues in config/pillars.ts"
```

---

### Task 2: FAQ content split + no-duplicate guard

**Files:**
- Modify: `config/faq.ts` (reduce to general-only questions)
- Modify: `config/personas.ts` (add persona `faqs` + template copy fields)
- Create: `config/faq-dedup.test.ts`

**Interfaces:**
- Consumes: `FaqItem` from `config/faq.ts`.
- Produces: extended `Persona.spoke` with `heroTitle: string`, `heroLede: string`, `submitLabel: string`, `placeholder: string`, `accentHex: string`, `accentInk: string`, `whoWhatWhy: readonly { role: string; you: boolean; text: string }[]`, `helpsSub: string`, `nsaHeading: string`, `verdictCaption: string | null`, `faqs: readonly FaqItem[]`, `crossLinkLead: string`.

- [ ] **Step 1: Write the failing dedup test**

```ts
// config/faq-dedup.test.ts
import { describe, it, expect } from "vitest";
import { FAQ_ITEMS } from "./faq";
import { PERSONAS } from "./personas";

describe("FAQ dedup invariant", () => {
  it("no question string appears in more than one FAQ set", () => {
    const all = [
      ...FAQ_ITEMS.map((f) => f.q),
      ...PERSONAS.adopter.spoke.faqs.map((f) => f.q),
      ...PERSONAS.maintainer.spoke.faqs.map((f) => f.q),
    ].map((q) => q.trim().toLowerCase());
    const dupes = all.filter((q, i) => all.indexOf(q) !== i);
    expect(dupes).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run config/faq-dedup.test.ts`
Expected: FAIL — `PERSONAS.adopter.spoke.faqs` is undefined.

- [ ] **Step 3: Reduce `config/faq.ts` to general-only questions**

```ts
// config/faq.ts
export type FaqItem = { readonly q: string; readonly a: string };

/** General, product-wide FAQ. Persona-specific questions live on the /for pages. */
export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    q: "What is TrustScope?",
    a: "TrustScope reads a public GitHub repository across four pillars — Functional Quality, Security & Supply Chain, Trust & Governance, and Community & Sustainability — and gives a verdict per pillar, with no misleading single score.",
  },
  {
    q: "What is an adopter, and what is a maintainer?",
    a: "An adopter is evaluating someone else's project before depending on it; a maintainer runs their own project to see and close the trust gaps adopters look for. Both read the same four-pillar report from opposite directions.",
  },
  {
    q: "Do I need an account to read a report?",
    a: "No. Reading any report is anonymous and needs no sign-in. Accounts (to save history and email reports) are coming later.",
  },
  {
    q: "Why is there no single score?",
    a: "Each pillar answers a different question. Collapsing security, governance and community into one number hides the exact trade-off you are trying to weigh — so TrustScope keeps them separate.",
  },
  {
    q: "Where does the data come from?",
    a: "The full OpenSSF Scorecard plus public GitHub governance and lifecycle signals. The same repository always produces the same report — it is deterministic, with no LLM in the loop.",
  },
  {
    q: "Does TrustScope store my data?",
    a: "Reading a report stores nothing about you. It is self-hosted, GDPR-clean, with no third-party trackers.",
  },
];
```

- [ ] **Step 4: Extend `config/personas.ts` with template copy + persona FAQs**

Add `import type { FaqItem } from "./faq";`. Extend the `Persona.spoke` type with the fields from Interfaces above, and fill both personas. Adopter `faqs` (deduped — no account/no-single-score, those are on `/faq`):

```ts
// adopter spoke.faqs
faqs: [
  { q: "What does TrustScope do for adopters?",
    a: "It assesses a third-party open-source project before you depend on it, reading four pillars separately — Functional Quality, Security & Supply Chain, Trust & Governance, and Community & Sustainability — so you can decide adopt, proceed, or avoid." },
  { q: "How is this different from a star count or a green badge?",
    a: "Stars and badges signal popularity, not risk. TrustScope reads the full OpenSSF Scorecard plus governance and community signals, and keeps the trade-offs visible instead of averaging them into one number." },
  { q: "What is the \"xz pattern\", and how does TrustScope surface it?",
    a: "The xz backdoor showed how supply-chain risk stays invisible until it detonates. The Security & Supply Chain pillar reads the full Scorecard signals so the risk is legible before you take the dependency." },
],
```

Maintainer `faqs`:

```ts
// maintainer spoke.faqs
faqs: [
  { q: "What does TrustScope do for maintainers?",
    a: "It shows the same four-pillar report an adopter sees on your repo — Functional Quality, Security & Supply Chain, Trust & Governance, Community & Sustainability — plus a constructive fix-list you can file as issues." },
  { q: "Will TrustScope give my project a badge or score?",
    a: "No. No badge, no single score. It is a mirror and a hardening guide — findings with fixes, never a grade." },
  { q: "What do evaluators actually look for?",
    a: "The four pillars — the full OpenSSF Scorecard plus governance and community signals. TrustScope makes each one legible so nothing is a surprise." },
  { q: "How do I fix a finding?",
    a: "Every finding carries a constructive, rule-based fix you can file as an issue on your own project, as yourself — carrying a \"via TrustScope\" attribution footer." },
],
```

Template copy per persona (exact strings from the accepted mockup):

```ts
// adopter spoke additions
heroTitle: "Before you depend on a project, know how far to trust it.",
heroLede: "Secure, well-governed, and still maintained next year? Check any repo before you take on the dependency.",
submitLabel: "Assess →",
placeholder: "ossf/scorecard  ·  https://github.com/owner/repo",
accentHex: "#2dd4bf", accentInk: "#04211d",
whoWhatWhy: [
  { role: "the adopter", you: true, text: "Evaluating a third-party library, framework or tool before you take on the dependency." },
  { role: "reads the repo", you: false, text: "Runs the full OpenSSF Scorecard and reads four pillars separately — never averaging the trade-offs away." },
  { role: "decide, then act", you: true, text: "Adopt, proceed with caution, or avoid — and file constructive fixes upstream, as yourself." },
],
helpsSub: "Four questions, answered separately — so the trade-off you're weighing stays visible instead of collapsing into one grade.",
nsaHeading: "No single aggregate score. A verdict per pillar — the decision stays yours.",
verdictCaption: null,
crossLinkLead: "Maintaining your own project instead?",
```

```ts
// maintainer spoke additions
heroTitle: "Before you publish, see your project the way evaluators will.",
heroLede: "The same four-pillar report an adopter gets on your repo — plus a friendly, concrete list of what to harden.",
submitLabel: "Check →",
placeholder: "your-org/your-repo",
accentHex: "#fbbf24", accentInk: "#2a1c00",
whoWhatWhy: [
  { role: "the maintainer", you: true, text: "You maintain your own project and want people to trust it — without guessing what evaluators look for." },
  { role: "mirrors your repo", you: false, text: "Shows the same four-pillar report an adopter would see — nothing about how you're perceived is a surprise." },
  { role: "harden, then file", you: true, text: "Every finding comes with a constructive, rule-based fix you can file as an issue on your own project." },
],
helpsSub: "The four questions evaluators actually ask — each answered separately, so you know exactly what to harden.",
nsaHeading: "No single aggregate score — and never a badge. A verdict per pillar.",
verdictCaption: "The verdict an adopter reaches on your repo — close the gaps before they do.",
crossLinkLead: "Evaluating someone else's code instead?",
```

Per-pillar persona wording (question + blurb, 4 each) — add `pillars: readonly { q: string; blurb: string }[]` to each spoke:

```ts
// adopter spoke.pillars
pillars: [
  { q: "Is it well-built?", blurb: "Testing, CI, review & build signals." },
  { q: "Is it built securely?", blurb: "The full OpenSSF Scorecard — where the xz pattern hides." },
  { q: "Can I trust the project behind it?", blurb: "Ownership, licensing & security policy." },
  { q: "Will it be here in a year?", blurb: "Activity & contributor lifecycle." },
],
// maintainer spoke.pillars
pillars: [
  { q: "Is it well-built?", blurb: "Testing, CI, review & build signals." },
  { q: "Is it built securely?", blurb: "The full OpenSSF Scorecard — the surface adopters scrutinise most." },
  { q: "Can they trust the project behind it?", blurb: "Ownership, licensing & security policy." },
  { q: "Will it be here in a year?", blurb: "Activity & contributor lifecycle." },
],
```

Also add `pillars` and `faqs` etc. to the `Persona.spoke` type. Remove the now-unused `pains`, `perPillar`, `walkthrough` fields **only after** Task 4 stops consuming them (keep them for now to avoid breaking the current `PersonaSpoke` — they are removed in Task 4).

- [ ] **Step 5: Run the dedup test + typecheck**

Run: `npx vitest run config/faq-dedup.test.ts && npm run typecheck`
Expected: dedup PASS; typecheck PASS.

- [ ] **Step 6: Commit**

```bash
git add config/faq.ts config/personas.ts config/faq-dedup.test.ts
git commit -m "feat(faq): dedup content split + persona template copy in config"
```

---

### Task 3: Shared `FaqAccordion` component + wire `/faq`

**Files:**
- Create: `components/FaqAccordion.tsx`
- Modify: `app/faq/page.tsx` (render via `FaqAccordion`, keep JSON-LD)
- Create: `e2e/faq.spec.ts`

**Interfaces:**
- Consumes: `FaqItem` from `config/faq.ts`.
- Produces: `FaqAccordion({ items, accent }: { items: readonly FaqItem[]; accent?: string })` — renders one `<details class="group">` card per item; the first item is `open`. `accent` is a CSS color used for the open-state border/`+`; defaults to `var(--brand)`.

- [ ] **Step 1: Write the failing e2e test**

```ts
// e2e/faq.spec.ts
import { test, expect } from "@playwright/test";

test("/faq renders an accordion; items expand", async ({ page }) => {
  await page.goto("/faq");
  const items = page.locator("details");
  await expect(items).not.toHaveCount(0);
  const second = items.nth(1);
  await expect(second).not.toHaveAttribute("open", "");
  await second.getByRole("group").or(second.locator("summary")).first().click();
  await expect(second).toHaveAttribute("open", "");
});

test("/faq has no persona-specific question duplicated from /for", async ({ page }) => {
  await page.goto("/faq");
  await expect(page.getByText("What does TrustScope do for adopters?")).toHaveCount(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test e2e/faq.spec.ts`
Expected: FAIL — `/faq` renders a `<dl>`, no `<details>`.

- [ ] **Step 3: Implement `FaqAccordion`**

```tsx
// components/FaqAccordion.tsx
import type { FaqItem } from "@/config/faq";

export function FaqAccordion({
  items,
  accent = "var(--brand)",
}: {
  items: readonly FaqItem[];
  accent?: string;
}) {
  return (
    <div className="flex flex-col gap-2.5" style={{ ["--fa" as string]: accent }}>
      {items.map((f, i) => (
        <details
          key={f.q}
          open={i === 0}
          className="group overflow-hidden rounded-xl border border-border bg-surface open:border-[color-mix(in_srgb,var(--fa)_45%,transparent)]"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 font-semibold [&::-webkit-details-marker]:hidden">
            {f.q}
            <span className="grid h-5 w-5 flex-none place-items-center rounded-md border border-border text-muted transition-transform group-open:rotate-45 group-open:text-[var(--fa)]">
              +
            </span>
          </summary>
          <div className="px-4 pb-4 text-[13.5px] leading-relaxed text-muted">{f.a}</div>
        </details>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Wire `/faq` to use it**

```tsx
// app/faq/page.tsx — replace the <dl> block with:
import { FaqAccordion } from "@/components/FaqAccordion";
// ...inside the return, keep <JsonLd data={FAQ_SCHEMA} /> and <h1>, then:
<div className="mt-8">
  <FaqAccordion items={FAQ_ITEMS} />
</div>
```

Remove the old `<dl>…</dl>` markup. Keep `FAQ_SCHEMA` + `<JsonLd>` unchanged.

- [ ] **Step 5: Run tests + typecheck**

Run: `npx playwright test e2e/faq.spec.ts && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/FaqAccordion.tsx app/faq/page.tsx e2e/faq.spec.ts
git commit -m "feat(faq): shared FaqAccordion component, /faq uses it"
```

---

### Task 4: Rewrite `PersonaSpoke` to the shared template

**Files:**
- Modify: `components/PersonaSpoke.tsx` (full rewrite)
- Modify: `config/personas.ts` (remove now-dead `pains`/`perPillar`/`walkthrough`)
- Create: `e2e/persona-template.spec.ts`

**Interfaces:**
- Consumes: extended `Persona.spoke` (Task 2), `PILLARS_META` (Task 1), `FaqAccordion` (Task 3), existing `RepoForm` (`submitClassName`/`submitLabel`/`placeholder` props).
- Produces: the rendered persona page (hero+picker, who/what/why flow, pillars grid + verdict light, persona `FaqAccordion`).

- [ ] **Step 1: Write the failing e2e test**

```ts
// e2e/persona-template.spec.ts
import { test, expect } from "@playwright/test";

for (const [path, heading, first] of [
  ["/for/adopters", "Before you depend on a project, know how far to trust it.", "What does TrustScope do for adopters?"],
  ["/for/maintainers", "Before you publish, see your project the way evaluators will.", "What does TrustScope do for maintainers?"],
] as const) {
  test(`${path} renders template + persona FAQ`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(page.getByRole("combobox")).toBeVisible();           // repo picker in hero
    await expect(page.getByText("Functional Quality")).toBeVisible(); // pillars grid
    await expect(page.getByText("Adopt", { exact: true })).toBeVisible(); // verdict light
    await expect(page.getByText(first)).toBeVisible();                // persona FAQ (accordion)
    await expect(page.locator("details")).not.toHaveCount(0);
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test e2e/persona-template.spec.ts`
Expected: FAIL — new headline/pillars/verdict not present on the old layout.

- [ ] **Step 3: Rewrite `PersonaSpoke` — hero + picker + cross-link**

```tsx
// components/PersonaSpoke.tsx (part 1 of 3)
import Link from "next/link";
import type { Persona } from "@/config/personas";
import { PRODUCT_SUBDOMAIN } from "@/config/product";
import { PILLARS_META } from "@/config/pillars";
import { JsonLd } from "@/components/JsonLd";
import { RepoForm } from "@/components/RepoForm";
import { FaqAccordion } from "@/components/FaqAccordion";

export function PersonaSpoke({ persona, other }: { persona: Persona; other: Persona }) {
  const base = `https://${PRODUCT_SUBDOMAIN}`;
  const s = persona.spoke;
  return (
    <div style={{ ["--accent" as string]: s.accentHex, ["--accent-ink" as string]: s.accentInk }}>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: base },
          { "@type": "ListItem", position: 2, name: s.title, item: `${base}${persona.spokeHref}` },
        ],
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: s.faqs.map((f) => ({ "@type": "Question", name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a } })),
      }} />
      <section className="hero-glow">
        <div className="mx-auto max-w-2xl px-5 pb-6 pt-20 text-center sm:pt-24">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
            {persona.tag}
          </span>
          <h1 className="mx-auto mt-3 max-w-[22ch] text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {s.heroTitle}
          </h1>
          <p className="mx-auto mt-4 max-w-[46ch] text-[15px] text-muted">{s.heroLede}</p>
          <div className="mx-auto mt-6 max-w-md text-left">
            <RepoForm
              submitClassName="bg-[var(--accent)] text-[var(--accent-ink)] transition-opacity hover:opacity-90"
              submitLabel={s.submitLabel}
              placeholder={s.placeholder}
            />
          </div>
          <p className="mt-3.5 text-[13px] text-muted">
            {s.crossLinkLead}{" "}
            <Link href={other.spokeHref} className="text-[var(--accent)] underline underline-offset-2">
              {other.spoke.title}
            </Link>
          </p>
        </div>
      </section>
      {/* parts 2 + 3 appended below */}
    </div>
  );
}
```

- [ ] **Step 4: Add who/what/why flow + pillars grid + verdict light**

Insert after the hero `</section>` (before the closing `{/* parts */}` comment):

```tsx
<section className="mx-auto max-w-2xl px-5 py-10">
  <p className="text-xs font-semibold uppercase tracking-widest text-muted">Who does what — and why</p>
  <div className="relative mt-4 pl-8">
    <span className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-[color-mix(in_srgb,var(--accent)_60%,transparent)]" aria-hidden="true" />
    {s.whoWhatWhy.map((step, i) => (
      <div key={i} className="relative pb-5">
        <span className="absolute -left-8 top-0.5 h-3 w-3 rounded-full border-2 border-[var(--accent)] bg-background" aria-hidden="true" />
        <div className="font-semibold">
          <span className="text-[var(--accent)]">{step.you ? "You" : "TrustScope"}</span>
          {" — "}{step.role}
        </div>
        <p className="mt-1 text-sm text-muted">{step.text}</p>
      </div>
    ))}
  </div>

  <p className="mt-10 text-xs font-semibold uppercase tracking-widest text-muted">How TrustScope helps</p>
  <p className="mt-2 max-w-[52ch] text-sm text-muted">{s.helpsSub}</p>
  <div className="mt-4 grid gap-3 sm:grid-cols-2">
    {PILLARS_META.map((meta, i) => (
      <div key={meta.id} className="rounded-xl border border-border bg-surface p-4">
        <span className="rounded border px-1.5 py-0.5 font-mono text-[10.5px]"
          style={{ color: meta.hue, borderColor: `color-mix(in srgb, ${meta.hue} 40%, transparent)`, background: `color-mix(in srgb, ${meta.hue} 10%, transparent)` }}>
          Pillar {meta.id}
        </span>
        <h4 className="mt-2.5 text-sm font-semibold">{meta.title}</h4>
        <div className="text-xs" style={{ color: meta.hue }}>{s.pillars[i].q}</div>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">{s.pillars[i].blurb}</p>
      </div>
    ))}
  </div>
  <div className="mt-3.5 rounded-xl border border-dashed border-border bg-surface-2 p-4">
    <p className="text-[13.5px] font-semibold text-foreground">{s.nsaHeading}</p>
    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-semibold">
      <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 py-1.5 text-emerald-400">Adopt</span>
      <span className="rounded-full border border-amber-400/40 bg-amber-400/10 py-1.5 text-amber-400">Proceed</span>
      <span className="rounded-full border border-rose-400/40 bg-rose-400/10 py-1.5 text-rose-400">Avoid</span>
    </div>
    {s.verdictCaption && <p className="mt-2 text-[11.5px] italic text-muted">{s.verdictCaption}</p>}
  </div>

  <p className="mt-10 text-xs font-semibold uppercase tracking-widest text-muted">Frequently asked</p>
  <div className="mt-4">
    <FaqAccordion items={s.faqs} accent="var(--accent)" />
  </div>
</section>
```

- [ ] **Step 5: Remove dead persona fields**

In `config/personas.ts`, delete `pains`, `perPillar`, `walkthrough` from both spokes and from the `Persona.spoke` type (Task 4 is the last consumer). Delete the old `ctaLabel`/`ctaHref` only if unused elsewhere — check `components/PersonaCard.tsx` first (it is used by the Overview page removed in Task 5; if `PersonaCard` is deleted in Task 5, these become removable — leave them until then).

- [ ] **Step 6: Run tests + gates**

Run: `npx playwright test e2e/persona-template.spec.ts e2e/repo-selection.spec.ts && npm run typecheck && npm run lint`
Expected: PASS (persona template + the existing combobox e2e still green).

- [ ] **Step 7: Commit**

```bash
git add components/PersonaSpoke.tsx config/personas.ts e2e/persona-template.spec.ts
git commit -m "feat(for): shared persona template — hero+picker, flow, pillars, verdict, FAQ"
```

---

### Task 5: Remove the `/for` Overview page

**Files:**
- Delete: `app/for/page.tsx`
- Delete: `components/PersonaCard.tsx` (only consumer was the Overview page — verify with grep)
- Modify: `config/nav.ts` (drop the `Overview` child)
- Modify: `app/sitemap.ts` (drop the `/for` entry)
- Modify: `config/personas.ts` (remove `ctaLabel`/`ctaHref` if `PersonaCard` deletion frees them)
- Create: `e2e/for-overview-removed.spec.ts`

**Interfaces:**
- Consumes: `NAV_ITEMS` shape from `config/nav.ts`.

- [ ] **Step 1: Confirm `PersonaCard` has no other consumers**

Run: `grep -rn "PersonaCard" app components | grep -v "components/PersonaCard.tsx"`
Expected: only `app/for/page.tsx` (being deleted). If anything else appears, keep `PersonaCard` and skip its deletion.

- [ ] **Step 2: Write the failing e2e test**

```ts
// e2e/for-overview-removed.spec.ts
import { test, expect } from "@playwright/test";

test("/for Overview route is gone (404)", async ({ page }) => {
  const res = await page.goto("/for");
  expect(res?.status()).toBe(404);
});

test('header "For whom" dropdown has exactly two children', async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /For whom/ }).click();
  await expect(page.getByRole("link", { name: /Adopters/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Maintainers/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Overview/ })).toHaveCount(0);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx playwright test e2e/for-overview-removed.spec.ts`
Expected: FAIL — `/for` still 200; Overview link present.

- [ ] **Step 4: Delete the route + card**

```bash
git rm app/for/page.tsx
git rm components/PersonaCard.tsx   # only if Step 1 confirmed no other consumers
```

- [ ] **Step 5: Drop the Overview nav child**

In `config/nav.ts`, remove the `{ label: "Overview", href: "/for", … }` line from the "For whom" children, leaving Adopters + Maintainers.

- [ ] **Step 6: Drop `/for` from the sitemap**

In `app/sitemap.ts`, remove the `/for` URL entry (keep `/for/adopters` and `/for/maintainers`).

- [ ] **Step 7: Remove freed persona fields**

If `PersonaCard` was deleted, remove `ctaLabel` + `ctaHref` from both spokes and the `Persona` type (grep to confirm no remaining consumers first).

- [ ] **Step 8: Run tests + gates**

Run: `npx playwright test e2e/for-overview-removed.spec.ts && npm run typecheck && npm run lint && npm run build`
Expected: PASS; build clean (no dangling import of the deleted route/card).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(for): remove Overview page, nav child, sitemap entry"
```

---

### Task 6: Header — Bodo mascot + Feedback link

**Files:**
- Modify: `components/SiteHeader.tsx` (Bodo next to the wordmark)
- Modify: `config/nav.ts` (add Feedback item)
- Create: `e2e/header.spec.ts`

**Interfaces:**
- Consumes: `public/bodo.svg` (existing asset), `NAV_ITEMS`.

- [ ] **Step 1: Write the failing e2e test**

```ts
// e2e/header.spec.ts
import { test, expect } from "@playwright/test";

test("header shows Bodo next to the wordmark", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("banner").getByAltText(/Bodo/i)).toBeVisible();
});

test("header nav links to Feedback", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("banner").getByRole("link", { name: /Feedback/ })).toHaveAttribute("href", "/feedback");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test e2e/header.spec.ts`
Expected: FAIL — no Bodo image, no Feedback link.

- [ ] **Step 3: Add Bodo to the header**

In `components/SiteHeader.tsx`, add Bodo just left of / beside the wordmark inside the logo `Link` (use `next/image` with a fixed small size; the exact dimensions are a follow-up but keep it ~28px tall so it sits inline):

```tsx
import Image from "next/image";
// inside the logo <Link>, before the ShieldIcon span:
<Image src="/bodo.svg" alt="Bodo, the TrustScope mascot" width={28} height={28} priority />
```

- [ ] **Step 4: Add the Feedback nav item**

In `config/nav.ts`, add to `NAV_ITEMS` (before the external GitHub item):

```ts
{ label: "Feedback", href: "/feedback" },
```

- [ ] **Step 5: Run tests + gates**

Run: `npx playwright test e2e/header.spec.ts && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/SiteHeader.tsx config/nav.ts e2e/header.spec.ts
git commit -m "feat(header): Bodo mascot beside wordmark + Feedback nav link"
```

---

### Task 7: Full-suite green + PR

- [ ] **Step 1: Run the whole gate locally**

Run: `npm run lint && npm run typecheck && npm run test && npm run test:e2e && npm run build`
Expected: all green.

- [ ] **Step 2: Push + open PR**

```bash
git push -u origin linus/2026-07-06-for-redesign-faq-unify
gh pr create --fill --title "feat(for): shared persona template + FAQ unification + header polish"
```

- [ ] **Step 3: Verify CI + wait for CodeRabbit**

Run: `gh pr checks --watch`
Expected: all checks SUCCESS. Address any CodeRabbit findings before requesting Founder visual review (merge = prod deploy → Founder go required).

## Self-Review

- **Spec coverage:** shared template (T4) · Overview removal + nav + sitemap + breadcrumb (T5, T4-breadcrumb) · shared FaqAccordion across /faq + persona (T3, T4) · FAQ dedup split + guard (T2) · pillar single-source (T1) · Bodo header + Feedback link (T6) · persona colors (T2 config + T4 render) · SEO FAQPage per persona (T4). Feedback backend / Bodo landing / /about / report A/B correctly left out of scope. ✅ All spec sections map to a task.
- **Placeholder scan:** no TBD/TODO; every code step shows code; the only "follow-up" note (Bodo exact size) is an explicit out-of-scope item, not a hidden gap. ✅
- **Type consistency:** `FaqItem` (config/faq.ts) used in T2/T3/T4; `PillarMeta`/`PILLARS_META` (T1) consumed in T4; `FaqAccordion({items, accent})` signature (T3) matches call sites in T3 (/faq) and T4 (persona, `accent="var(--accent)"`); `Persona.spoke` field names (`heroTitle`, `whoWhatWhy`, `helpsSub`, `nsaHeading`, `verdictCaption`, `pillars`, `faqs`, `accentHex`, `accentInk`, `submitLabel`, `placeholder`, `crossLinkLead`) defined in T2, consumed in T4 — consistent. ✅
