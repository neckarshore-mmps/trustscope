import { test, expect } from "@playwright/test";

// Served offline via the seeded fixture (fixture-org/fixture-repo, §E).
test("downloads the report as Markdown", async ({ page }) => {
  await page.goto("/report?repo=fixture-org/fixture-repo");
  await expect(page.getByRole("heading", { name: "Export this report" })).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download Markdown" }).click(),
  ]);
  expect(download.suggestedFilename()).toContain("trustscope.md");
});

test("downloads the report as HTML", async ({ page }) => {
  await page.goto("/report?repo=fixture-org/fixture-repo");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download HTML" }).click(),
  ]);
  expect(download.suggestedFilename()).toContain("trustscope.html");
});
