import { test, expect } from "@playwright/test";

/**
 * E-fixture smoke (V2 amendment §E). A deterministic report for `fixture-org/fixture-repo` is
 * seeded into the FileReportStore by `e2e/global-setup.ts`, so `/report` serves it OFFLINE from
 * cache — no GITHUB token, no network, no live `ossf/scorecard` run. Every V2 report-page e2e
 * (summary, due-diligence, evidence, export) navigates to this slug instead of a live repo.
 *
 * This proves the seam: if the fixture were not served from cache, `resolveReport` would fall
 * through to a live `generate()` for a repo that does not exist and render the error page instead.
 */
test("serves the seeded fixture report offline", async ({ page }) => {
  await page.goto("/report?repo=fixture-org/fixture-repo");
  await expect(
    page.getByRole("heading", { level: 1, name: /fixture-org\/fixture-repo/ }),
  ).toBeVisible();
});

test("shows Bodo in the report masthead, disc tinted to the TL;DR band", async ({ page }) => {
  await page.goto("/report?repo=fixture-org/fixture-repo");
  // Scoped to <main> — the site header also carries a Bodo logo.
  const bodo = page.getByRole("main").getByAltText("Bodo, the TrustScope mascot");
  await expect(bodo).toBeVisible();
  // The disc backdrop echoes the TL;DR ground band. The snakeoil fixture's worst pillar is a
  // concern, so the band is 'concern' → the red disc (#f2a9a9 = rgb(242, 169, 169)).
  const disc = bodo.locator("xpath=..");
  await expect(disc).toHaveCSS("background-color", "rgb(242, 169, 169)");
});

test("renders pillars in fixed order P1 → P2 → P3, with identity hues", async ({ page }) => {
  // Pin dark so the theme-aware eyebrow colour is deterministic (CI's system theme
  // must not decide it). The no-FOUC script in app/layout.tsx reads this before paint.
  await page.addInitScript(() => {
    try {
      localStorage.setItem("ts-mode", "dark");
    } catch {
      /* storage unavailable — the script falls back to system pref */
    }
  });
  await page.goto("/report?repo=fixture-org/fixture-repo");
  // Fixed order: the pillar section headings appear P1, P2, P3 regardless of score.
  const pillarHeadings = page
    .getByRole("heading", { level: 2 })
    .filter({ hasText: /Security & Supply Chain|Trust & Governance|Community & Sustainability/ });
  await expect(pillarHeadings.nth(0)).toHaveText("Security & Supply Chain");
  await expect(pillarHeadings.nth(1)).toHaveText("Trust & Governance");
  await expect(pillarHeadings.nth(2)).toHaveText("Community & Sustainability");
  // Functional Quality is Pro-only — never on the free report.
  await expect(page.getByRole("heading", { name: "Functional Quality" })).toHaveCount(0);
  const p1 = page.getByText("Pillar 1", { exact: true }).first();
  // Dark (base): the P1 eyebrow shows the vivid identity hue #6ee7b7 = rgb(110, 231, 183).
  await expect(p1).toHaveCSS("color", "rgb(110, 231, 183)");
  // Light deepens the SAME hue to its AA-passing sibling emerald-700 #047857 = rgb(4, 120, 87)
  // (a11y contrast fix) — driven by the --pillar-text-1 var, so the accent never drifts hue.
  await page.evaluate(() => document.documentElement.setAttribute("data-mode", "light"));
  await expect(p1).toHaveCSS("color", "rgb(4, 120, 87)");
});
