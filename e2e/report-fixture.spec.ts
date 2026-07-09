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
