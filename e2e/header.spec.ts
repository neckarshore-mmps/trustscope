import { test, expect } from "@playwright/test";

test("header shows Bodo beside the wordmark", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("banner").getByAltText(/Bodo/i)).toBeVisible();
});

test("header nav links to Feedback", async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 800 });
  await page.goto("/");
  await expect(
    page.getByRole("banner").getByRole("link", { name: /Feedback/ }),
  ).toHaveAttribute("href", "/feedback");
});
