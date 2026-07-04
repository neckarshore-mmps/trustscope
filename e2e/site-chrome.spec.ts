import { test, expect } from "@playwright/test";

test.describe("Global chrome renders", () => {
  test("header shows brand + primary nav on /", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header");
    await expect(header.getByRole("link", { name: /TrustScope/i })).toBeVisible();
    await expect(header.getByRole("link", { name: /How it works/i })).toBeVisible();
    await expect(header.getByRole("link", { name: /GitHub/i })).toBeVisible();
  });

  test("footer keeps OpenSSF blurb + legal links on /", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: /OpenSSF Scorecard/i })).toBeVisible();
    await expect(footer.getByRole("link", { name: /Impressum/i })).toBeVisible();
  });
});
