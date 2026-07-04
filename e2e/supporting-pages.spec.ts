import { test, expect } from "@playwright/test";

test.describe("/how-it-works", () => {
  test("responds 200 and renders the four-pillars content", async ({ page }) => {
    const res = await page.goto("/how-it-works");
    expect(res?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: "The four pillars", exact: true }),
    ).toBeVisible();
  });
});

test.describe("/about company page", () => {
  test("renders the company story + neckarshore link + Made in Germany", async ({ page }) => {
    const res = await page.goto("/about");
    expect(res?.status()).toBe(200);
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { level: 1, name: /Neckarshore/i })).toBeVisible();
    // scope to main: the footer credibility line also says "Made in Germany"
    await expect(main.getByText(/Made in Germany/i).first()).toBeVisible();
    await expect(main.getByRole("link", { name: /neckarshore\.ai/i }).first()).toBeVisible();
    // migration contract (spec §3): mechanics-seekers get a link to /how-it-works
    await expect(main.getByRole("link", { name: /how TrustScope works/i })).toHaveAttribute(
      "href",
      "/how-it-works",
    );
  });
});

test.describe("/faq", () => {
  test("responds 200, renders questions + FAQPage JSON-LD", async ({ page }) => {
    const res = await page.goto("/faq");
    expect(res?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: /account to read a report/i }),
    ).toBeVisible();
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(ld).toContain("FAQPage");
  });
});
