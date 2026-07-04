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
