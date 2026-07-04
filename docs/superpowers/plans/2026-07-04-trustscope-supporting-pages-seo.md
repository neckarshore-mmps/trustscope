# TrustScope Supporting Pages + SEO/GEO + Nav Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the supporting public pages (`/how-it-works` rename, `/about` company page, `/faq`, `/feedback` reserve), complete the navigation (the "For whom" dropdown, FAQ/About items, mobile drawer), and wire the SEO/GEO layer (per-page metadata already exists; add `FAQPage` + `Organization` + `BreadcrumbList` JSON-LD, `sitemap.ts`, `llms.txt`).

**Architecture:** The current `/about` ("How it works") content moves to `/how-it-works`; `/about` is repurposed as the company page. A tiny `JsonLd` helper injects structured data. Navigation grows past what fits as flat links, so a client `NavMenu` renders the desktop dropdown + mobile hamburger/drawer, driven by an extended `NAV_ITEMS`. `sitemap.ts` + a static `public/llms.txt` complete discoverability.

**Tech Stack:** Next.js App Router (repo-pinned), React, Tailwind v4, TypeScript, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-07-04-trustscope-v2-audience-ia-design.md` §4c–§4e, §5, §6. **Plan 3 of 3** — depends on Plan 1 (chrome: `config/nav.ts`, `SiteHeader`) and Plan 2 (spokes exist, so the dropdown can link to them; `PersonaSpoke` exists for the breadcrumb).

## Global Constraints

- **Read the Next.js docs first** (`node_modules/next/dist/docs/`). Server components by default; `"use client"` only for `NavMenu`.
- **No new runtime dependency.** Gates green: `npm run typecheck`, `npm run lint` (0 warnings), `npm run build`, `npm test`, `npm run test:e2e`.
- **Tokens + page pattern** as in Plans 1–2 (`hero-glow`, `max-w-3xl/5xl`, `text-brand`, `border-border`, `text-muted`).
- **Do not break `e2e/legal.spec.ts`** — it asserts footer legal links on `/about` (among others). `/about` must stay a real 200 page throughout (we repurpose its content, never delete the route).
- **No `Date.now()` in `sitemap.ts`** — deterministic build; omit `lastModified` (matches the estate's stable-date practice).
- **`/explore` is NOT added here** — that route + nav item belong to the separate Dashboard spec. Adding it now would link to a non-existent page.

## File structure

| File | Responsibility |
|------|----------------|
| `app/how-it-works/page.tsx` (create) | The current `/about` product-mechanics content, moved. |
| `app/about/page.tsx` (rewrite) | Company page — who's behind it, Made-in-Germany, neckarshore.ai. |
| `components/JsonLd.tsx` (create) | Inject a JSON-LD `<script>`. |
| `config/faq.ts` (create) | Typed FAQ Q&A data. |
| `app/faq/page.tsx` (create) | FAQ page + canonical `FAQPage` schema. |
| `app/feedback/page.tsx` (create) | Reserved page (ITSM-gated). |
| `config/nav.ts` (modify) | Extend `NavItem` with `children`; expand `NAV_ITEMS`. |
| `components/NavMenu.tsx` (create, client) | Desktop dropdown + mobile hamburger/drawer. |
| `components/SiteHeader.tsx` (modify) | Render `<NavMenu/>` instead of the inline flat nav. |
| `app/sitemap.ts` (create) | XML sitemap of the public routes. |
| `public/llms.txt` (create) | AI-crawler page index. |
| `components/PersonaSpoke.tsx` (modify) | Add `BreadcrumbList` JSON-LD. |
| `e2e/supporting-pages.spec.ts` (create) | Playwright for the new pages + nav. |

---

### Task 1: `/how-it-works` (move the product-mechanics content)

**Files:**
- Create: `app/how-it-works/page.tsx`
- Test: `e2e/supporting-pages.spec.ts`

- [ ] **Step 1: Write the failing e2e** — `e2e/supporting-pages.spec.ts`

```ts
import { test, expect } from "@playwright/test";

test.describe("/how-it-works", () => {
  test("responds 200 and renders the four-pillars content", async ({ page }) => {
    const res = await page.goto("/how-it-works");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: /The four pillars/i })).toBeVisible();
  });
});
```

- [ ] **Step 2: Run it — expect FAIL** (`/how-it-works` is 404)

Run: `npm run test:e2e -- e2e/supporting-pages.spec.ts -g "how-it-works"` → FAIL.

- [ ] **Step 3: Create `app/how-it-works/page.tsx`** — copy `app/about/page.tsx` **verbatim** into the new path (it already carries `metadata.title: "How it works"` and the four-pillars/how-it-works/why-no-score sections). Do not modify the content; only the file location changes. (`/about` stays unchanged until Task 2.)

- [ ] **Step 4: Run it — expect PASS**

Run: `npm run test:e2e -- e2e/supporting-pages.spec.ts -g "how-it-works"` → PASS.

- [ ] **Step 5: Commit**

```bash
git add app/how-it-works/page.tsx e2e/supporting-pages.spec.ts
git commit -m "feat(pages): add /how-it-works (moved product-mechanics content)"
```

---

### Task 2: Repurpose `/about` as the company page + `Organization` schema + nav href

**Files:**
- Create: `components/JsonLd.tsx`
- Rewrite: `app/about/page.tsx`
- Modify: `config/nav.ts` (the "How it works" href → `/how-it-works`)
- Test: `e2e/supporting-pages.spec.ts` (append)

**Interfaces:**
- Produces: `JsonLd({ data }: { data: object })`.

- [ ] **Step 1: Write the failing e2e** (append)

```ts
test.describe("/about company page", () => {
  test("renders the company story + neckarshore link + Made in Germany", async ({ page }) => {
    const res = await page.goto("/about");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: /Neckarshore/i })).toBeVisible();
    await expect(page.getByText(/Made in Germany/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /neckarshore\.ai/i }).first()).toBeVisible();
  });
});
```

- [ ] **Step 2: Run it — expect FAIL** (`/about` still shows "How it works") → FAIL.

- [ ] **Step 3: Create `components/JsonLd.tsx`**

```tsx
export function JsonLd({ data }: { data: object }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
```

- [ ] **Step 4: Rewrite `app/about/page.tsx`** as the company page

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { PRODUCT_NAME, PRODUCT_ORG, PRODUCT_SUBDOMAIN } from "@/config/product";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "About",
  description: `${PRODUCT_NAME} is a reputation surface by ${PRODUCT_ORG} — made in Germany, GDPR-clean, open source. Who is behind it and why.`,
};

const ORG_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: PRODUCT_ORG,
  url: "https://neckarshore.ai",
  subOrganization: { "@type": "SoftwareApplication", name: PRODUCT_NAME, url: `https://${PRODUCT_SUBDOMAIN}` },
} as const;

export default function AboutPage() {
  return (
    <div>
      <JsonLd data={ORG_SCHEMA} />
      <section className="hero-glow">
        <div className="mx-auto max-w-3xl px-5 pb-6 pt-20 text-center sm:pt-28">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Built by <span className="text-brand">{PRODUCT_ORG}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
            {PRODUCT_NAME} is a reputation surface — made in Germany, GDPR-clean, and open source.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-12 space-y-4 text-[15px] leading-relaxed text-muted">
        <p><span className="font-medium text-foreground/90">Who's behind it.</span> {PRODUCT_NAME} is
          built by {PRODUCT_ORG}, a German software studio. It runs on its own standards — we assess our
          own repositories with it.</p>
        <p><span className="font-medium text-foreground/90">Made in Germany.</span> Self-hosted fonts, no
          third-party trackers, and a privacy posture that matches EU expectations by default.</p>
        <p><span className="font-medium text-foreground/90">Open.</span> {PRODUCT_NAME} builds on the
          public OpenSSF Scorecard and is deterministic — the same repository always produces the same report.</p>
        <div className="pt-4">
          <a className="text-foreground/80 underline decoration-border underline-offset-4 hover:text-brand"
             href="https://neckarshore.ai" target="_blank" rel="noreferrer">
            neckarshore.ai →
          </a>
        </div>
        <div className="pt-6">
          <Link href="/" className="inline-flex items-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90">
            Try it on a repo →
          </Link>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 5: Update `config/nav.ts`** — change the "How it works" item href from `/about` to `/how-it-works`:

```ts
  { label: "How it works", href: "/how-it-works" },
```

- [ ] **Step 6: Run the gates — expect PASS**

Run: `npm run test:e2e -- e2e/supporting-pages.spec.ts -g "company" e2e/legal.spec.ts`
Expected: PASS — `/about` is now the company page (200, "Made in Germany", neckarshore link); legal.spec still green (`/about` still exists + footer links intact).

- [ ] **Step 7: Commit**

```bash
git add components/JsonLd.tsx app/about/page.tsx config/nav.ts e2e/supporting-pages.spec.ts
git commit -m "feat(pages): repurpose /about as company page + Organization schema; nav -> /how-it-works"
```

---

### Task 3: `/faq` + canonical `FAQPage` schema

**Files:**
- Create: `config/faq.ts`
- Create: `app/faq/page.tsx`
- Test: `e2e/supporting-pages.spec.ts` (append)

**Interfaces:**
- Consumes: `JsonLd` (Task 2).
- Produces: `FAQ_ITEMS: readonly { q: string; a: string }[]` from `@/config/faq`.

- [ ] **Step 1: Write the failing e2e** (append)

```ts
test.describe("/faq", () => {
  test("responds 200, renders questions + FAQPage JSON-LD", async ({ page }) => {
    const res = await page.goto("/faq");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: /account to read a report/i })).toBeVisible();
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(ld).toContain("FAQPage");
  });
});
```

- [ ] **Step 2: Run it — expect FAIL** → FAIL (`/faq` 404).

- [ ] **Step 3: Create `config/faq.ts`**

```ts
export type FaqItem = { readonly q: string; readonly a: string };

export const FAQ_ITEMS: readonly FaqItem[] = [
  { q: "Do I need an account to read a report?", a: "No. Reading any report is anonymous and needs no sign-in. Accounts (to save history and email reports) are coming soon." },
  { q: "Is TrustScope for open-source maintainers?", a: "Yes. Maintainers and adopters are equal audiences — a maintainer runs their own repo to see the trust gaps adopters look for, and gets constructive fixes to close them." },
  { q: "Why is there no single score?", a: "Each pillar answers a different question. Collapsing security, governance and community into one number hides the exact trade-off you are trying to weigh — so TrustScope keeps them separate." },
  { q: "Where does the data come from?", a: "The full OpenSSF Scorecard plus public GitHub governance and lifecycle signals. The same repository always produces the same report — it is deterministic, with no LLM in the loop." },
  { q: "Does TrustScope store my data?", a: "Reading a report stores nothing about you. It is self-hosted, GDPR-clean, with no third-party trackers." },
];
```

- [ ] **Step 4: Create `app/faq/page.tsx`** (renders the list + the canonical `FAQPage` schema)

```tsx
import type { Metadata } from "next";
import { FAQ_ITEMS } from "@/config/faq";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about TrustScope — accounts, the no-single-score design, data sources, and privacy.",
};

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
} as const;

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <JsonLd data={FAQ_SCHEMA} />
      <h1 className="text-3xl font-semibold tracking-tight">Frequently asked questions</h1>
      <dl className="mt-8 space-y-8">
        {FAQ_ITEMS.map((f) => (
          <div key={f.q}>
            <dt><h2 className="text-lg font-semibold tracking-tight">{f.q}</h2></dt>
            <dd className="mt-2 text-[15px] leading-relaxed text-muted">{f.a}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
```

- [ ] **Step 5: Run it — expect PASS** → PASS.

- [ ] **Step 6: Commit**

```bash
git add config/faq.ts app/faq/page.tsx e2e/supporting-pages.spec.ts
git commit -m "feat(pages): /faq with canonical FAQPage JSON-LD"
```

---

### Task 4: `/feedback` reserved page (ITSM-gated)

**Files:**
- Create: `app/feedback/page.tsx`
- Test: `e2e/supporting-pages.spec.ts` (append)

- [ ] **Step 1: Write the failing e2e** (append)

```ts
test.describe("/feedback", () => {
  test("responds 200 and reserves the slug", async ({ page }) => {
    const res = await page.goto("/feedback");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: /Feedback/i })).toBeVisible();
  });
});
```

- [ ] **Step 2: Run it — expect FAIL** → FAIL.

- [ ] **Step 3: Create `app/feedback/page.tsx`** (reserved; mechanism deferred per the ITSM-hold — link out to GitHub issues as the interim, no bespoke form)

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feedback",
  description: "Ideas, bugs, or a thank-you for TrustScope.",
};

export default function FeedbackPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-20 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Feedback</h1>
      <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted">
        A proper feedback channel is on the way. For now, ideas and bugs are most welcome as GitHub issues.
      </p>
      <a href="https://github.com/neckarshore-mmps/trustscope/issues" target="_blank" rel="noreferrer"
         className="mt-8 inline-flex items-center rounded-lg border border-border bg-surface-2 px-5 py-2.5 text-sm font-medium transition-colors hover:border-brand/40">
        Open an issue on GitHub ↗
      </a>
    </div>
  );
}
```

- [ ] **Step 4: Run it — expect PASS** → PASS.

- [ ] **Step 5: Commit**

```bash
git add app/feedback/page.tsx e2e/supporting-pages.spec.ts
git commit -m "feat(pages): reserve /feedback (ITSM-gated, GitHub-issues interim)"
```

---

### Task 5: Navigation completion — "For whom" dropdown + mobile drawer

**Files:**
- Modify: `config/nav.ts` (extend `NavItem` with `children`; expand `NAV_ITEMS`)
- Create: `components/NavMenu.tsx` (client)
- Modify: `components/SiteHeader.tsx` (render `<NavMenu items={NAV_ITEMS} />` instead of the inline flat nav)
- Test: `e2e/supporting-pages.spec.ts` (append)

**Interfaces:**
- Consumes: `NAV_ITEMS`, `NavItem` (extended).
- Produces: `NavMenu({ items }: { items: readonly NavItem[] })`.

- [ ] **Step 1: Write the failing e2e** (append)

```ts
test.describe("navigation", () => {
  test("desktop: 'For whom' reveals Adopters + Maintainers", async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 800 });
    await page.goto("/");
    await page.getByRole("button", { name: /For whom/i }).click();
    await expect(page.getByRole("link", { name: /Adopters/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Maintainers/i })).toBeVisible();
  });

  test("mobile: hamburger opens a drawer with the nav links", async ({ page }) => {
    await page.setViewportSize({ width: 380, height: 800 });
    await page.goto("/");
    await page.getByRole("button", { name: /open menu/i }).click();
    await expect(page.getByRole("link", { name: /How it works/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /FAQ/i })).toBeVisible();
  });
});
```

- [ ] **Step 2: Run it — expect FAIL** → FAIL (no dropdown/hamburger yet).

- [ ] **Step 3: Extend `config/nav.ts`**

```ts
export type NavChild = { readonly label: string; readonly href: string; readonly hint?: string };

export type NavItem = {
  readonly label: string;
  readonly href?: string;
  readonly external?: boolean;
  readonly children?: readonly NavChild[];
};

export const NAV_ITEMS: readonly NavItem[] = [
  { label: "For whom", href: "/for", children: [
    { label: "Adopters", href: "/for/adopters", hint: "Vet a third-party project" },
    { label: "Maintainers", href: "/for/maintainers", hint: "Check your own project" },
  ]},
  { label: "How it works", href: "/how-it-works" },
  { label: "FAQ", href: "/faq" },
  { label: "About", href: "/about" },
  { label: "GitHub ↗", href: "https://github.com/neckarshore-mmps/trustscope", external: true },
];
```

- [ ] **Step 4: Create `components/NavMenu.tsx`** (client — accessible dropdown + mobile drawer)

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import type { NavItem } from "@/config/nav";

function DesktopItem({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);
  if (item.children) {
    return (
      <div className="relative" onMouseLeave={() => setOpen(false)}>
        <button type="button" aria-haspopup="menu" aria-expanded={open}
                onClick={() => setOpen((v) => !v)} onMouseEnter={() => setOpen(true)}
                className="text-sm text-muted transition-colors hover:text-foreground">
          {item.label} ▾
        </button>
        {open && (
          <div role="menu" className="absolute left-0 top-7 z-20 min-w-52 rounded-lg border border-border bg-surface p-1.5 shadow-lg">
            {item.children.map((c) => (
              <Link key={c.href} href={c.href} role="menuitem"
                    className="block rounded-md px-3 py-2 text-sm hover:bg-surface-2">
                <span className="font-medium">{c.label}</span>
                {c.hint && <span className="block text-xs text-muted">{c.hint}</span>}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }
  return item.external ? (
    <a href={item.href} target="_blank" rel="noreferrer" className="text-sm text-muted transition-colors hover:text-foreground">{item.label}</a>
  ) : (
    <Link href={item.href!} className="text-sm text-muted transition-colors hover:text-foreground">{item.label}</Link>
  );
}

export function NavMenu({ items }: { items: readonly NavItem[] }) {
  const [drawer, setDrawer] = useState(false);
  return (
    <>
      <nav aria-label="Primary" className="hidden items-center gap-5 sm:flex">
        {items.map((it) => <DesktopItem key={it.label} item={it} />)}
      </nav>
      <button type="button" aria-label={drawer ? "Close menu" : "Open menu"} aria-expanded={drawer}
              onClick={() => setDrawer((v) => !v)}
              className="sm:hidden rounded-md border border-border px-3 py-1.5 text-sm text-muted">
        {drawer ? "Close" : "Menu"}
      </button>
      {drawer && (
        <div className="absolute inset-x-0 top-full z-20 border-b border-border bg-surface p-4 sm:hidden">
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {items.flatMap((it) =>
              it.children
                ? [<span key={it.label} className="px-2 pt-2 text-xs uppercase tracking-wider text-muted">{it.label}</span>,
                   ...it.children.map((c) => (
                     <Link key={c.href} href={c.href} onClick={() => setDrawer(false)} className="rounded-md px-2 py-2 text-sm hover:bg-surface-2">{c.label}</Link>))]
                : [<Link key={it.label} href={it.href!} onClick={() => setDrawer(false)} className="rounded-md px-2 py-2 text-sm hover:bg-surface-2">{it.label}</Link>],
            )}
          </nav>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 5: Modify `components/SiteHeader.tsx`** — make the header row `relative` (so the mobile drawer anchors to it), replace the inline `<nav>` with `<NavMenu items={NAV_ITEMS} />`, keep `<LoginButton/>`:

```tsx
import { NavMenu } from "@/components/NavMenu";
// ...inside the header row div, add `relative` to its className; replace the inline nav with:
        <div className="flex items-center gap-4">
          <NavMenu items={NAV_ITEMS} />
          <LoginButton />
        </div>
```

- [ ] **Step 6: Run the nav e2e + regression — expect PASS**

Run: `npm run test:e2e -- e2e/supporting-pages.spec.ts -g "navigation" e2e/site-chrome.spec.ts`
Expected: PASS (dropdown reveals Adopters/Maintainers; mobile drawer shows the links; Plan-1 chrome tests still green).

- [ ] **Step 7: Commit**

```bash
git add config/nav.ts components/NavMenu.tsx components/SiteHeader.tsx e2e/supporting-pages.spec.ts
git commit -m "feat(nav): 'For whom' dropdown + mobile drawer (accessible)"
```

---

### Task 6: `sitemap.ts` + `llms.txt` + `BreadcrumbList` on spokes

**Files:**
- Create: `app/sitemap.ts`
- Create: `public/llms.txt`
- Modify: `components/PersonaSpoke.tsx` (add `BreadcrumbList` JSON-LD)
- Test: `e2e/supporting-pages.spec.ts` (append)

- [ ] **Step 1: Write the failing e2e** (append)

```ts
test.describe("SEO surfaces", () => {
  test("sitemap.xml lists /for", async ({ page }) => {
    const res = await page.goto("/sitemap.xml");
    expect(res?.status()).toBe(200);
    expect(await res!.text()).toContain("/for");
  });
  test("llms.txt is served", async ({ page }) => {
    const res = await page.goto("/llms.txt");
    expect(res?.status()).toBe(200);
    expect(await res!.text()).toMatch(/TrustScope/);
  });
  test("spoke carries BreadcrumbList JSON-LD", async ({ page }) => {
    await page.goto("/for/adopters");
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(scripts.join(" ")).toContain("BreadcrumbList");
  });
});
```

- [ ] **Step 2: Run it — expect FAIL** → FAIL.

- [ ] **Step 3: Create `app/sitemap.ts`** (deterministic, no `Date.now`)

```ts
import type { MetadataRoute } from "next";
import { PRODUCT_SUBDOMAIN } from "@/config/product";

const BASE = `https://${PRODUCT_SUBDOMAIN}`;
const ROUTES = [
  "", "/for", "/for/adopters", "/for/maintainers",
  "/how-it-works", "/about", "/faq", "/feedback", "/impressum", "/datenschutz",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((r) => ({
    url: `${BASE}${r}`,
    changeFrequency: "monthly",
    priority: r === "" ? 1 : 0.7,
  }));
}
```

- [ ] **Step 4: Create `public/llms.txt`**

```text
# TrustScope

> Paste a public GitHub repo and get a deterministic four-pillar trust report — security & supply chain, governance, community — with constructive, upstream-friendly fixes and no single score. A reputation surface by Neckarshore AI, made in Germany.

## Audience
- [Who is TrustScope for?](https://trustscope.neckarshore.ai/for): the two audiences — adopters and maintainers
- [For adopters](https://trustscope.neckarshore.ai/for/adopters): vet a third-party project before you depend on it
- [For maintainers](https://trustscope.neckarshore.ai/for/maintainers): see and close the trust gaps adopters look for

## Product
- [How it works](https://trustscope.neckarshore.ai/how-it-works): the four pillars and the deterministic method
- [FAQ](https://trustscope.neckarshore.ai/faq): accounts, no-single-score, data sources, privacy
- [About](https://trustscope.neckarshore.ai/about): Neckarshore AI, made in Germany
```

- [ ] **Step 5: Add `BreadcrumbList` to `components/PersonaSpoke.tsx`** — import `JsonLd`, build the crumb from the persona, render it at the top of the returned fragment:

```tsx
import { JsonLd } from "@/components/JsonLd";
// ...inside PersonaSpoke, before the hero <section>:
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Who is TrustScope for?", item: "https://trustscope.neckarshore.ai/for" },
          { "@type": "ListItem", position: 2, name: persona.spoke.title, item: `https://trustscope.neckarshore.ai${persona.spokeHref}` },
        ],
      }} />
```

- [ ] **Step 6: Run every gate — expect GREEN**

Run: `npm run typecheck && npm run lint && npm run build && npm test && npm run test:e2e`
Expected: all GREEN (full e2e suite: chrome + legal + persona + supporting + the existing report specs).

- [ ] **Step 7: Commit**

```bash
git add app/sitemap.ts public/llms.txt components/PersonaSpoke.tsx e2e/supporting-pages.spec.ts
git commit -m "feat(seo): sitemap.ts + llms.txt + BreadcrumbList on persona spokes"
```

---

## Self-Review

**Spec coverage:** §4d `/how-it-works` (Task 1) + `/about` company + `Organization` (Task 2). §4c `/faq` + canonical `FAQPage` (Task 3). §4e `/feedback` reserve (Task 4). §5 nav dropdown + mobile drawer (Task 5). §6 metadata (already per-page), `Organization`/`FAQPage`/`BreadcrumbList` schema, `sitemap.ts`, `llms.txt` (Tasks 2/3/6). **Deferred by design:** `/explore` + its nav item (Dashboard spec); the persona-weighting slider, buy-me-a-coffee, full gallery (V3).

**Placeholder scan:** none — real code + copy + exact commands. The one "copy verbatim" (Task 1 Step 3) references an existing on-disk file, not another task.

**Type consistency:** `NavItem`/`NavChild`/`NAV_ITEMS` extended in Task 5, consumed by `NavMenu`; `JsonLd` (Task 2) consumed by `/about`, `/faq`, `PersonaSpoke`; `FAQ_ITEMS` (Task 3) consumed by `/faq`; `PRODUCT_SUBDOMAIN` used in `/about` + `sitemap.ts`. Consistent.

## Execution Handoff

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between. 2. **Inline Execution** — in-session with checkpoints. Gated on Founder approval + MASCHIN spec gegen-check (ships in PR #40).
