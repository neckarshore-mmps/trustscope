import { test, expect } from "@playwright/test";

const CASES = [
  {
    path: "/for/adopters",
    heading: "Before you depend on a project, know how far to trust it.",
    first: "What does TrustScope do for adopters?",
  },
  {
    path: "/for/maintainers",
    heading: "Before you publish, see your project the way evaluators will.",
    first: "What does TrustScope do for maintainers?",
  },
] as const;

for (const { path, heading, first } of CASES) {
  test(`${path} renders the template + persona FAQ`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(page.getByRole("combobox")).toBeVisible(); // repo picker in the hero
    await expect(page.getByRole("heading", { name: "Functional Quality" })).toBeVisible(); // pillars grid
    await expect(page.getByText("Adopt", { exact: true })).toBeVisible(); // verdict light
    await expect(page.getByText(first)).toBeVisible(); // persona FAQ
    await expect(page.locator("details")).not.toHaveCount(0);
  });
}
