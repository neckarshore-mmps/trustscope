import { test, expect } from "@playwright/test";

// Scorecard findings carry a docUrl -> the evidence disclosure appears. Served offline via the
// seeded fixture (§E). Selector uses the explicit data-testid, not the browser-fragile <details>
// ARIA group role (§F).
test("findings expose an expandable evidence disclosure", async ({ page }) => {
  await page.goto("/report?repo=fixture-org/fixture-repo");
  const first = page.getByTestId("finding-evidence").first();
  await expect(first).toBeVisible();
  // Native <details>: content is in the DOM; opening reveals the raw check key.
  await first.getByText("Details / evidence").click();
  await expect(first).toContainText("check:");
});
