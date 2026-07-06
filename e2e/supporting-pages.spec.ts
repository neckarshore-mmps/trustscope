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
    await expect(page.getByText(/account to read a report/i)).toBeVisible();
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(ld).toContain("FAQPage");
  });
});

test.describe("/feedback", () => {
  test("responds 200 and reserves the slug", async ({ page }) => {
    const res = await page.goto("/feedback");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: /Feedback/i })).toBeVisible();
  });
});

test.describe("navigation", () => {
  test("desktop: 'For whom' reveals Adopters + Maintainers", async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 800 });
    await page.goto("/");
    await page.getByRole("button", { name: /For whom/i }).click();
    // Overview hub removed (2026-07-06 redesign) — the two persona pages are the destinations.
    await expect(page.getByRole("link", { name: /Adopters/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Maintainers/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /^Overview/i })).toHaveCount(0);
  });

  test("desktop: Escape closes the 'For whom' dropdown", async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 800 });
    await page.goto("/");
    const trigger = page.getByRole("button", { name: /For whom/i });
    await trigger.click();
    await expect(page.getByRole("link", { name: /Adopters/i })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("link", { name: /Adopters/i })).toBeHidden();
  });

  test("mobile: hamburger opens a drawer with the nav links", async ({ page }) => {
    await page.setViewportSize({ width: 380, height: 800 });
    await page.goto("/");
    await page.getByRole("button", { name: /open menu/i }).click();
    await expect(page.getByRole("link", { name: /How it works/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /FAQ/i })).toBeVisible();
    // external items open in a new tab in the drawer too (parity with desktop)
    const gh = page.getByRole("link", { name: /GitHub/i });
    await expect(gh).toHaveAttribute("target", "_blank");
    await expect(gh).toHaveAttribute("rel", /noreferrer/);
  });
});

test.describe("SEO surfaces", () => {
  test("sitemap.xml lists /for", async ({ page }) => {
    const res = await page.goto("/sitemap.xml");
    expect(res?.status()).toBe(200);
    expect(await res!.text()).toContain("/for");
  });
  test("llms.txt is served", async ({ page }) => {
    const res = await page.goto("/llms.txt");
    expect(res?.status()).toBe(200);
    expect(await res!.text()).toMatch(/TrustScope/);
  });
  test("spoke carries BreadcrumbList JSON-LD", async ({ page }) => {
    await page.goto("/for/adopters");
    const scripts = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    expect(scripts.join(" ")).toContain("BreadcrumbList");
  });
});
