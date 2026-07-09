import { test, expect } from "@playwright/test";

// Served offline from the seeded fixture (fixture-org/fixture-repo) — see e2e/global-setup.ts (§E).
test("shows the one-line synthesis and a coverage line", async ({ page }) => {
  await page.goto("/report?repo=fixture-org/fixture-repo");
  await expect(page.getByTestId("report-synthesis")).toBeVisible();
  await expect(page.getByTestId("report-coverage")).toContainText("Not assessed");
});
