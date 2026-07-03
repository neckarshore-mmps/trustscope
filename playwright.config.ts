import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright e2e config — the repo's first browser-level gate (legal pages, work-order:
 * Impressum/Datenschutz). Unit logic stays in Vitest; Playwright only covers what needs a
 * real server + navigation (HTTP status, rendered sections, clickable footer links).
 *
 * The dev server is reused locally for a fast RED/GREEN loop and started fresh in CI.
 * e2e specs live in `e2e/` and are excluded from Vitest (see vitest.config.ts).
 */
const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // Seed the offline fixture report (fixture-org/fixture-repo) into the FileReportStore before any
  // spec runs, so the report-page e2e are deterministic and token-free (V2 amendment §E).
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
