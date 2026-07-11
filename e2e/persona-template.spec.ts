import { test, expect } from "@playwright/test";

const CASES = [
  {
    path: "/for/adopters",
    heading: "Before you depend on a project, know how far to trust it.",
    first: "What does TrustScope do for adopters?",
    crossLink: /TrustScope for maintainers/i,
  },
  {
    path: "/for/maintainers",
    heading: "Before you publish, see your project the way evaluators will.",
    first: "What does TrustScope do for maintainers?",
    crossLink: /TrustScope for adopters/i,
  },
] as const;

for (const { path, heading, first, crossLink } of CASES) {
  test(`${path} renders the template + persona FAQ`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(page.getByRole("combobox")).toBeVisible(); // repo picker in the hero
    await expect(page.getByRole("heading", { name: "Community & Sustainability" })).toBeVisible(); // pillars grid (3 free pillars)
    // Functional Quality (Pillar 4) is Pro-only — never rendered on the free persona pages.
    await expect(page.getByRole("heading", { name: "Functional Quality" })).toHaveCount(0);
    await expect(page.getByText("Adopt", { exact: true })).toBeVisible(); // verdict light
    await expect(page.getByText(first)).toBeVisible(); // persona FAQ
    await expect(page.locator("details")).not.toHaveCount(0);
    await expect(page.getByRole("link", { name: crossLink })).toBeVisible(); // cross-link to the other persona
  });
}
