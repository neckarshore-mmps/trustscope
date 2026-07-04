import { test, expect, type Page } from "@playwright/test";

const RECENT_KEY = "trustscope:recent-repos";

/**
 * Open the combobox via ArrowDown, retrying until aria-expanded=true. A plain
 * .click() is unreliable here: the input is autoFocus'd on load, so a click on
 * the already-focused input fires no new focus event and onFocus never opens the
 * list. ArrowDown always opens through onKeyDown regardless of focus state; the
 * toPass retry rides out client hydration (handlers not yet attached).
 */
async function openCombobox(page: Page) {
  const combobox = page.getByRole("combobox");
  await expect(async () => {
    await combobox.press("ArrowDown");
    await expect(combobox).toHaveAttribute("aria-expanded", "true", { timeout: 1000 });
  }).toPass({ timeout: 10000 });
  return combobox;
}

test("combobox shows pinned trustscope and filters incrementally", async ({ page }) => {
  await page.goto("/");
  const combobox = await openCombobox(page);
  const listbox = page.getByRole("listbox");
  await expect(listbox.getByRole("option").first()).toContainText("neckarshore-mmps/trustscope");
  await combobox.fill("got");
  await expect(listbox.getByRole("option")).toHaveCount(1);
  await expect(listbox.getByRole("option")).toContainText("sindresorhus/got");
});

test("free entry of a non-listed repo still navigates", async ({ page }) => {
  await page.goto("/");
  // Open first to guarantee the client component is hydrated — otherwise the
  // Assess click can trigger a native form submit instead of router.push.
  const combobox = await openCombobox(page);
  await combobox.fill("fixture-org/fixture-repo");
  await page.getByRole("button", { name: "Assess" }).click();
  await expect(page).toHaveURL(/repo=fixture-org%2Ffixture-repo/);
  await expect(
    page.getByRole("heading", { level: 1, name: /fixture-org\/fixture-repo/ }),
  ).toBeVisible();
});

test("viewing a report adds it to the Recently-Viewed strip; Clear empties it", async ({ page }) => {
  await page.goto("/report?repo=fixture-org/fixture-repo");
  await expect(
    page.getByRole("heading", { level: 1, name: /fixture-org\/fixture-repo/ }),
  ).toBeVisible();
  // RecordView writes in a mount effect — wait for the store before navigating away (flake guard).
  await page.waitForFunction((k) => window.localStorage.getItem(k) !== null, RECENT_KEY);
  await page.goto("/");
  const strip = page.getByText("Recently viewed");
  await expect(strip).toBeVisible();
  await expect(page.getByRole("link", { name: /fixture-org\/fixture-repo/ })).toBeVisible();
  await page.getByRole("button", { name: "Clear" }).click();
  await expect(strip).toHaveCount(0);
});

test("a recent repo appears as a combobox suggestion and navigates on select", async ({ page }) => {
  await page.addInitScript(([k]) => {
    window.localStorage.setItem(
      k,
      JSON.stringify([{ owner: "fixture-org", repo: "fixture-repo", viewedAt: "2026-07-03T00:00:00Z" }]),
    );
  }, [RECENT_KEY]);
  await page.goto("/");
  await openCombobox(page);
  await page.getByRole("option", { name: /fixture-org\/fixture-repo/ }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: /fixture-org\/fixture-repo/ }),
  ).toBeVisible();
});

test("keyboard: ArrowDown tracks aria-activedescendant; Enter navigates, Escape closes", async ({
  page,
}) => {
  // Seed the offline fixture as a recent so a filtered ArrowDown lands on an offline target.
  await page.addInitScript(([k]) => {
    window.localStorage.setItem(
      k,
      JSON.stringify([{ owner: "fixture-org", repo: "fixture-repo", viewedAt: "2026-07-03T00:00:00Z" }]),
    );
  }, [RECENT_KEY]);
  await page.goto("/");
  const combobox = await openCombobox(page);
  await combobox.fill("fixture"); // filters to the single offline option
  await combobox.press("ArrowDown");

  const listbox = page.getByRole("listbox");
  const activeOption = listbox.getByRole("option", { selected: true });
  const optionId = await activeOption.getAttribute("id");
  expect(optionId).toBeTruthy();
  await expect(combobox).toHaveAttribute("aria-activedescendant", optionId!);

  // Escape closes the listbox.
  await combobox.press("Escape");
  await expect(listbox).toHaveCount(0);

  // Reopen and Enter navigates to the highlighted (offline) fixture.
  await combobox.fill("fixture");
  await combobox.press("ArrowDown");
  await combobox.press("Enter");
  await expect(page).toHaveURL(/repo=fixture-org%2Ffixture-repo/);
  await expect(
    page.getByRole("heading", { level: 1, name: /fixture-org\/fixture-repo/ }),
  ).toBeVisible();
});
