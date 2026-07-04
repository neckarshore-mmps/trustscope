# Due-Diligence install-scripts signal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one calm Due-Diligence signal — a note when a package declares npm install-time lifecycle scripts (`preinstall`/`install`/`postinstall`).

**Architecture:** A new best-effort manifest adapter reads the repo's root `package.json` and reports which auto-run install hooks it declares (its own seam, per AP-1). The existing pure `detectDueDiligence` gains an optional `manifest` argument and emits the signal; `buildReport` and the `generateReport` orchestrator thread the manifest through. Panel renders it automatically.

**Tech Stack:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · Vitest (pure cores) · Playwright (offline fixture e2e).

## Global Constraints

- **Deterministic, no LLM, no `Date.now`** — both `assessedAt` and `generatedAt` are **passed in by the caller, never synthesized**; same repo + same timestamps → byte-identical report.
- **No aggregate score** (DECISIONS #4) — a qualitative note, never counted.
- **Calm + constructive tone** — states the fact + a real next step; never "malicious"/"bought"/"backdoor".
- **Panel renders `detail`/`mitigation` as PLAIN TEXT** — no markdown, no backticks in the strings (they would render literally).
- **Trigger = exactly** `preinstall`, `install`, `postinstall`, kept in that canonical order. Ordinary scripts (`build`, `test`, …) never fire.
- **Manifest scope = root `package.json`, npm only.** Monorepo workspaces + other ecosystems out.
- **Pillar = `security-supply-chain`** (numeric id `2`).
- **Graceful degradation** — the manifest adapter **never throws**; any failure resolves to `null`, which yields no signal and leaves the rest of the report untouched.
- **In-report string language = English** (matches batch 1). Deps stay exactly pinned (`.npmrc` `save-exact`).
- **Gates that must stay green:** `npm test` · `npm run typecheck` · `npm run lint` · `npm run build` · `npm run test:e2e`.

---

## File Structure

| File | Responsibility | Change |
|------|----------------|--------|
| `lib/report-core/types.ts` | Shared core types | **Modify** — add `InstallHook`, `ManifestData` |
| `lib/adapters/github.ts` | GitHub REST adapter | **Modify** — `export` `GITHUB_API` + `ghHeaders` for reuse |
| `lib/adapters/manifest.ts` | Manifest adapter (new seam) | **Create** — `fetchPackageManifest()` |
| `lib/adapters/manifest.test.ts` | Adapter unit tests | **Create** |
| `lib/report-core/due-diligence.ts` | Pure signal detector | **Modify** — optional `manifest` arg + install-scripts signal |
| `lib/report-core/due-diligence.test.ts` | Detector unit tests | **Modify** — add install-scripts cases |
| `lib/report-core/build-report.ts` | Pure report assembler | **Modify** — `BuildReportInput.manifest`, pass to detector |
| `lib/report-core/build-report.dd.test.ts` | buildReport DD test | **Modify** — manifest → signal case |
| `lib/adapters/generate-report.ts` | Network orchestrator | **Modify** — fetch manifest concurrently, pass in |
| `e2e/global-setup.ts` | Offline fixture seed | **Modify** — seed the manifest so the signal appears |
| `e2e/due-diligence.spec.ts` | DD panel e2e | **Modify** — assert the install-scripts signal |
| `README.md` | Product docs | **Modify** — document the signal (Deliverable 2) |

---

## Task 1: Manifest type + adapter

**Files:**
- Modify: `lib/report-core/types.ts` (append the two types)
- Modify: `lib/adapters/github.ts:10` and `:25` (add `export`)
- Create: `lib/adapters/manifest.ts`
- Test: `lib/adapters/manifest.test.ts`

**Interfaces:**
- Produces: `type InstallHook = "preinstall" | "install" | "postinstall"`; `interface ManifestData { installHooks: InstallHook[] }`; `fetchPackageManifest(owner: string, repo: string, opts?: GitHubFetchOptions): Promise<ManifestData | null>`.

- [ ] **Step 1: Add the types** (append to `lib/report-core/types.ts`)

```ts
/** npm lifecycle hooks that run automatically on `npm install`. */
export type InstallHook = "preinstall" | "install" | "postinstall";

/** Minimal facts read from a package's root package.json (batch-2 manifest seam). */
export interface ManifestData {
  /** Which auto-run install hooks are present, in canonical order. */
  installHooks: InstallHook[];
}
```

- [ ] **Step 2: Export the reusable GitHub helpers** in `lib/adapters/github.ts`

Change line 10 `const GITHUB_API =` → `export const GITHUB_API =`, and line 25 `function ghHeaders(` → `export function ghHeaders(`. No behaviour change.

- [ ] **Step 3: Write the failing test** — `lib/adapters/manifest.test.ts`

```ts
import { describe, expect, it, vi } from "vitest";
import { fetchPackageManifest } from "./manifest";

function res(status: number, json: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => json } as Response;
}
function contents(pkg: unknown) {
  return res(200, { content: Buffer.from(JSON.stringify(pkg), "utf8").toString("base64"), encoding: "base64" });
}
const asFetch = (fn: unknown) => fn as unknown as typeof fetch;

describe("fetchPackageManifest", () => {
  it("extracts the auto-run install hooks present, in canonical order", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      contents({ scripts: { postinstall: "node build.js", preinstall: "echo hi", test: "vitest" } }));
    expect(await fetchPackageManifest("o", "r", { fetchFn: asFetch(fetchFn) }))
      .toEqual({ installHooks: ["preinstall", "postinstall"] });
  });
  it("returns [] (parsed, no hooks) for scripts without install hooks AND for a manifest with no scripts key", async () => {
    const withScripts = vi.fn().mockResolvedValue(contents({ scripts: { build: "tsc" } }));
    expect(await fetchPackageManifest("o", "r", { fetchFn: asFetch(withScripts) })).toEqual({ installHooks: [] });
    const noScripts = vi.fn().mockResolvedValue(contents({ name: "pkg" }));
    expect(await fetchPackageManifest("o", "r", { fetchFn: asFetch(noScripts) })).toEqual({ installHooks: [] });
  });
  it("returns null on 404, non-JSON, and a rejected/aborted fetch — never throws", async () => {
    expect(await fetchPackageManifest("o", "r", { fetchFn: asFetch(vi.fn().mockResolvedValue(res(404, {}))) })).toBeNull();
    const bad = res(200, undefined); (bad as { json: () => Promise<unknown> }).json = async () => { throw new Error("bad"); };
    expect(await fetchPackageManifest("o", "r", { fetchFn: asFetch(vi.fn().mockResolvedValue(bad)) })).toBeNull();
    expect(await fetchPackageManifest("o", "r", { fetchFn: asFetch(vi.fn().mockRejectedValue(new Error("net"))) })).toBeNull();
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run lib/adapters/manifest.test.ts`
Expected: FAIL — `fetchPackageManifest` not found / module missing.

- [ ] **Step 5: Implement** — `lib/adapters/manifest.ts`

```ts
import type { InstallHook, ManifestData } from "@/lib/report-core/types";
import { GITHUB_API, ghHeaders, type GitHubFetchOptions } from "./github";

/** The npm hooks that execute automatically on `npm install`, in canonical order. */
const INSTALL_HOOKS: InstallHook[] = ["preinstall", "install", "postinstall"];

/** Hard deadline so a slow/hanging GitHub response degrades to `null` instead of blocking the report. */
const MANIFEST_FETCH_TIMEOUT_MS = 5000;

/**
 * Manifest adapter (batch-2 due-diligence seam). Reads the repo's ROOT package.json and reports
 * which auto-run install hooks it declares. Best-effort BY DESIGN: any failure (404, non-JSON,
 * rate-limit, network, **timeout**) resolves to `null` so the report never dies on this source.
 * A successfully-parsed manifest with no install hooks returns `{ installHooks: [] }` (see the shape
 * contract in the spec): `null` = missing / not npm / failed fetch; `[]` = parsed, no install hooks.
 */
export async function fetchPackageManifest(
  owner: string,
  repo: string,
  opts: GitHubFetchOptions = {},
): Promise<ManifestData | null> {
  const fetchImpl = opts.fetchFn ?? fetch;
  const token = opts.githubToken ?? process.env.GITHUB_AUTH_TOKEN;
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), MANIFEST_FETCH_TIMEOUT_MS);
  try {
    const res = await fetchImpl(
      `${GITHUB_API}/repos/${owner}/${repo}/contents/package.json`,
      { headers: ghHeaders(token), signal: controller.signal },
    );
    if (!res.ok) return null;
    const body = (await res.json()) as { content?: unknown };
    if (typeof body.content !== "string") return null;
    const pkg = JSON.parse(Buffer.from(body.content, "base64").toString("utf8")) as {
      scripts?: Record<string, unknown>;
    };
    const scripts = pkg.scripts;
    if (!scripts || typeof scripts !== "object") return { installHooks: [] };
    const installHooks = INSTALL_HOOKS.filter(
      (h) => typeof scripts[h] === "string" && (scripts[h] as string).trim() !== "",
    );
    return { installHooks };
  } catch {
    // includes the AbortError thrown when the deadline fires
    return null;
  } finally {
    clearTimeout(deadline);
  }
}
```

- [ ] **Step 6: Run tests + typecheck to verify pass**

Run: `npx vitest run lib/adapters/manifest.test.ts && npm run typecheck`
Expected: PASS (3 tests) · tsc clean.

- [ ] **Step 7: Commit**

```bash
git add lib/report-core/types.ts lib/adapters/github.ts lib/adapters/manifest.ts lib/adapters/manifest.test.ts
git commit -m "feat(manifest): fetchPackageManifest — root package.json install-hook reader (best-effort)"
```

---

## Task 2: Detector — the install-scripts signal

**Files:**
- Modify: `lib/report-core/due-diligence.ts`
- Test: `lib/report-core/due-diligence.test.ts`

**Interfaces:**
- Consumes: `ManifestData` (Task 1).
- Produces: `detectDueDiligence(github, manifest, assessedAt)` — `manifest` is the **2nd** argument (matches the PR objective), `manifest: ManifestData | null` **required**. The single existing caller (`build-report.ts:270`, today `detectDueDiligence(github, scorecard.date)`) is re-threaded to pass `manifest` in the 2nd slot.

- [ ] **Step 1: Write the failing tests** — append inside the `describe` in `lib/report-core/due-diligence.test.ts`

```ts
it("flags install scripts from the manifest, on the security pillar", () => {
  const s = detectDueDiligence(base, { installHooks: ["postinstall"] }, assessedAt);
  const sig = s.find((x) => x.id === "install-scripts");
  expect(sig).toBeTruthy();
  expect(sig?.detail).toContain("postinstall");
  expect(sig?.pillarId).toBe(2); // security-supply-chain
  expect(sig?.mitigation).toContain("--ignore-scripts");
});
it("does not flag install scripts when the manifest has no hooks or is null", () => {
  // manifest parsed, no install hooks → no signal
  expect(detectDueDiligence(base, { installHooks: [] }, assessedAt).map((x) => x.id)).not.toContain("install-scripts");
  // manifest missing / fetch failed → no signal
  expect(detectDueDiligence(base, null, assessedAt).map((x) => x.id)).not.toContain("install-scripts");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/report-core/due-diligence.test.ts`
Expected: FAIL — signal absent / arity mismatch.

- [ ] **Step 3: Implement** — in `lib/report-core/due-diligence.ts`

Add `InstallHook, ManifestData` to the `./types` import. Change the signature and append the signal before `return signals;`:

```ts
export function detectDueDiligence(
  github: GitHubData,
  manifest: ManifestData | null,
  assessedAt: string,
): DueDiligenceSignal[] {
  // ...existing batch-1 pushes unchanged...

  if (manifest && manifest.installHooks.length > 0) {
    const hooks = manifest.installHooks.join(", ");
    signals.push({
      id: "install-scripts",
      title: "Runs scripts on install",
      detail: `This package runs its own steps automatically when it is installed (${hooks}) — arbitrary code runs during npm install. Often legitimate (native builds, setup), but worth a look before you adopt it.`,
      mitigation:
        "Review what the install steps do — installing with the --ignore-scripts flag lets you hold them back and inspect first.",
      pillarKey: "security-supply-chain",
      pillarId: pillarId("security-supply-chain"),
    });
  }

  return signals;
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npx vitest run lib/report-core/due-diligence.test.ts`
Expected: PASS (all existing batch-1 cases + the 2 new cases).

- [ ] **Step 5: Commit**

```bash
git add lib/report-core/due-diligence.ts lib/report-core/due-diligence.test.ts
git commit -m "feat(signals): install-scripts due-diligence signal (security pillar, calm tone)"
```

---

## Task 3: Wire the manifest through buildReport + generateReport

**Files:**
- Modify: `lib/report-core/build-report.ts:252-291`
- Test: `lib/report-core/build-report.dd.test.ts`
- Modify: `lib/adapters/generate-report.ts:28-45`

**Interfaces:**
- Consumes: `fetchPackageManifest` (Task 1), the new detector arity (Task 2).
- Produces: `BuildReportInput.manifest?: ManifestData | null`; `generateReport` now fetches the manifest concurrently and passes it in.

- [ ] **Step 1: Write the failing test** — append to `lib/report-core/build-report.dd.test.ts`

```ts
it("includes the install-scripts signal when the manifest declares hooks", () => {
  const report = buildReport({
    scorecard: read("scorecard-snakeoil.json"),
    github: normalizeGitHubData(read("github-repo-snakeoil.json"), read("github-community-snakeoil.json")),
    generatedAt: "2026-07-01T00:00:00.000Z",
    manifest: { installHooks: ["postinstall"] },
  });
  expect(report.dueDiligence.map((s) => s.id)).toContain("install-scripts");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/report-core/build-report.dd.test.ts`
Expected: FAIL — `manifest` not a valid `BuildReportInput` field / signal absent.

- [ ] **Step 3: Implement buildReport** — `lib/report-core/build-report.ts`

Add `ManifestData` to the `./types` import. Extend the input interface and the call:

```ts
export interface BuildReportInput {
  scorecard: ScorecardResult;
  github: GitHubData;
  /** ISO timestamp; caller supplies it so the core stays deterministic/pure. */
  generatedAt: string;
  /** Root package.json facts (batch-2 seam); null when unread. */
  manifest?: ManifestData | null;
}
```

In `buildReport`, change the destructure + detector call:

```ts
const { scorecard, github, generatedAt, manifest = null } = input;
// ...
const dueDiligence = detectDueDiligence(github, manifest, scorecard.date);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/report-core/build-report.dd.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire the orchestrator** — `lib/adapters/generate-report.ts`

Add the import and the concurrent fetch. **`generatedAt` is a REQUIRED caller input** — the orchestrator never synthesizes it (no `new Date()`), so the report stays deterministic. Make `generatedAt: string` a required field on `generateReport`'s options; its own caller (the route/page) passes a deterministic timestamp:

```ts
import { fetchPackageManifest } from "./manifest";
// ...
const [{ result: scorecard, source }, github, manifest] = await Promise.all([
  getScorecard(owner, repo, opts),
  fetchGitHubData(owner, repo, opts),
  fetchPackageManifest(owner, repo, opts),
]);

const report = buildReport({
  scorecard,
  github,
  manifest,
  generatedAt: opts.generatedAt, // required; never `?? new Date()` — identical inputs → identical report
});
```

- [ ] **Step 6: Run the full unit suite + typecheck**

Run: `npm test && npm run typecheck`
Expected: PASS (all unit tests) · tsc clean.

- [ ] **Step 7: Commit**

```bash
git add lib/report-core/build-report.ts lib/report-core/build-report.dd.test.ts lib/adapters/generate-report.ts
git commit -m "feat(report): thread package manifest through buildReport + generateReport"
```

---

## Task 4: Offline e2e — seed the fixture + assert the panel

**Files:**
- Modify: `e2e/global-setup.ts:29-36`
- Modify: `e2e/due-diligence.spec.ts`

**Interfaces:**
- Consumes: the wired `buildReport` (Task 3).

- [ ] **Step 1: Seed the manifest into the fixture** — in `e2e/global-setup.ts`, add `manifest` to the `buildReport` call:

```ts
const built = buildReport({
  scorecard: read("scorecard-snakeoil.json"),
  github: normalizeGitHubData(
    read("github-repo-snakeoil.json"),
    read("github-community-snakeoil.json"),
  ),
  generatedAt: "2026-07-01T00:00:00.000Z",
  manifest: { installHooks: ["postinstall"] },
});
```

- [ ] **Step 2: Add the failing e2e assertion** — append to `e2e/due-diligence.spec.ts`

```ts
test("shows the install-scripts signal linked to the security pillar", async ({ page }) => {
  await page.goto("/report?repo=fixture-org/fixture-repo");
  const panel = page.getByTestId("due-diligence");
  await expect(panel).toContainText("Runs scripts on install");
  await expect(panel.getByRole("link", { name: "Runs scripts on install" })).toHaveAttribute(
    "href",
    "#pillar-2",
  );
});
```

- [ ] **Step 3: Run the e2e suite**

Run: `npm run test:e2e`
Expected: PASS — all prior specs still green (the new signal is additive) + the new assertion passes.

- [ ] **Step 4: Commit**

```bash
git add e2e/global-setup.ts e2e/due-diligence.spec.ts
git commit -m "test(e2e): fixture seeds install-scripts signal; panel asserts it (offline)"
```

---

## Task 5: Documentation (Deliverable 2 — README)

**Files:**
- Modify: `README.md`

Documents the signal in plain language (English, README surface), reusing the approved copy. No automated test; DoD = present + accurate.

- [ ] **Step 1: Add a "Due-diligence signals" note** under the four-pillar section of `README.md`:

```markdown
### Due-diligence signals

Alongside the pillars, the report surfaces a few quiet **due-diligence notes** — calm nudges
derived from existing data, never a score. One example: **install scripts.** Some npm packages
run their own steps automatically the moment they are installed (`preinstall` / `install` /
`postinstall`) — arbitrary code runs during `npm install`. Often legitimate (native builds), but
worth a look before adopting. The note points to a constructive next step
(`npm install --ignore-scripts` to inspect first) and never accuses.
```

- [ ] **Step 2: Verify the docs render** (no broken markdown)

Run: `npm run build`
Expected: build green (unaffected; sanity gate).

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document the install-scripts due-diligence signal"
```

---

## Final verification (before marking in-review)

- [ ] `npm test` — all unit tests pass.
- [ ] `npm run typecheck` — tsc clean.
- [ ] `npm run lint` — ESLint zero warnings.
- [ ] `npm run build` — production build green.
- [ ] `npm run test:e2e` — all Playwright specs pass.
- [ ] Visual: the note reads calm + constructive; links to the Security & Supply Chain pillar. → **Founder visual-accept.**

## Locked decisions (MASCHIN plan-review, 2026-07-04)

1. **FAQ (Deliverable 3) — DEFERRED, not built by this slice.** TrustScope has no FAQ surface today (routes: `/`, `/about`, `/report`, `/impressum`, `/datenschutz`). Do **not** build an in-app `/faq` for this slice — the plain-language copy lives in the **spec as the source**. A product-FAQ is a separate, broader V2 content decision (later `/faq` or the neckarshore-website product page). **Ship the signal + copy; defer the FAQ deliverable.**
2. **Docs language — English.** Task 5 writes the README note in English (README is English → the install-scripts docs stay EN, consistent). The German artifact copy remains the source for a later German surface.
3. **Shape contract: `null` = missing / not npm / failed fetch; `[]` = parsed, no install hooks.** A successfully-read manifest with zero install hooks returns `{ installHooks: [] }`; only an unreadable/failed fetch returns `null`. The detector fires only on a non-empty list, so behaviour is unchanged. This resolves the spec's earlier "no scripts → null" wording; the adapter tests assert both branches (Task 1 Step 3).
4. **In-report string language — English** (like batch 1), confirmed. Detector `detail`/`mitigation` stay English.
