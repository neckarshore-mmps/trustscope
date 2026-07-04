# TrustScope Persona Surface (/for hub + spokes) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/for` persona hub (Layout B — two co-equal cards, config-driven order) plus the two explainer spokes `/for/adopters` and `/for/maintainers`, from a single typed persona config (copy v1, Linus-authored, Gary-review pending).

**Architecture:** One data module `config/personas.ts` holds both personas + the display order (the swap seam). A `PersonaCard` renders the hub tile; a `PersonaSpoke` renders the deep explainer page. `/for` maps the ordered persona ids to `PersonaCard`s in a `sm:grid-cols-2` grid; each spoke page renders one `PersonaSpoke`. No new dependency; all server components.

**Tech Stack:** Next.js App Router (repo-pinned), React, Tailwind v4, TypeScript, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-07-04-trustscope-v2-audience-ia-design.md` §2 (personas), §4a/§4b (hub + spokes), §7 (swap). **Plan 2 of 3** — depends on Plan 1 (chrome) only for the global header/footer, not for routing. The nav "For whom" dropdown that links to these spokes is added in **Plan 3** (once the spokes exist).

## Global Constraints

- **Read the Next.js docs first** (`node_modules/next/dist/docs/`) — repo-pinned breaking version. Server components by default.
- **No new runtime dependency.** Gates green: `npm run typecheck`, `npm run lint` (0 warnings), `npm run build`, `npm test`, `npm run test:e2e`.
- **Tokens** (`app/globals.css`): `brand #2dd4bf`, `surface`, `border`, `muted`, `foreground`, `surface-2`. Follow the existing page pattern (`hero-glow` hero, `mx-auto max-w-3xl/5xl px-5 py-14` sections, `text-brand` H1 accent) seen in `app/about/page.tsx` and `app/page.tsx`.
- **Copy = English, v1 (Linus-authored, Gary-review pending).** Recognition lines verbatim from spec §2.
- **Layout B:** `/for` uses `grid gap-6 sm:grid-cols-2`; below `sm` (640px) it stacks (that IS Layout A). Order comes from `PERSONA_ORDER` — never hardcode which persona is first.

## File structure

| File | Responsibility |
|------|----------------|
| `config/personas.ts` (create) | `Persona` type, `PERSONAS` record, `PERSONA_ORDER` (swap seam). Single source of persona copy. |
| `components/PersonaSection.tsx` (create) | `PersonaCard` — the hub tile for one persona. |
| `components/PersonaSpoke.tsx` (create) | `PersonaSpoke` — the deep explainer page body for one persona + cross-link to the other. |
| `app/for/page.tsx` (create) | The hub — Layout B grid over `PERSONA_ORDER` + bracket + FAQ teaser + CTA band. |
| `app/for/adopters/page.tsx` (create) | `<PersonaSpoke persona={adopter} other={maintainer} />` + metadata. |
| `app/for/maintainers/page.tsx` (create) | `<PersonaSpoke persona={maintainer} other={adopter} />` + metadata. |
| `config/personas.test.ts` (create) | Vitest — both personas present + default order. |
| `e2e/persona-pages.spec.ts` (create) | Playwright — hub renders both cards in order + CTAs; spokes respond 200 + cross-link. |

---

### Task 1: Persona config + unit test

**Files:**
- Create: `config/personas.ts`
- Test: `config/personas.test.ts`

**Interfaces:**
- Produces: `Persona` type; `PERSONAS: Record<"adopter"|"maintainer", Persona>`; `PERSONA_ORDER: readonly ("adopter"|"maintainer")[]`.

- [ ] **Step 1: Write the failing unit test** — `config/personas.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { PERSONAS, PERSONA_ORDER } from "./personas";

describe("persona config", () => {
  it("defines both personas with the required fields", () => {
    for (const id of ["adopter", "maintainer"] as const) {
      const p = PERSONAS[id];
      expect(p.id).toBe(id);
      expect(p.recognition.length).toBeGreaterThan(0);
      expect(p.ctaLabel.length).toBeGreaterThan(0);
      expect(p.spokeHref).toBe(`/for/${id}s`);
      expect(p.spoke.title.length).toBeGreaterThan(0);
    }
  });

  it("defaults to adopter-first order (swap seam)", () => {
    expect(PERSONA_ORDER).toEqual(["adopter", "maintainer"]);
  });
});
```

- [ ] **Step 2: Run it — expect FAIL**

Run: `npm test -- personas`
Expected: FAIL — `./personas` does not exist.

- [ ] **Step 3: Create `config/personas.ts`** (copy v1 from spec §2)

```ts
export type PersonaId = "adopter" | "maintainer";

export type Persona = {
  readonly id: PersonaId;
  readonly tag: string;
  readonly recognition: string;
  readonly youIf: string;
  readonly ctaLabel: string;
  readonly ctaHref: string;   // repo input lives on the landing page
  readonly spokeHref: string;
  readonly accent: string;    // tailwind border-top accent
  readonly spoke: {
    readonly title: string;
    readonly jtbd: string;
    readonly pains: readonly string[];
    readonly perPillar: string;
    readonly walkthrough: string;
  };
};

export const PERSONAS: Record<PersonaId, Persona> = {
  adopter: {
    id: "adopter",
    tag: "Adopter",
    recognition: "You're about to build on someone else's code.",
    youIf: "You're evaluating a third-party library, framework or tool before taking on the dependency.",
    ctaLabel: "Assess a repo you're evaluating",
    ctaHref: "/",
    spokeHref: "/for/adopters",
    accent: "border-t-sky-400/70",
    spoke: {
      title: "TrustScope for adopters",
      jtbd: "Before you depend on a project, decide how much to trust it — is it built securely, well-governed, and likely to be maintained in a year?",
      pains: [
        "Raw Scorecard output is cryptic and hard to act on.",
        "A star count or a green badge says nothing about real risk.",
        "The trade-offs stay hidden behind one number.",
        "Supply-chain risk (the xz pattern) is invisible until it isn't.",
      ],
      perPillar: "TrustScope reads all four pillars separately — security & supply chain (the full OpenSSF Scorecard), governance, community — and keeps the trade-offs visible instead of averaging them away.",
      walkthrough: "You get a verdict and the trade-off behind it, so you can decide adopt / proceed with caution / avoid — and file constructive fixes upstream as yourself.",
    },
  },
  maintainer: {
    id: "maintainer",
    tag: "Maintainer",
    recognition: "You want people to trust your code.",
    youIf: "You maintain your own project and want to see — and close — the trust gaps adopters look for.",
    ctaLabel: "Check how your own project looks",
    ctaHref: "/",
    spokeHref: "/for/maintainers",
    accent: "border-t-violet-400/70",
    spoke: {
      title: "TrustScope for maintainers",
      jtbd: "See your own project the way an evaluator does — and get a friendly, concrete list of what to harden.",
      pains: [
        "You don't always know what evaluators actually look for.",
        "Scorecard can feel intimidating rather than actionable.",
        "You want a fix-list, not a verdict.",
      ],
      perPillar: "TrustScope shows the same four-pillar report an adopter would see on your repo — security & supply chain, governance, community — so nothing about how you're perceived is a surprise.",
      walkthrough: "Every finding comes with a constructive, rule-based fix you can file as an issue on your own project. It's a mirror and a hardening guide — never a badge.",
    },
  },
};

/** Default display order on /for. Swapping = reorder this array (the config seam;
 *  foundation for the V3 persona-weighting slider). Never hardcode order elsewhere. */
export const PERSONA_ORDER: readonly PersonaId[] = ["adopter", "maintainer"];
```

- [ ] **Step 4: Run it — expect PASS**

Run: `npm test -- personas`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add config/personas.ts config/personas.test.ts
git commit -m "feat(personas): persona config (Adopter + Maintainer) v1 + order seam"
```

---

### Task 2: PersonaCard + `/for` hub (Layout B)

**Files:**
- Create: `components/PersonaSection.tsx`
- Create: `app/for/page.tsx`
- Test: `e2e/persona-pages.spec.ts`

**Interfaces:**
- Consumes: `PERSONAS`, `PERSONA_ORDER`, `Persona` from Task 1.
- Produces: `PersonaCard({ persona }: { persona: Persona })`.

- [ ] **Step 1: Write the failing e2e** — `e2e/persona-pages.spec.ts`

```ts
import { test, expect } from "@playwright/test";

test.describe("/for persona hub", () => {
  test("responds 200 and renders the hub heading", async ({ page }) => {
    const res = await page.goto("/for");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: /Who is TrustScope for/i })).toBeVisible();
  });

  test("renders both persona cards, adopter first, each with a CTA + learn-more", async ({ page }) => {
    await page.goto("/for");
    const headings = page.getByRole("heading", { level: 2 });
    await expect(headings.nth(0)).toContainText(/someone else's code/i);   // adopter
    await expect(headings.nth(1)).toContainText(/trust your code/i);        // maintainer
    await expect(page.getByRole("link", { name: /Learn more/i })).toHaveCount(2);
    await expect(page.getByRole("link", { name: /Assess a repo/i })).toBeVisible();
  });
});
```

- [ ] **Step 2: Run it — expect FAIL** (`/for` is 404)

Run: `npm run test:e2e -- e2e/persona-pages.spec.ts -g "persona hub"`
Expected: FAIL.

- [ ] **Step 3: Create `components/PersonaSection.tsx`**

```tsx
import Link from "next/link";
import type { Persona } from "@/config/personas";

export function PersonaCard({ persona }: { persona: Persona }) {
  return (
    <div className={`rounded-2xl border border-t-2 border-border bg-surface/60 p-6 ${persona.accent}`}>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted">{persona.tag}</span>
      <h2 className="mt-2 text-xl font-semibold leading-snug tracking-tight">{persona.recognition}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{persona.youIf}</p>
      <div className="mt-5 flex flex-col items-start gap-3">
        <Link href={persona.ctaHref}
              className="inline-flex items-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90">
          {persona.ctaLabel} →
        </Link>
        <Link href={persona.spokeHref} className="text-sm text-muted transition-colors hover:text-foreground">
          Learn more →
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `app/for/page.tsx`** (Layout B: `sm:grid-cols-2` over `PERSONA_ORDER`)

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { PERSONAS, PERSONA_ORDER } from "@/config/personas";
import { PersonaCard } from "@/components/PersonaSection";

export const metadata: Metadata = {
  title: "Who is TrustScope for?",
  description:
    "TrustScope is for two audiences: adopters evaluating a third-party project before they depend on it, and maintainers checking — and closing — their own trust gaps.",
};

export default function ForPage() {
  return (
    <div>
      <section className="hero-glow">
        <div className="mx-auto max-w-3xl px-5 pb-6 pt-20 text-center sm:pt-28">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Who is <span className="text-brand">TrustScope</span> for?
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
            Same tool, same report — two vantage points.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-5 pb-4 text-center text-[15px] leading-relaxed text-muted">
        Both ask the same question — <em className="text-foreground/90">how trustworthy is this repository?</em> — from opposite directions.
      </section>

      <section className="mx-auto max-w-5xl px-5 py-10">
        <div className="grid gap-6 sm:grid-cols-2">
          {PERSONA_ORDER.map((id) => (
            <PersonaCard key={id} persona={PERSONAS[id]} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-10 text-center">
        <p className="text-sm text-muted">
          Still have questions? Read the <Link href="/faq" className="text-brand hover:underline">FAQ</Link>.
        </p>
        <Link href="/"
              className="mt-6 inline-flex items-center rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90">
          Paste a repo →
        </Link>
      </section>
    </div>
  );
}
```

- [ ] **Step 5: Run it — expect PASS**

Run: `npm run test:e2e -- e2e/persona-pages.spec.ts -g "persona hub"`
Expected: PASS (both cards, adopter first, 2 learn-more links, Assess CTA).

- [ ] **Step 6: Commit**

```bash
git add components/PersonaSection.tsx app/for/page.tsx e2e/persona-pages.spec.ts
git commit -m "feat(for): /for persona hub — Layout B, config-ordered co-equal cards"
```

---

### Task 3: `PersonaSpoke` + the two spoke pages

**Files:**
- Create: `components/PersonaSpoke.tsx`
- Create: `app/for/adopters/page.tsx`
- Create: `app/for/maintainers/page.tsx`
- Test: `e2e/persona-pages.spec.ts` (append)

**Interfaces:**
- Consumes: `Persona`, `PERSONAS` from Task 1.
- Produces: `PersonaSpoke({ persona, other }: { persona: Persona; other: Persona })`.

- [ ] **Step 1: Write the failing e2e** (append to `e2e/persona-pages.spec.ts`)

```ts
test.describe("persona spokes", () => {
  const SPOKES = [
    { path: "/for/adopters", h1: /TrustScope for adopters/i, other: /for maintainers/i },
    { path: "/for/maintainers", h1: /TrustScope for maintainers/i, other: /for adopters/i },
  ];
  for (const { path, h1, other } of SPOKES) {
    test(`${path} responds 200, renders its h1 + cross-links`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1, name: h1 })).toBeVisible();
      await expect(page.getByRole("link", { name: other })).toBeVisible();       // to the other persona
      await expect(page.getByRole("link", { name: /Who is TrustScope for/i })).toBeVisible(); // back to hub
    });
  }
});
```

- [ ] **Step 2: Run it — expect FAIL** (spokes are 404)

Run: `npm run test:e2e -- e2e/persona-pages.spec.ts -g "spokes"`
Expected: FAIL.

- [ ] **Step 3: Create `components/PersonaSpoke.tsx`**

```tsx
import Link from "next/link";
import type { Persona } from "@/config/personas";

export function PersonaSpoke({ persona, other }: { persona: Persona; other: Persona }) {
  return (
    <div>
      <section className="hero-glow">
        <div className="mx-auto max-w-3xl px-5 pb-6 pt-20 text-center sm:pt-28">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">{persona.tag}</span>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{persona.spoke.title}</h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted">{persona.spoke.jtbd}</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-12">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">What makes this hard</h2>
        <ul className="mt-4 space-y-2 text-[15px] leading-relaxed text-muted">
          {persona.spoke.pains.map((p) => (
            <li key={p} className="before:mr-2 before:text-brand before:content-['—']">{p}</li>
          ))}
        </ul>
        <h2 className="mt-10 text-sm font-semibold uppercase tracking-widest text-muted">How TrustScope helps</h2>
        <p className="mt-4 text-[15px] leading-relaxed text-foreground/90">{persona.spoke.perPillar}</p>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">{persona.spoke.walkthrough}</p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link href={persona.ctaHref}
                className="inline-flex items-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90">
            {persona.ctaLabel} →
          </Link>
          <Link href={other.spokeHref}
                className="inline-flex items-center rounded-lg border border-border bg-surface-2 px-5 py-2.5 text-sm font-medium transition-colors hover:border-brand/40">
            {other.spoke.title} →
          </Link>
          <Link href="/for" className="text-sm text-muted transition-colors hover:text-foreground">
            Who is TrustScope for? ↑
          </Link>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Create the two spoke pages**

`app/for/adopters/page.tsx`:

```tsx
import type { Metadata } from "next";
import { PERSONAS } from "@/config/personas";
import { PersonaSpoke } from "@/components/PersonaSpoke";

export const metadata: Metadata = {
  title: "TrustScope for adopters",
  description: "Vet a third-party open-source project before you depend on it — security, governance and community, with the trade-offs kept visible.",
};

export default function AdoptersPage() {
  return <PersonaSpoke persona={PERSONAS.adopter} other={PERSONAS.maintainer} />;
}
```

`app/for/maintainers/page.tsx`:

```tsx
import type { Metadata } from "next";
import { PERSONAS } from "@/config/personas";
import { PersonaSpoke } from "@/components/PersonaSpoke";

export const metadata: Metadata = {
  title: "TrustScope for maintainers",
  description: "See — and close — the trust gaps adopters look for in your own project, with constructive rule-based fixes you can file yourself.",
};

export default function MaintainersPage() {
  return <PersonaSpoke persona={PERSONAS.maintainer} other={PERSONAS.adopter} />;
}
```

- [ ] **Step 5: Run the spoke e2e — expect PASS**

Run: `npm run test:e2e -- e2e/persona-pages.spec.ts -g "spokes"`
Expected: PASS (both spokes 200, h1, cross-link to the other persona + back to hub).

- [ ] **Step 6: Run every gate**

Run: `npm run typecheck && npm run lint && npm run build && npm test && npm run test:e2e -- e2e/persona-pages.spec.ts`
Expected: all GREEN.

- [ ] **Step 7: Commit**

```bash
git add components/PersonaSpoke.tsx app/for/adopters/page.tsx app/for/maintainers/page.tsx e2e/persona-pages.spec.ts
git commit -m "feat(for): /for/adopters + /for/maintainers explainer spokes"
```

---

## Self-Review

**Spec coverage:** §2 personas → `config/personas.ts` (Task 1). §4a `/for` hub Layout B + config order → Task 2. §4b spokes + cross-links → Task 3. §7 swap seam → `PERSONA_ORDER` (Task 1, exercised by the hub). **Deferred:** the "For whom" dropdown that links here (Plan 3), the contextual-FAQ deep content + `/faq` target (Plan 3), all JSON-LD schema incl. `BreadcrumbList` on spokes (Plan 3, §6).

**Placeholder scan:** none — real copy (spec §2), real code, exact commands.

**Type consistency:** `Persona`/`PersonaId`/`PERSONAS`/`PERSONA_ORDER` defined in Task 1; `PersonaCard` (Task 2) and `PersonaSpoke` (Task 3) both consume `Persona`; spoke pages pass `PERSONAS.adopter`/`.maintainer`. `spokeHref` = `/for/${id}s` matches the route folders. Consistent.

## Execution Handoff

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between. 2. **Inline Execution** — in-session with checkpoints. Gated on Founder approval + MASCHIN spec gegen-check (ships in PR #40).
