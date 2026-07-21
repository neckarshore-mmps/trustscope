import { test, expect } from "@playwright/test";

// The internal design-system reference. Public URL exists but is noindex + absent
// from the sitemap; the only way in is a discreet footer link. These guard that it
// renders, stays noindex, and stays reachable from the footer.
test.describe("Style Guide (internal, noindex)", () => {
  test("renders the design-system reference and is noindex", async ({ page }) => {
    await page.goto("/style-guide");
    await expect(page.getByRole("heading", { level: 1, name: /^Style Guide$/ })).toBeVisible();
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
      "content",
      /(?=.*\bnoindex\b)(?=.*\bnofollow\b)/,
    );
  });

  test("is reachable from the discreet footer link", async ({ page }) => {
    await page.goto("/");
    const link = page.locator("footer").getByRole("link", { name: /^Style Guide$/ });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/style-guide$/);
    await expect(page.getByRole("heading", { level: 1, name: /^Style Guide$/ })).toBeVisible();
  });
});
