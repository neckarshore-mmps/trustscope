import { test, expect } from "@playwright/test";

/**
 * Legal pages e2e (DE Pflichtseiten). Written test-first: before the routes exist these
 * fail with 404 + missing footer links. Covers the three things that need a real server:
 *   1. /impressum and /datenschutz return HTTP 200 and render their <h1>
 *   2. each page renders its core sections
 *   3. the footer links to both pages on every page and they actually navigate
 */

const LEGAL_PAGES = [
  { path: "/impressum", heading: /Impressum/i },
  { path: "/datenschutz", heading: /Datenschutz/i },
];

test.describe("Legal pages render and respond 200", () => {
  for (const { path, heading } of LEGAL_PAGES) {
    test(`${path} responds 200 and renders its h1`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(
        page.getByRole("heading", { level: 1, name: heading }),
      ).toBeVisible();
    });
  }

  test("/impressum renders operator + contact sections", async ({ page }) => {
    await page.goto("/impressum");
    await expect(page.getByRole("heading", { name: /Kontakt/i })).toBeVisible();
    await expect(page.getByText(/German Rauhut/i).first()).toBeVisible();
  });

  test("/datenschutz renders core processing sections", async ({ page }) => {
    await page.goto("/datenschutz");
    await expect(
      page.getByRole("heading", { name: /Verantwortlicher/i }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /Hosting/i })).toBeVisible();
  });

  // A2 (Work-Order 2026-07-12): § 6 must disclose the ts-mode theme localStorage key.
  // Scoped to the theme paragraph itself, so it can't pass on §6's OTHER TDDDG mention.
  test("/datenschutz § 6 discloses the ts-mode theme key", async ({ page }) => {
    await page.goto("/datenschutz");
    const themePara = page
      .locator("section", { has: page.getByRole("heading", { name: /Lokale Speicherung/i }) })
      .locator("p", { hasText: "ts-mode" });
    await expect(themePara).toBeVisible();
    await expect(themePara).toContainText("light");
    await expect(themePara).toContainText("dark");
    await expect(themePara).toContainText("TDDDG");
  });

  // A3 (Work-Order 2026-07-12): § 5 leads Art. 45 DPF (participant 6174) as the primary
  // transfer basis and keeps Art. 49(1)(b) as the independent per-transfer fallback.
  // Scoped to the ONE transfer paragraph, so separate mentions can't satisfy the hierarchy.
  test("/datenschutz § 5 leads Art. 45 DPF and keeps Art. 49(1)(b)", async ({ page }) => {
    await page.goto("/datenschutz");
    const transferPara = page
      .locator("section", { has: page.getByRole("heading", { name: /Anmeldung mit GitHub/i }) })
      .locator("p", { hasText: /Vorrangige Rechtsgrundlage/ });
    await expect(transferPara).toBeVisible();
    await expect(transferPara).toContainText("Art. 45 DSGVO");
    await expect(transferPara).toContainText("6174");
    await expect(transferPara).toContainText("Art. 49 Abs. 1 lit. b DSGVO");
    // the fallback is framed as the durable independent basis if DPF adequacy lapses
    await expect(transferPara).toContainText(/entfiele/);
  });
});

test.describe("Footer links to the legal pages", () => {
  const ORIGIN_PAGES = ["/", "/about", "/impressum", "/datenschutz"];

  for (const path of ORIGIN_PAGES) {
    test(`footer shows Impressum + Datenschutz links on ${path}`, async ({
      page,
    }) => {
      await page.goto(path);
      const footer = page.locator("footer");
      await expect(
        footer.getByRole("link", { name: /Impressum/i }),
      ).toBeVisible();
      await expect(
        footer.getByRole("link", { name: /Datenschutz/i }),
      ).toBeVisible();
    });
  }

  test("footer Impressum link navigates to /impressum", async ({ page }) => {
    await page.goto("/");
    await page.locator("footer").getByRole("link", { name: /Impressum/i }).click();
    await expect(page).toHaveURL(/\/impressum$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /Impressum/i }),
    ).toBeVisible();
  });

  test("footer Datenschutz link navigates to /datenschutz", async ({ page }) => {
    await page.goto("/");
    await page
      .locator("footer")
      .getByRole("link", { name: /Datenschutz/i })
      .click();
    await expect(page).toHaveURL(/\/datenschutz$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /Datenschutz/i }),
    ).toBeVisible();
  });
});
