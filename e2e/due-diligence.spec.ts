import { test, expect } from "@playwright/test";

// The seeded fixture (fixture-org/fixture-repo, §E) has no license and no security policy, so the
// panel renders deterministically with two real signals — assert real content, not an "if present"
// smoke. Each signal title links to its pillar section (§D).
test("renders the due-diligence panel with real signals", async ({ page }) => {
  await page.goto("/report?repo=fixture-org/fixture-repo");
  const panel = page.getByTestId("due-diligence");
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("Due Diligence");
  await expect(panel).toContainText("No license");
  await expect(panel).toContainText("No security policy");
  await expect(panel.getByRole("link", { name: "No license" })).toHaveAttribute(
    "href",
    "#pillar-3",
  );
});
