# Repo selection (combobox) + Recently-Viewed — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the plain repo input into an accessible, searchable combobox (seeds + your recently-viewed, free entry preserved) and add a client-local Recently-Viewed strip on the landing page.

**Architecture:** One client-local `localStorage` module (`recent-repos`) over an injected storage interface. A pure `repo-suggestions` module merges/sorts/filters `seeds ∪ recent`. Three client components consume them: the combobox (`RepoForm`), the strip (`RecentRepos`), and a record-on-view (`RecordView`) on the report page. No server, no auth.

**Tech Stack:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · Vitest (pure modules) · Playwright (UI + localStorage e2e). No combobox library — React only.

## Global Constraints

- **Client-local only** — `localStorage`; no server, no auth, no new GDPR surface.
- **Free entry ALWAYS works** — the suggestion list augments the input, never restricts it; any valid `owner/repo` still submits via `parseRepoInput`.
- **Hydration-safe** — client-local data renders nothing server-side; components populate in `useEffect`.
- **Accessible combobox** — `role="combobox"`/`listbox`/`option`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, `aria-autocomplete="list"`; Arrow/Enter/Escape + focus; Lighthouse a11y stays clean.
- **Ordering** — combobox: pinned (`trustscope`) → recently-viewed (recency) → remaining seeds A→Z. Strip: recency.
- **Minimal storage (Variant A)** — `{ owner, repo, viewedAt }` only; cap `MAX_RECENT = 8`; dedup by `owner/repo` (move-to-front). No report preview stored.
- **Determinism in the pure modules** — `addRecentRepo` takes `now` as an argument (no `Date.now` inside the pure module).
- **UI tasks are gated by Playwright + typecheck/build**, not unit tests (repo convention: pure cores unit-tested, UI via e2e).
- **Gates green:** `npm test` · `npm run typecheck` · `npm run lint` · `npm run build` · `npm run test:e2e`.

---

## File Structure

| File | Responsibility | Change |
|------|----------------|--------|
| `lib/recent-repos.ts` | Client-local list module (over injected storage) | **Create** |
| `lib/recent-repos.test.ts` | Unit tests | **Create** |
| `config/seed-repos.ts` | Static seed suggestions (trustscope pinned + famous) | **Create** |
| `lib/repo-suggestions.ts` | Pure merge/sort/filter of seeds ∪ recent | **Create** |
| `lib/repo-suggestions.test.ts` | Unit tests | **Create** |
| `components/RecordView.tsx` | Records a viewed repo (client, renders null) | **Create** |
| `app/report/page.tsx` | Render `RecordView` on the success branch | **Modify** |
| `components/RecentRepos.tsx` | Landing Recently-Viewed strip | **Create** |
| `app/page.tsx` | Render `RecentRepos` under the hero | **Modify** |
| `components/RepoForm.tsx` | Plain input → accessible combobox | **Modify** |
| `e2e/repo-selection.spec.ts` | Combobox + strip e2e (offline) | **Create** |

---

## Task 1: `recent-repos` client-local module

**Files:**
- Create: `lib/recent-repos.ts`
- Test: `lib/recent-repos.test.ts`

**Interfaces:**
- Produces: `interface RecentRepo { owner: string; repo: string; viewedAt: string }`; `interface RecentStore { read(): string | null; write(value: string): void }`; `getRecentRepos(store)`, `addRecentRepo(store, ref, now)`, `clearRecentRepos(store)`, `browserRecentStore()`, `const MAX_RECENT = 8`.

- [ ] **Step 1: Write the failing test** — `lib/recent-repos.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { addRecentRepo, clearRecentRepos, getRecentRepos, MAX_RECENT, type RecentStore } from "./recent-repos";

function fakeStore(initial = ""): RecentStore {
  let v = initial;
  return { read: () => v || null, write: (x) => { v = x; } };
}

describe("recent-repos", () => {
  it("adds newest-first and reads it back", () => {
    const s = fakeStore();
    addRecentRepo(s, { owner: "a", repo: "x" }, "2026-07-01T00:00:00Z");
    addRecentRepo(s, { owner: "b", repo: "y" }, "2026-07-02T00:00:00Z");
    expect(getRecentRepos(s).map((r) => `${r.owner}/${r.repo}`)).toEqual(["b/y", "a/x"]);
  });
  it("dedups by owner/repo, moving the re-viewed entry to the front", () => {
    const s = fakeStore();
    addRecentRepo(s, { owner: "a", repo: "x" }, "2026-07-01T00:00:00Z");
    addRecentRepo(s, { owner: "b", repo: "y" }, "2026-07-02T00:00:00Z");
    addRecentRepo(s, { owner: "a", repo: "x" }, "2026-07-03T00:00:00Z");
    expect(getRecentRepos(s).map((r) => `${r.owner}/${r.repo}`)).toEqual(["a/x", "b/y"]);
  });
  it("caps at MAX_RECENT", () => {
    const s = fakeStore();
    for (let i = 0; i < MAX_RECENT + 3; i++) addRecentRepo(s, { owner: "o", repo: `r${i}` }, `2026-07-01T00:00:0${i}Z`);
    expect(getRecentRepos(s).length).toBe(MAX_RECENT);
  });
  it("clear empties the list; malformed storage reads as empty", () => {
    const s = fakeStore("not json");
    expect(getRecentRepos(s)).toEqual([]);
    addRecentRepo(s, { owner: "a", repo: "x" }, "2026-07-01T00:00:00Z");
    clearRecentRepos(s);
    expect(getRecentRepos(s)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/recent-repos.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement** — `lib/recent-repos.ts` (part A: types + read)

```ts
export interface RecentRepo {
  owner: string;
  repo: string;
  /** ISO timestamp of the most recent view. */
  viewedAt: string;
}

export interface RecentStore {
  read(): string | null;
  write(value: string): void;
}

const KEY = "trustscope:recent-repos";
export const MAX_RECENT = 8;

export function getRecentRepos(store: RecentStore): RecentRepo[] {
  let raw: string | null;
  try { raw = store.read(); } catch { return []; }
  if (!raw) return [];
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return []; }
  if (!Array.isArray(parsed)) return [];
  const clean = parsed.filter(
    (e): e is RecentRepo =>
      !!e && typeof e.owner === "string" && typeof e.repo === "string" && typeof e.viewedAt === "string",
  );
  return clean.sort((a, b) => (a.viewedAt < b.viewedAt ? 1 : -1)).slice(0, MAX_RECENT);
}
```

- [ ] **Step 4: Implement** — `lib/recent-repos.ts` (part B: add / clear / browser store)

```ts
export function addRecentRepo(store: RecentStore, ref: { owner: string; repo: string }, now: string): void {
  const rest = getRecentRepos(store).filter((e) => !(e.owner === ref.owner && e.repo === ref.repo));
  const next = [{ owner: ref.owner, repo: ref.repo, viewedAt: now }, ...rest].slice(0, MAX_RECENT);
  store.write(JSON.stringify(next));
}

export function clearRecentRepos(store: RecentStore): void {
  store.write("[]");
}

/** Browser-backed store; SSR-safe (no-op when window is absent). */
export function browserRecentStore(): RecentStore {
  if (typeof window === "undefined") return { read: () => null, write: () => {} };
  return {
    read: () => window.localStorage.getItem(KEY),
    write: (v) => window.localStorage.setItem(KEY, v),
  };
}
```

- [ ] **Step 5: Run tests + typecheck to verify pass**

Run: `npx vitest run lib/recent-repos.test.ts && npm run typecheck`
Expected: PASS (4 tests) · tsc clean.

- [ ] **Step 6: Commit**

```bash
git add lib/recent-repos.ts lib/recent-repos.test.ts
git commit -m "feat(recent): client-local recent-repos module (capped, deduped, injected storage)"
```

---

## Task 2: Seeds config + `repo-suggestions` pure module

**Files:**
- Create: `config/seed-repos.ts`
- Create: `lib/repo-suggestions.ts`
- Test: `lib/repo-suggestions.test.ts`

**Interfaces:**
- Consumes: `RecentRepo` (Task 1).
- Produces: `interface SeedRepo { owner: string; repo: string; pinned?: boolean }`; `const SEED_REPOS`; `interface Suggestion { owner: string; repo: string; kind: "pinned" | "recent" | "seed" }`; `buildSuggestions(seeds, recent)`, `filterSuggestions(list, query)`.

- [ ] **Step 1: Create the seeds config** — `config/seed-repos.ts`

```ts
export interface SeedRepo {
  owner: string;
  repo: string;
  /** Pinned entries sort to the very top (dogfood default). */
  pinned?: boolean;
}

/** Always-present suggestions. trustscope is the pinned dogfood default; the rest are famous examples. */
export const SEED_REPOS: SeedRepo[] = [
  { owner: "neckarshore-mmps", repo: "trustscope", pinned: true },
  { owner: "ossf", repo: "scorecard" },
  { owner: "sindresorhus", repo: "got" },
];
```

- [ ] **Step 2: Write the failing test** — `lib/repo-suggestions.test.ts`

```ts
import { describe, expect, it } from "vitest";
import type { SeedRepo } from "@/config/seed-repos";
import type { RecentRepo } from "./recent-repos";
import { buildSuggestions, filterSuggestions } from "./repo-suggestions";

const seeds: SeedRepo[] = [
  { owner: "neckarshore-mmps", repo: "trustscope", pinned: true },
  { owner: "ossf", repo: "scorecard" },
  { owner: "sindresorhus", repo: "got" },
];
const recent: RecentRepo[] = [{ owner: "acme", repo: "widget", viewedAt: "2026-07-02T00:00:00Z" }];

describe("buildSuggestions", () => {
  it("orders pinned → recent → remaining seeds A→Z, deduped", () => {
    const out = buildSuggestions(seeds, recent).map((s) => `${s.owner}/${s.repo}`);
    expect(out).toEqual(["neckarshore-mmps/trustscope", "acme/widget", "ossf/scorecard", "sindresorhus/got"]);
  });
  it("does not double-list a recent repo that is also a seed", () => {
    const out = buildSuggestions(seeds, [{ owner: "ossf", repo: "scorecard", viewedAt: "2026-07-02T00:00:00Z" }]);
    expect(out.filter((s) => `${s.owner}/${s.repo}` === "ossf/scorecard")).toHaveLength(1);
  });
});
describe("filterSuggestions", () => {
  it("substring-filters case-insensitively; empty query returns all", () => {
    const all = buildSuggestions(seeds, recent);
    expect(filterSuggestions(all, "GOT").map((s) => s.repo)).toEqual(["got"]);
    expect(filterSuggestions(all, "").length).toBe(all.length);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run lib/repo-suggestions.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 4: Implement** — `lib/repo-suggestions.ts`

```ts
import type { SeedRepo } from "@/config/seed-repos";
import type { RecentRepo } from "./recent-repos";

export interface Suggestion {
  owner: string;
  repo: string;
  kind: "pinned" | "recent" | "seed";
}

const slug = (r: { owner: string; repo: string }) => `${r.owner}/${r.repo}`;

/** pinned seeds → recently-viewed (recency, as given) → remaining seeds A→Z, deduped by slug. */
export function buildSuggestions(seeds: SeedRepo[], recent: RecentRepo[]): Suggestion[] {
  const out: Suggestion[] = [];
  const seen = new Set<string>();
  for (const s of seeds.filter((x) => x.pinned)) {
    out.push({ owner: s.owner, repo: s.repo, kind: "pinned" });
    seen.add(slug(s));
  }
  for (const r of recent) {
    if (seen.has(slug(r))) continue;
    seen.add(slug(r));
    out.push({ owner: r.owner, repo: r.repo, kind: "recent" });
  }
  const rest = seeds
    .filter((s) => !s.pinned && !seen.has(slug(s)))
    .sort((a, b) => slug(a).localeCompare(slug(b)));
  for (const s of rest) {
    seen.add(slug(s));
    out.push({ owner: s.owner, repo: s.repo, kind: "seed" });
  }
  return out;
}

/** Case-insensitive substring filter on owner/repo. Empty query returns all. */
export function filterSuggestions(list: Suggestion[], query: string): Suggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((s) => slug(s).toLowerCase().includes(q));
}
```

- [ ] **Step 5: Run tests + typecheck to verify pass**

Run: `npx vitest run lib/repo-suggestions.test.ts && npm run typecheck`
Expected: PASS (4 tests) · tsc clean.

- [ ] **Step 6: Commit**

```bash
git add config/seed-repos.ts lib/repo-suggestions.ts lib/repo-suggestions.test.ts
git commit -m "feat(suggestions): seeds config + pure merge/sort/filter of seeds ∪ recent"
```

---

## Task 3: `RecordView` + wire into the report page

**Files:**
- Create: `components/RecordView.tsx`
- Modify: `app/report/page.tsx` (success branch)

**Interfaces:**
- Consumes: `addRecentRepo`, `browserRecentStore` (Task 1).

- [ ] **Step 1: Implement** — `components/RecordView.tsx`

```tsx
"use client";

import { useEffect } from "react";
import { addRecentRepo, browserRecentStore } from "@/lib/recent-repos";

/** Records a successfully-viewed repo into the client-local recent list. Renders nothing. */
export function RecordView({ owner, repo }: { owner: string; repo: string }) {
  useEffect(() => {
    addRecentRepo(browserRecentStore(), { owner, repo }, new Date().toISOString());
  }, [owner, repo]);
  return null;
}
```

- [ ] **Step 2: Wire it into the success branch** — `app/report/page.tsx`

Add the import and wrap the success return:

```tsx
import { RecordView } from "@/components/RecordView";
// ...
return (
  <>
    <RecordView owner={parsed.owner} repo={parsed.repo} />
    <ReportView report={outcome.report} source={outcome.source} cached={outcome.cached} />
  </>
);
```

- [ ] **Step 3: Verify typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: PASS · build green.

- [ ] **Step 4: Commit**

```bash
git add components/RecordView.tsx app/report/page.tsx
git commit -m "feat(recent): record a viewed repo into the recent list on the report page"
```

---

## Task 4: `RecentRepos` strip + wire into the landing page

**Files:**
- Create: `components/RecentRepos.tsx`
- Modify: `app/page.tsx` (under the hero)

**Interfaces:**
- Consumes: `getRecentRepos`, `clearRecentRepos`, `browserRecentStore`, `RecentRepo` (Task 1).

- [ ] **Step 1: Implement** — `components/RecentRepos.tsx` (part A: helper + load)

```tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { browserRecentStore, clearRecentRepos, getRecentRepos, type RecentRepo } from "@/lib/recent-repos";

function ago(iso: string, now: number): string {
  const s = Math.max(0, (now - Date.parse(iso)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
```

- [ ] **Step 2: Implement** — `components/RecentRepos.tsx` (part B: component)

```tsx
export function RecentRepos() {
  const [items, setItems] = useState<RecentRepo[]>([]);
  useEffect(() => { setItems(getRecentRepos(browserRecentStore())); }, []);
  if (items.length === 0) return null;
  const now = Date.now();
  return (
    <div className="mx-auto mt-8 max-w-xl text-left">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Recently viewed</h2>
        <button type="button" onClick={() => { clearRecentRepos(browserRecentStore()); setItems([]); }}
          className="text-xs text-muted hover:text-foreground">Clear</button>
      </div>
      <ul className="mt-3 flex flex-col gap-1">
        {items.map((r) => (
          <li key={`${r.owner}/${r.repo}`}>
            <Link href={`/report?repo=${encodeURIComponent(`${r.owner}/${r.repo}`)}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface/50 px-4 py-2 text-sm transition-colors hover:border-brand/30">
              <span className="font-mono text-foreground">{r.owner}/{r.repo}</span>
              <span className="text-xs text-muted">{ago(r.viewedAt, now)}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted/70">Saved only in your browser.</p>
    </div>
  );
}
```

- [ ] **Step 3: Wire into the hero** — `app/page.tsx`

Add `import { RecentRepos } from "@/components/RecentRepos";`, then render it directly after the "Try …" hint `<p>`, still inside the hero's `max-w-xl` block:

```tsx
            <p className="mt-3 text-xs text-muted/70">
              Try <span className="font-mono text-muted">ossf/scorecard</span> or{" "}
              <span className="font-mono text-muted">sindresorhus/got</span>. No sign-in needed to
              read a report.
            </p>
          </div>
          <RecentRepos />
```

- [ ] **Step 4: Verify typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: PASS · build green.

- [ ] **Step 5: Commit**

```bash
git add components/RecentRepos.tsx app/page.tsx
git commit -m "feat(recent): Recently-Viewed strip on the landing page (client-local, empty until first view)"
```

---

## Task 5: `RepoForm` → accessible combobox

**Files:**
- Modify: `components/RepoForm.tsx` (full rewrite of the component body)

**Interfaces:**
- Consumes: `SEED_REPOS` (Task 2), `parseRepoInput` (existing), `browserRecentStore`/`getRecentRepos`/`RecentRepo` (Task 1), `buildSuggestions`/`filterSuggestions` (Task 2).

- [ ] **Step 1: Rewrite imports + state + data** — top of `components/RepoForm.tsx`

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";
import { SEED_REPOS } from "@/config/seed-repos";
import { parseRepoInput } from "@/lib/parse-repo-input";
import { browserRecentStore, getRecentRepos, type RecentRepo } from "@/lib/recent-repos";
import { buildSuggestions, filterSuggestions } from "@/lib/repo-suggestions";

export function RepoForm({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const listboxId = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState<RecentRepo[]>([]);
  useEffect(() => { setRecent(getRecentRepos(browserRecentStore())); }, []);
  const suggestions = useMemo(
    () => filterSuggestions(buildSuggestions(SEED_REPOS, recent), value),
    [recent, value],
  );
  const optionId = (i: number) => `${listboxId}-opt-${i}`;
```

- [ ] **Step 2: Handlers** — still in `RepoForm`

```tsx
  function go(owner: string, repo: string) {
    setBusy(true);
    router.push(`/report?repo=${encodeURIComponent(`${owner}/${repo}`)}`);
  }
  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (open && active >= 0 && active < suggestions.length) {
      const s = suggestions[active];
      go(s.owner, s.repo);
      return;
    }
    const parsed = parseRepoInput(value);
    if (!parsed) {
      setError("Enter a GitHub repo — e.g. ossf/scorecard, or a full github.com URL.");
      return;
    }
    setError(null);
    go(parsed.owner, parsed.repo);
  }
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((i) => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Escape") { setOpen(false); setActive(-1); }
  }
```

- [ ] **Step 3: JSX — the input** (replace the old `<input>`), wrapped in a `relative` div

```tsx
  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative w-full">
          <label htmlFor="repo" className="sr-only">Public GitHub repository</label>
          <input
            id="repo" name="repo" type="text" role="combobox"
            aria-expanded={open && suggestions.length > 0}
            aria-controls={listboxId} aria-autocomplete="list"
            aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
            inputMode="url" autoFocus={autoFocus} autoComplete="off" spellCheck={false}
            value={value}
            onChange={(e) => { setValue(e.target.value); setOpen(true); setActive(-1); setError(null); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={onKeyDown}
            placeholder="ossf/scorecard  ·  https://github.com/owner/repo"
            className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-[15px] text-foreground placeholder:text-muted/60 outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/20"
            aria-invalid={Boolean(error)} aria-describedby={error ? "repo-error" : undefined}
          />
```

- [ ] **Step 4: JSX — the listbox + button + error** (immediately after the input)

```tsx
          {open && suggestions.length > 0 && (
            <ul id={listboxId} role="listbox"
              className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-border bg-surface py-1 shadow-lg">
              {suggestions.map((s, i) => (
                <li key={`${s.owner}/${s.repo}`} id={optionId(i)} role="option" aria-selected={i === active}
                  onMouseDown={(e) => { e.preventDefault(); go(s.owner, s.repo); }}
                  onMouseEnter={() => setActive(i)}
                  className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-2 text-[15px] ${i === active ? "bg-brand/10" : ""}`}>
                  <span className="font-mono text-foreground">{s.owner}/{s.repo}</span>
                  <span className="text-xs text-muted">
                    {s.kind === "pinned" ? "TrustScope" : s.kind === "recent" ? "recent" : "example"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="submit" disabled={busy}
          className="shrink-0 rounded-lg bg-brand px-6 py-3 text-[15px] font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-60">
          {busy ? "Assessing…" : "Assess"}
        </button>
      </div>
      {error && <p id="repo-error" className="mt-2 text-sm text-rose-300">{error}</p>}
    </form>
  );
}
```

- [ ] **Step 5: Verify typecheck + lint + build**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: PASS · zero warnings · build green.

- [ ] **Step 6: Commit**

```bash
git add components/RepoForm.tsx
git commit -m "feat(combobox): accessible searchable repo combobox (seeds ∪ recent, free entry preserved)"
```

---

## Task 6: Offline e2e

**Files:**
- Create: `e2e/repo-selection.spec.ts`

Everything stays offline: navigation only ever targets the seeded `fixture-org/fixture-repo` (§E). Selecting a live seed (`ossf/scorecard`) would hit the network, so the spec only asserts that seeds **appear/filter** and navigates via the offline fixture (seeded into `localStorage` as recent).

- [ ] **Step 1: Write the e2e spec** — `e2e/repo-selection.spec.ts`

```ts
import { test, expect } from "@playwright/test";

const RECENT_KEY = "trustscope:recent-repos";

test("combobox shows pinned trustscope and filters incrementally", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("combobox").click();
  const listbox = page.getByRole("listbox");
  await expect(listbox.getByRole("option").first()).toContainText("neckarshore-mmps/trustscope");
  await page.getByRole("combobox").fill("got");
  await expect(listbox.getByRole("option")).toHaveCount(1);
  await expect(listbox.getByRole("option")).toContainText("sindresorhus/got");
});

test("free entry of a non-listed repo still navigates", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("combobox").fill("fixture-org/fixture-repo");
  await page.getByRole("button", { name: "Assess" }).click();
  await expect(page).toHaveURL(/repo=fixture-org%2Ffixture-repo/);
  await expect(page.getByRole("heading", { level: 1, name: /fixture-org\/fixture-repo/ })).toBeVisible();
});

test("viewing a report adds it to the Recently-Viewed strip; Clear empties it", async ({ page }) => {
  await page.goto("/report?repo=fixture-org/fixture-repo");
  await expect(page.getByRole("heading", { level: 1, name: /fixture-org\/fixture-repo/ })).toBeVisible();
  await page.goto("/");
  const strip = page.getByText("Recently viewed");
  await expect(strip).toBeVisible();
  await expect(page.getByRole("link", { name: /fixture-org\/fixture-repo/ })).toBeVisible();
  await page.getByRole("button", { name: "Clear" }).click();
  await expect(strip).toHaveCount(0);
});

test("a recent repo appears as a combobox suggestion and navigates on select", async ({ page }) => {
  await page.addInitScript(([k]) => {
    window.localStorage.setItem(k, JSON.stringify([{ owner: "fixture-org", repo: "fixture-repo", viewedAt: "2026-07-03T00:00:00Z" }]));
  }, [RECENT_KEY]);
  await page.goto("/");
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: /fixture-org\/fixture-repo/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: /fixture-org\/fixture-repo/ })).toBeVisible();
});
```

- [ ] **Step 2: Run the full e2e suite**

Run: `npm run test:e2e`
Expected: PASS — the 4 new tests + all prior specs still green.

- [ ] **Step 3: Commit**

```bash
git add e2e/repo-selection.spec.ts
git commit -m "test(e2e): combobox filter/free-entry/select + Recently-Viewed strip (offline)"
```

---

## Final verification (before marking in-review)

- [ ] `npm test` — all unit tests pass (recent-repos + repo-suggestions + existing).
- [ ] `npm run typecheck` — tsc clean.
- [ ] `npm run lint` — ESLint zero warnings.
- [ ] `npm run build` — production build green.
- [ ] `npm run test:e2e` — all Playwright specs pass.
- [ ] Manual a11y: keyboard-only — Arrow/Enter/Escape drive the combobox; focus visible; `aria-activedescendant` tracks the active option. Lighthouse a11y ≥ existing.
- [ ] Visual: combobox dropdown + Recently-Viewed strip read clean on mobile + desktop, light + dark. → **Founder visual-accept.**

## Open items for the plan review (MASCHIN)

1. **Ordering** — combobox is pinned → recency → seeds-A→Z (a mixed order); confirm vs. a pure A→Z alternative.
2. **Seed set** — starts with `trustscope` (pinned) + `ossf/scorecard` + `sindresorhus/got`; the famous-repos list can grow later (not this plan).
3. **Component tests** — Tasks 3–5 are gated by Playwright + typecheck/build (repo convention: no component unit tests). Confirm that is acceptable vs. adding a component-test setup.
