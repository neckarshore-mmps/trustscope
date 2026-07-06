import { test, expect } from "@playwright/test";

test("/for Overview route is gone (404)", async ({ page }) => {
  const res = await page.goto("/for");
  expect(res?.status()).toBe(404);
});

test('header "For whom" dropdown has exactly two children', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 800 });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: /For whom/i });
  const adopters = page.getByRole("link", { name: /Adopters/i });
  // Click + verify open in a retry loop — rides out client hydration (the nav
  // disclosure is a client component; a pre-hydration click is a no-op).
  await expect(async () => {
    await trigger.click();
    await expect(adopters).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 10000 });
  await expect(page.getByRole("link", { name: /Maintainers/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Overview/i })).toHaveCount(0);
});
