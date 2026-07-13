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
  test("footer shows product+version, Changelog link, and a feedback link on /", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    // AD-42 variant A: "<product> <version> · <sha> · Changelog" (SHA is deploy-only, absent locally).
    await expect(footer.getByText(/TrustScope v\d+\.\d+\.\d+/)).toBeVisible();
    await expect(footer.getByRole("link", { name: /^Changelog$/ })).toBeVisible();
    await expect(footer.getByRole("link", { name: /^Feedback$/i })).toBeVisible();
  });

  test("no login control remains in the header", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /log in/i })).toHaveCount(0);
  });
});

test("landing hero shows the Bodo mascot", async ({ page }) => {
  await page.goto("/");
  // Scope to <main> — the small header logo also uses the bodo.svg alt.
  await expect(
    page.getByRole("main").getByRole("img", { name: /Bodo, the TrustScope mascot/i }),
  ).toBeVisible();
});

test.describe("/ landing pillars", () => {
  test("shows three pillars — Functional Quality (Pro-only) is not on the free landing", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Three questions, three pillars/i }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Security & Supply Chain" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Trust & Governance" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Community & Sustainability" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Functional Quality" })).toHaveCount(0);
  });
});

test.describe("/changelog", () => {
  test("renders the changelog with the current version", async ({ page }) => {
    const res = await page.goto("/changelog");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: /Changelog/i })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: /v0\.1\.0/i })).toBeVisible();
    // Curated highlights are sourced from CHANGELOG.md's [public] section at build time.
    await expect(page.getByText(/Deterministic trust reports/i)).toBeVisible();
    await expect(page.getByText(/via TrustScope/i)).toBeVisible();
  });

  test("footer Changelog link navigates to /changelog", async ({ page }) => {
    await page.goto("/");
    await page.locator("footer").getByRole("link", { name: /^Changelog$/ }).click();
    await expect(page).toHaveURL(/\/changelog$/);
  });
});
