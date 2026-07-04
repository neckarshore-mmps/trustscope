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

test.describe("Footer credibility line", () => {
  for (const path of ["/", "/about"]) {
    test(`footer shows Neckarshore + Made-in-Germany + link on ${path}`, async ({ page }) => {
      await page.goto(path);
      const footer = page.locator("footer");
      await expect(footer.getByText(/Made in Germany/i)).toBeVisible();
      await expect(footer.getByRole("link", { name: /neckarshore\.ai/i })).toBeVisible();
    });
  }
});

test.describe("Login coming-soon", () => {
  test("Login button reveals 'Coming soon' and never navigates", async ({ page }) => {
    await page.goto("/");
    const login = page.getByRole("button", { name: /log in/i });
    await expect(login).toBeVisible();
    await login.click();
    await expect(page.getByText(/coming soon/i)).toBeVisible();
    await expect(page).toHaveURL(/\/$/); // it is a button, not a link — no navigation
  });

  test("Escape closes the 'Coming soon' hint", async ({ page }) => {
    await page.goto("/");
    const login = page.getByRole("button", { name: /log in/i });
    await login.click();
    await expect(page.getByText(/coming soon/i)).toBeVisible();
    await login.press("Escape");
    await expect(page.getByText(/coming soon/i)).toBeHidden();
  });
});
