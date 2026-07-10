import { test, expect } from "@playwright/test";

// Served offline from the seeded fixture (fixture-org/fixture-repo) — see e2e/global-setup.ts (§E).
// The synthesis now lives inside the TL;DR block, which carries the due-diligence signals folded in.
test("shows the TL;DR block with a one-line synthesis", async ({ page }) => {
  await page.goto("/report?repo=fixture-org/fixture-repo");
  await expect(page.getByTestId("report-tldr")).toBeVisible();
  await expect(page.getByTestId("report-synthesis")).toBeVisible();
  await expect(page.getByRole("heading", { name: "TL;DR" })).toBeVisible();
});

// ── Per-pillar Convert-to-issue (L-TS-CONVERT-TO-ISSUE-PER-PILLAR) ──────────────
// OAuth is absent in e2e (no GITHUB_CLIENT_ID) -> the File control is the pre-filled fallback.

test("each pillar with fixes carries a File issue + Copy issue control", async ({ page }) => {
  await page.goto("/report?repo=fixture-org/fixture-repo");

  const file = page.getByTestId("pillar-file-issue").first();
  await expect(file).toBeVisible();
  // pre-filled fallback: a GitHub new-issue link, not a one-click POST button
  await expect(file).toHaveAttribute("href", /github\.com\/.+\/issues\/new/);

  await expect(page.getByTestId("pillar-copy-issue").first()).toBeVisible();
});

test("the retired bulk 'Send the suggestions upstream' section is gone", async ({ page }) => {
  await page.goto("/report?repo=fixture-org/fixture-repo");
  await expect(
    page.getByRole("heading", { name: "Send the suggestions upstream" }),
  ).toHaveCount(0);
});

test("the filing hint stays collapsed until asked, then explains the doctrine", async ({ page }) => {
  await page.goto("/report?repo=fixture-org/fixture-repo");
  const hint = page.getByTestId("pillar-filing-hint").first();

  await expect(hint).toHaveJSProperty("open", false);
  await hint.getByText("How does filing work?").click();
  await expect(hint).toHaveJSProperty("open", true);
  await expect(hint.getByText(/via TrustScope/)).toBeVisible();
});
