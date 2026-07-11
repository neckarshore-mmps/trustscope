import { test, expect } from "@playwright/test";

const toggle = (page: import("@playwright/test").Page) =>
  page.getByRole("button", { name: /Switch to (light|dark) mode/i });

const mode = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.getAttribute("data-mode"));

test.describe("Light/dark mode toggle", () => {
  test("defaults to dark when the system prefers dark", async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: "dark" });
    const page = await ctx.newPage();
    await page.goto("/");
    await expect(toggle(page)).toBeVisible();
    expect(await mode(page)).toBe("dark");
    await ctx.close();
  });

  test("defaults to light when the system prefers light", async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: "light" });
    const page = await ctx.newPage();
    await page.goto("/");
    expect(await mode(page)).toBe("light");
    await ctx.close();
  });

  // Guards the Turbopack collision class: data-mode can read "light" while the
  // :root[data-mode="light"] token block silently fails to apply, leaving a dark
  // background. Assert the actual painted background flips, not just the attribute.
  test("light mode actually paints a light background", async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: "light" });
    const page = await ctx.newPage();
    await page.goto("/");
    const bg = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
    // #f6f7f9 → rgb(246, 247, 249); assert it is a light (near-white) ground.
    const [r, g, b] = bg.match(/\d+/g)!.map(Number);
    expect(r + g + b, `body background was ${bg}, expected light`).toBeGreaterThan(
      600,
    );
    await ctx.close();
  });

  test("clicking the toggle flips the mode", async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: "dark" });
    const page = await ctx.newPage();
    await page.goto("/");
    expect(await mode(page)).toBe("dark");
    await toggle(page).click();
    expect(await mode(page)).toBe("light");
    await toggle(page).click();
    expect(await mode(page)).toBe("dark");
    await ctx.close();
  });

  test("persists the chosen mode across a reload", async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: "dark" });
    const page = await ctx.newPage();
    await page.goto("/");
    await toggle(page).click(); // dark -> light
    expect(await mode(page)).toBe("light");
    await page.reload();
    // Stored choice must win over the (dark) system preference — no flash back.
    expect(await mode(page)).toBe("light");
    await expect(
      page.getByRole("button", { name: /Switch to dark mode/i }),
    ).toBeVisible();
    await ctx.close();
  });
});
