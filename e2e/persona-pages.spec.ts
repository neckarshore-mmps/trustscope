import { test, expect } from "@playwright/test";

test.describe("/for persona hub", () => {
  test("responds 200 and renders the hub heading", async ({ page }) => {
    const res = await page.goto("/for");
    expect(res?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { level: 1, name: /Who is TrustScope for/i }),
    ).toBeVisible();
  });

  test("renders both persona cards, adopter first, each with a CTA + learn-more", async ({
    page,
  }) => {
    await page.goto("/for");
    const headings = page.getByRole("heading", { level: 2 });
    await expect(headings.nth(0)).toContainText(/someone else's code/i); // adopter
    await expect(headings.nth(1)).toContainText(/trust your code/i); // maintainer
    await expect(page.getByRole("link", { name: /Learn more/i })).toHaveCount(2);
    await expect(page.getByRole("link", { name: /Assess a repo/i })).toBeVisible();
  });
});
