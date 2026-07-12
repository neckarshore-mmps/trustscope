import { test, expect } from "@playwright/test";

/**
 * Group B (Launch-Readiness virality + distribution). Fixture report `fixture-org/fixture-repo`
 * is seeded into the store by global-setup, so the OG route resolves a cached report and the
 * per-pillar scores render (not just the label-only fallback).
 */

const FIXTURE = "fixture-org/fixture-repo";
const REPORT = `/report?repo=${encodeURIComponent(FIXTURE)}`;

test.describe("B1 — per-report OG card", () => {
  test("report page points og:image + twitter:image at the per-report card", async ({ page }) => {
    await page.goto(REPORT);
    const og = await page.locator('meta[property="og:image"]').getAttribute("content");
    const tw = await page.locator('meta[name="twitter:image"]').getAttribute("content");
    expect(og).toContain("/report/og?repo=");
    expect(og).toContain(encodeURIComponent(FIXTURE));
    expect(tw).toContain("/report/og?repo=");
    expect(await page.locator('meta[name="twitter:card"]').getAttribute("content")).toBe(
      "summary_large_image",
    );
  });

  test("the OG route returns a real PNG", async ({ request }) => {
    const res = await request.get(`/report/og?repo=${encodeURIComponent(FIXTURE)}`);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
    expect((await res.body()).byteLength).toBeGreaterThan(5000);
  });
});

test.describe("B2 — share affordance", () => {
  test("report page shows copy-permalink + social share controls", async ({ page }) => {
    await page.goto(REPORT);
    const share = page.getByRole("region", { name: /Share this report/i });
    await expect(share.getByRole("button", { name: /Copy link/i })).toBeVisible();
    await expect(share.getByRole("link", { name: /Share on X/i })).toBeVisible();
    await expect(share.getByRole("link", { name: /Share on LinkedIn/i })).toBeVisible();
  });
});

test.describe("B3 — sibling cross-link block", () => {
  const PAGES = ["/", "/about"];
  for (const path of PAGES) {
    test(`footer shows the Read/Maintain/Trust tooling cluster on ${path}`, async ({ page }) => {
      await page.goto(path);
      const nav = page.getByRole("navigation", { name: /More Neckarshore tooling/i });
      await expect(nav.getByRole("link", { name: /md-viewer/i })).toBeVisible();
      await expect(nav.getByRole("link", { name: /Vault Autopilot/i })).toBeVisible();
      await expect(
        nav.getByRole("link", { name: /md-viewer/i }),
      ).toHaveAttribute("href", "https://md.neckarshore.ai");
    });
  }
});

test.describe("B4 — README trust badge", () => {
  test("badge endpoint returns a label-only SVG", async ({ request }) => {
    const res = await request.get("/badge");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/svg+xml");
    const svg = await res.text();
    expect(svg).toContain("trust report");
    // no digit in the visible <text> (no aggregate score by design)
    const visible = [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]).join(" ");
    expect(/\d/.test(visible)).toBe(false);
  });

  test("report page offers the copy-this-to-your-README snippet", async ({ page }) => {
    await page.goto(REPORT);
    await expect(
      page.getByRole("heading", { name: /Add the badge to your README/i }),
    ).toBeVisible();
    await expect(page.getByText("https://trustscope.neckarshore.ai/badge")).toBeVisible();
  });
});

test.describe("B5 — robots.txt", () => {
  test("robots.txt returns 200 with a sitemap reference", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("Sitemap: https://trustscope.neckarshore.ai/sitemap.xml");
    expect(body).toMatch(/User-Agent:\s*\*/i);
  });
});
