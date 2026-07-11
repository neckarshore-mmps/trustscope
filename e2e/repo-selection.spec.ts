import { test, expect, type Page } from "@playwright/test";

const RECENT_KEY = "trustscope:recent-repos";

/**
 * Ensure the combobox is open and hydrated, then return it. On the autoFocus'd
 * landing the list is now open by default (server-rendered), but ArrowDown is
 * still the robust opener: it works regardless of focus state and the toPass
 * retry rides out client hydration (handlers not yet attached).
 */
async function openCombobox(page: Page) {
  const combobox = page.getByRole("combobox");
  await expect(async () => {
    await combobox.press("ArrowDown");
    await expect(combobox).toHaveAttribute("aria-expanded", "true", { timeout: 1000 });
  }).toPass({ timeout: 10000 });
  return combobox;
}

test("default suggestions are server-rendered and visible on load (no interaction)", async ({
  page,
}) => {
  // Bug #1: the default list must be present in the initial HTML, not gated behind
  // client hydration + a second focus event. Assert it in the raw server response…
  const html = await (await page.request.get("/")).text();
  expect(html).toContain('role="listbox"');
  expect(html).toContain("neckarshore-mmps/trustscope");
  // …and visible on load without any click/keypress.
  await page.goto("/");
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(page.getByRole("option").first()).toContainText("neckarshore-mmps/trustscope");
});

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
  // the report-button click can trigger a native form submit instead of router.push.
  const combobox = await openCombobox(page);
  await combobox.fill("fixture-org/fixture-repo");
  await page.getByRole("button", { name: "Run the report" }).click();
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
  // The input autofocuses and opens the suggestion dropdown, which floats over the
  // Recently-viewed strip below. Dismiss it (as a user would) so its options don't
  // intercept the click on the strip's Clear button.
  await page.keyboard.press("Escape");
  const strip = page.getByText("Recently viewed");
  await expect(strip).toBeVisible();
  await expect(page.getByRole("link", { name: /fixture-org\/fixture-repo/ })).toBeVisible();
  await page.getByRole("button", { name: "Clear" }).click();
  await expect(strip).toHaveCount(0);
});

test("selecting a suggestion fills the input; it does NOT start the report", async ({ page }) => {
  // Bug #2: choosing from the list must populate the input, not auto-navigate.
  await page.addInitScript(([k]) => {
    window.localStorage.setItem(
      k,
      JSON.stringify([{ owner: "fixture-org", repo: "fixture-repo", viewedAt: "2026-07-03T00:00:00Z" }]),
    );
  }, [RECENT_KEY]);
  await page.goto("/");
  const combobox = await openCombobox(page);
  await page.getByRole("option", { name: /fixture-org\/fixture-repo/ }).click();

  // Input filled, list closed, still on the landing — no report started.
  await expect(combobox).toHaveValue("fixture-org/fixture-repo");
  await expect(page).not.toHaveURL(/\/report/);
  await expect(page.getByRole("listbox")).toHaveCount(0);

  // Only the explicit Run-the-report click starts the report.
  await page.getByRole("button", { name: "Run the report" }).click();
  await expect(page).toHaveURL(/repo=fixture-org%2Ffixture-repo/);
  await expect(
    page.getByRole("heading", { level: 1, name: /fixture-org\/fixture-repo/ }),
  ).toBeVisible();
});

test("clicking Run-the-report while an option is highlighted still starts the report", async ({ page }) => {
  // The explicit report button must submit even when a suggestion is highlighted
  // (hover / ArrowDown set `active`) — it must never silently fill instead of navigate.
  await page.addInitScript(([k]) => {
    window.localStorage.setItem(
      k,
      JSON.stringify([{ owner: "fixture-org", repo: "fixture-repo", viewedAt: "2026-07-03T00:00:00Z" }]),
    );
  }, [RECENT_KEY]);
  await page.goto("/");
  const combobox = await openCombobox(page);
  await combobox.fill("fixture-org/fixture-repo");
  await combobox.press("ArrowDown"); // highlights the matching option (active >= 0)
  await page.getByRole("button", { name: "Run the report" }).click();
  await expect(page).toHaveURL(/repo=fixture-org%2Ffixture-repo/);
  await expect(
    page.getByRole("heading", { level: 1, name: /fixture-org\/fixture-repo/ }),
  ).toBeVisible();
});

test("keyboard: ArrowDown tracks aria-activedescendant; Enter selects then submits, Escape closes", async ({
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

  // Reopen: Enter on the highlighted option SELECTS it (fills the input, closes
  // the list) — it does not start the report (Bug #2 applies to keyboard too).
  await combobox.fill("fixture");
  await combobox.press("ArrowDown");
  await combobox.press("Enter");
  await expect(combobox).toHaveValue("fixture-org/fixture-repo");
  await expect(page).not.toHaveURL(/\/report/);
  await expect(listbox).toHaveCount(0);

  // A second Enter (nothing highlighted) submits the filled value → navigates.
  await combobox.press("Enter");
  await expect(page).toHaveURL(/repo=fixture-org%2Ffixture-repo/);
  await expect(
    page.getByRole("heading", { level: 1, name: /fixture-org\/fixture-repo/ }),
  ).toBeVisible();
});
