import { test, expect } from "@playwright/test";

test("/faq renders an accordion; a closed item expands on click", async ({ page }) => {
  await page.goto("/faq");
  const items = page.locator("details");
  await expect(items).not.toHaveCount(0);
  const second = items.nth(1);
  await expect(second).not.toHaveAttribute("open", "");
  await second.locator("summary").click();
  await expect(second).toHaveAttribute("open", "");
});

test("/faq carries no persona-specific question", async ({ page }) => {
  await page.goto("/faq");
  await expect(page.getByText("What does TrustScope do for adopters?")).toHaveCount(0);
  await expect(page.getByText("What does TrustScope do for maintainers?")).toHaveCount(0);
});
