# TrustScope Global Chrome (SiteHeader + SiteFooter + Login placeholder) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the inline header/footer in `app/layout.tsx` into reusable `SiteHeader` + `SiteFooter` components with a data-driven nav, add the "Made in Germany / Neckarshore" footer credibility line, and add a Login "Coming soon" placeholder button.

**Architecture:** `app/layout.tsx` currently defines `Header()` + `Footer()` inline. We move them to `components/SiteHeader.tsx` (server) and `components/SiteFooter.tsx` (server), drive the header links from a typed `config/nav.ts` array (so later plans append items without touching the component), and add a small client-only `components/LoginButton.tsx` for the "Coming soon" interaction. No page routing changes — this is the chrome every page sits in.

**Tech Stack:** Next.js (App Router, repo-pinned breaking version), React, Tailwind CSS v4, TypeScript (strict), Playwright e2e, Vitest unit.

**Spec:** `docs/superpowers/specs/2026-07-04-trustscope-v2-audience-ia-design.md` (§5 Navigation, §8 Component boundaries). This plan is **Plan 1 of 3**: Plan 2 = persona surface (`/for` + spokes), Plan 3 = supporting pages + SEO/GEO. The full "For whom" dropdown, the `Explore`/`FAQ` nav items, the mobile hamburger/drawer, and the `/about`→`/how-it-works` rename land in Plans 2–3 **as their target pages ship**, so the nav never links to a non-existent route.

## Global Constraints

- **Read the Next.js docs first:** this repo runs a pinned, breaking Next.js. Before writing any component, read the relevant guide under `node_modules/next/dist/docs/` (per `AGENTS.md`). Server components are the default; add `"use client"` only where interactivity is required.
- **No new runtime dependency** (V2 constraint). `dependencies` stays `next, next-auth, react, react-dom`.
- **Gates must stay green:** `npm run typecheck` (tsc --noEmit), `npm run lint` (eslint, zero warnings), `npm run build`, `npm test` (Vitest), `npm run test:e2e` (Playwright).
- **Design tokens** (Tailwind v4, `app/globals.css`): `brand` `#2dd4bf`, plus `surface`, `border`, `muted`, `foreground`, `background`. Use token classes (`text-muted`, `border-border`, `bg-surface/40`, `text-brand`), never raw hex.
- **Copy source:** `PRODUCT_NAME`, `PRODUCT_ORG` from `config/product.ts`. English copy.
- **Do not break `e2e/legal.spec.ts`** — it asserts the footer `Impressum` + `Datenschutz` links on `/`, `/about`, `/impressum`, `/datenschutz`. Keep those links.

---

## File structure

| File | Responsibility |
|------|----------------|
| `config/nav.ts` (create) | Typed `NAV_ITEMS` array — the single place later plans append nav entries. |
| `components/SiteHeader.tsx` (create, server) | Brand link + primary nav (from `NAV_ITEMS`) + `<LoginButton/>`. |
| `components/SiteFooter.tsx` (create, server) | OpenSSF blurb + Neckarshore credibility line + legal links. |
| `components/LoginButton.tsx` (create, client) | "Log in" button that reveals "Coming soon"; never navigates. |
| `app/layout.tsx` (modify) | Replace inline `Header`/`Footer` with `<SiteHeader/>` + `<SiteFooter/>`. |
| `e2e/site-chrome.spec.ts` (create) | Playwright: header nav renders, footer credibility line, Login coming-soon. |

---

### Task 1: Extract SiteHeader + SiteFooter into components (behavior-preserving refactor)

**Files:**
- Create: `config/nav.ts`
- Create: `components/SiteHeader.tsx`
- Create: `components/SiteFooter.tsx`
- Modify: `app/layout.tsx` (remove inline `Header`, `Footer`, `ShieldIcon`; import the components)
- Test: `e2e/site-chrome.spec.ts` (characterization — locks current behavior before Tasks 2–3 change it)

**Interfaces:**
- Produces: `NAV_ITEMS: readonly NavItem[]` from `@/config/nav`; `SiteHeader()` and `SiteFooter()` React components (no props).

- [ ] **Step 1: Write the characterization test**

Create `e2e/site-chrome.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test.describe("Global chrome renders", () => {
  test("header shows brand + primary nav on /", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header");
    await expect(header.getByRole("link", { name: /TrustScope/i })).toBeVisible();
    await expect(header.getByRole("link", { name: /How it works/i })).toBeVisible();
    await expect(header.getByRole("link", { name: /GitHub/i })).toBeVisible();
  });

  test("footer keeps OpenSSF blurb + legal links on /", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: /OpenSSF Scorecard/i })).toBeVisible();
    await expect(footer.getByRole("link", { name: /Impressum/i })).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the test against the current inline chrome — expect PASS**

Run: `npm run test:e2e -- e2e/site-chrome.spec.ts`
Expected: PASS (the inline header/footer already render these). This baseline must stay green through the extraction.

- [ ] **Step 3: Create `config/nav.ts`**

```ts
export type NavItem = {
  readonly label: string;
  readonly href: string;
  readonly external?: boolean;
};

/**
 * Primary header navigation. Later plans append items as their target pages
 * ship (For-whom dropdown + /faq + /explore in Plan 2/3), so the nav never
 * links to a route that does not exist yet.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: "How it works", href: "/about" }, // Plan 3 renames href -> /how-it-works
  { label: "GitHub ↗", href: "https://github.com/neckarshore-mmps/trustscope", external: true },
];
```

- [ ] **Step 4: Create `components/SiteHeader.tsx`** (copy the brand block + `ShieldIcon` verbatim from `app/layout.tsx`; drive the nav from `NAV_ITEMS`)

```tsx
import Link from "next/link";
import { PRODUCT_NAME } from "@/config/product";
import { NAV_ITEMS } from "@/config/nav";

export function SiteHeader() {
  return (
    <header className="border-b border-border/70 bg-surface/40 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand/15 text-brand ring-1 ring-brand/30">
            <ShieldIcon />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">{PRODUCT_NAME}</span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-5">
          {NAV_ITEMS.map((item) =>
            item.external ? (
              <a key={item.href} href={item.href} target="_blank" rel="noreferrer"
                 className="text-sm text-muted transition-colors hover:text-foreground">
                {item.label}
              </a>
            ) : (
              <Link key={item.href} href={item.href}
                    className="text-sm text-muted transition-colors hover:text-foreground">
                {item.label}
              </Link>
            ),
          )}
        </nav>
      </div>
    </header>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
```

- [ ] **Step 5: Create `components/SiteFooter.tsx`** (move the inline footer verbatim — credibility line is added in Task 2)

```tsx
import Link from "next/link";
import { PRODUCT_NAME, PRODUCT_ORG } from "@/config/product";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/70">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl">
          {PRODUCT_NAME} builds on the{" "}
          <a className="text-foreground/80 underline decoration-border underline-offset-4 hover:text-brand"
             href="https://securityscorecards.dev" target="_blank" rel="noreferrer">
            OpenSSF Scorecard
          </a>. A reputation surface by {PRODUCT_ORG}. No single aggregate score — by design.
        </p>
        <nav aria-label="Legal" className="flex shrink-0 items-center gap-4">
          <Link href="/impressum" className="transition-colors hover:text-foreground">Impressum</Link>
          <Link href="/datenschutz" className="transition-colors hover:text-foreground">Datenschutz</Link>
        </nav>
      </div>
    </footer>
  );
}
```

- [ ] **Step 6: Modify `app/layout.tsx`** — delete the inline `Header`, `Footer`, `ShieldIcon` functions; import the two components; keep the body shell.

```tsx
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
// ...existing metadata + font setup unchanged...

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Run all gates — expect GREEN**

Run: `npm run typecheck && npm run lint && npm run test:e2e -- e2e/site-chrome.spec.ts e2e/legal.spec.ts`
Expected: typecheck clean, lint zero warnings, both e2e specs PASS (behavior unchanged).

- [ ] **Step 8: Commit**

```bash
git add config/nav.ts components/SiteHeader.tsx components/SiteFooter.tsx app/layout.tsx e2e/site-chrome.spec.ts
git commit -m "refactor(chrome): extract SiteHeader/SiteFooter + data-driven nav"
```

---

### Task 2: Footer Neckarshore credibility line

**Files:**
- Modify: `components/SiteFooter.tsx`
- Test: `e2e/site-chrome.spec.ts` (append a describe block)

**Interfaces:**
- Consumes: `SiteFooter()` from Task 1. No new exports.

- [ ] **Step 1: Write the failing test** (append to `e2e/site-chrome.spec.ts`)

```ts
test.describe("Footer credibility line", () => {
  for (const path of ["/", "/about"]) {
    test(`footer shows Neckarshore + Made-in-Germany + link on ${path}`, async ({ page }) => {
      await page.goto(path);
      const footer = page.locator("footer");
      await expect(footer.getByText(/Made in Germany/i)).toBeVisible();
      await expect(footer.getByRole("link", { name: /neckarshore\.ai/i })).toBeVisible();
    });
  }
});
```

- [ ] **Step 2: Run it — expect FAIL**

Run: `npm run test:e2e -- e2e/site-chrome.spec.ts -g "credibility"`
Expected: FAIL — no "Made in Germany" text / `neckarshore.ai` link yet.

- [ ] **Step 3: Add the credibility line to `components/SiteFooter.tsx`** — replace the single `<p>` with a two-line block:

```tsx
<div className="max-w-2xl space-y-1">
  <p>
    {PRODUCT_NAME} builds on the{" "}
    <a className="text-foreground/80 underline decoration-border underline-offset-4 hover:text-brand"
       href="https://securityscorecards.dev" target="_blank" rel="noreferrer">
      OpenSSF Scorecard
    </a>. No single aggregate score — by design.
  </p>
  <p>
    A {PRODUCT_ORG} product · Made in Germany ·{" "}
    <a className="text-foreground/80 underline decoration-border underline-offset-4 hover:text-brand"
       href="https://neckarshore.ai" target="_blank" rel="noreferrer">
      neckarshore.ai
    </a>
  </p>
</div>
```

- [ ] **Step 4: Run the test — expect PASS**

Run: `npm run test:e2e -- e2e/site-chrome.spec.ts -g "credibility"`
Expected: PASS. Then `npm run test:e2e -- e2e/legal.spec.ts` — still PASS (legal links untouched).

- [ ] **Step 5: Commit**

```bash
git add components/SiteFooter.tsx e2e/site-chrome.spec.ts
git commit -m "feat(chrome): add Neckarshore Made-in-Germany footer credibility line"
```

---

### Task 3: Login "Coming soon" placeholder button

**Files:**
- Create: `components/LoginButton.tsx` (client component)
- Modify: `components/SiteHeader.tsx` (render `<LoginButton/>` after the nav items)
- Test: `e2e/site-chrome.spec.ts` (append a describe block)

**Interfaces:**
- Produces: `LoginButton()` client component (no props), rendered inside `SiteHeader`'s `<nav>`.

- [ ] **Step 1: Write the failing test** (append to `e2e/site-chrome.spec.ts`)

```ts
test.describe("Login coming-soon", () => {
  test("Login button reveals 'Coming soon' and never navigates", async ({ page }) => {
    await page.goto("/");
    const login = page.getByRole("button", { name: /log in/i });
    await expect(login).toBeVisible();
    await login.click();
    await expect(page.getByText(/coming soon/i)).toBeVisible();
    await expect(page).toHaveURL(/\/$/); // it is a button, not a link — no navigation
  });
});
```

- [ ] **Step 2: Run it — expect FAIL**

Run: `npm run test:e2e -- e2e/site-chrome.spec.ts -g "coming-soon"`
Expected: FAIL — no "Log in" button exists yet.

- [ ] **Step 3: Create `components/LoginButton.tsx`** (client — reveals the hint on click/focus, closes on blur; accessible via `aria-describedby`)

```tsx
"use client";

import { useState } from "react";

/**
 * Placeholder for TS6 Accounts/Login (a V2 feature not yet built). It is a
 * <button>, not a link — it never navigates; it reveals a "Coming soon" hint
 * on click or keyboard focus and hides it on blur.
 */
export function LoginButton() {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative">
      <button
        type="button"
        aria-describedby={open ? "login-soon" : undefined}
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="rounded-lg border border-border px-3.5 py-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        Log in
      </button>
      {open && (
        <span id="login-soon" role="status"
              className="absolute right-0 top-9 z-10 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background shadow">
          Coming soon
        </span>
      )}
    </span>
  );
}
```

- [ ] **Step 4: Add `<LoginButton/>` to `components/SiteHeader.tsx`** — import it and render it as the last child of the `<nav>`:

```tsx
import { LoginButton } from "@/components/LoginButton";
// ...inside <nav aria-label="Primary">, after the NAV_ITEMS.map(...):
          <LoginButton />
```

- [ ] **Step 5: Run the test — expect PASS**

Run: `npm run test:e2e -- e2e/site-chrome.spec.ts -g "coming-soon"`
Expected: PASS (button visible, "Coming soon" appears on click, URL unchanged).

- [ ] **Step 6: Run every gate**

Run: `npm run typecheck && npm run lint && npm run build && npm run test:e2e -- e2e/site-chrome.spec.ts e2e/legal.spec.ts && npm test`
Expected: all GREEN.

- [ ] **Step 7: Commit**

```bash
git add components/LoginButton.tsx components/SiteHeader.tsx e2e/site-chrome.spec.ts
git commit -m "feat(chrome): add Login 'Coming soon' placeholder button (TS6)"
```

---

## Self-Review

**Spec coverage (this plan = §5 nav shell + §8 boundaries, chrome slice only):**
- SiteHeader / SiteFooter as isolated components (§8 #1, #2) → Tasks 1.
- Footer Neckarshore credibility line (§5 footer) → Task 2.
- Login "Coming soon" placeholder (§5 right slot, TS6) → Task 3.
- **Deferred to Plan 2/3 (explicitly, to avoid links to non-existent routes):** "For whom" dropdown + its A11y, `Explore`/`FAQ`/`About` nav items, mobile hamburger/drawer, `/about`→`/how-it-works` rename. `PersonaSection`/`Faq`/SEO-schema (§4, §6) are Plans 2–3.

**Placeholder scan:** none — every step has concrete code or an exact command.

**Type consistency:** `NavItem`/`NAV_ITEMS` (config/nav.ts) consumed by `SiteHeader`; `SiteHeader`/`SiteFooter`/`LoginButton` are no-prop components consumed by `app/layout.tsx`. Consistent across tasks.

## Execution Handoff

Two execution options once the plan is approved:
1. **Subagent-Driven (recommended)** — a fresh subagent per task, review between tasks.
2. **Inline Execution** — execute in-session with checkpoints.

Execution is **gated on Founder approval + MASCHIN's spec gegen-check** (this plan ships in PR #40 alongside the spec).
