import { test, expect } from "@playwright/test";

// Served offline from the seeded fixture (fixture-org/fixture-repo) — see e2e/global-setup.ts (§E).
// The synthesis now lives inside the TL;DR block, which carries the due-diligence signals folded in.
test("shows the TL;DR block with a one-line synthesis", async ({ page }) => {
  await page.goto("/report?repo=fixture-org/fixture-repo");
  await expect(page.getByTestId("report-tldr")).toBeVisible();
  await expect(page.getByTestId("report-synthesis")).toBeVisible();
  await expect(page.getByRole("heading", { name: "TL;DR" })).toBeVisible();
});
