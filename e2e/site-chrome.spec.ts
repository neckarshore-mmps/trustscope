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

test.describe("Footer version line + feedback", () => {
  test("footer shows changelog link, version, and a feedback link on /", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: /^changelog$/i })).toBeVisible();
    await expect(footer.getByText(/^v\d+\.\d+\.\d+$/)).toBeVisible();
    await expect(footer.getByRole("link", { name: /^Feedback$/i })).toBeVisible();
  });

  test("no login control remains in the header", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /log in/i })).toHaveCount(0);
  });
});

test.describe("/changelog", () => {
  test("renders the changelog with the current version", async ({ page }) => {
    const res = await page.goto("/changelog");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: /Changelog/i })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: /v0\.1\.0/i })).toBeVisible();
  });

  test("footer changelog link navigates to /changelog", async ({ page }) => {
    await page.goto("/");
    await page.locator("footer").getByRole("link", { name: /^changelog$/i }).click();
    await expect(page).toHaveURL(/\/changelog$/);
  });
});
