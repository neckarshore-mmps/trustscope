import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildReport } from "../lib/report-core/build-report";
import { normalizeGitHubData } from "../lib/report-core/normalize";
import { FileReportStore } from "../lib/store/file-store";
import type { StoredReport } from "../lib/store/types";

/**
 * Playwright global setup (V2 amendment §E): seed ONE deterministic report for
 * `fixture-org/fixture-repo` into the FileReportStore, so every V2 report-page e2e serves it from
 * cache — offline, no GITHUB token, no live `ossf/scorecard` run.
 *
 * The file store bridges this (Playwright runner) process and the `npm run dev` webServer process:
 * both resolve the SAME dir (repo-root `.trustscope-cache`, gitignored) and the server reads it
 * fresh per request. `fetchedAt` is stamped at setup time so the report stays inside
 * `resolveReport`'s 24h `CACHE_TTL_MS` window; `generatedAt` stays fixed so the report body is
 * byte-for-byte deterministic.
 */

const FIXTURES = join(process.cwd(), "fixtures");
const read = (f: string) => JSON.parse(readFileSync(join(FIXTURES, f), "utf8"));

// Kept in step with getReportStore(): default dir, resolved from the repo root (cwd).
const STORE_DIR = process.env.REPORT_STORE_DIR ?? ".trustscope-cache";
const FIXTURE_OWNER = "fixture-org";
const FIXTURE_REPO = "fixture-repo";

export default async function globalSetup(): Promise<void> {
  const built = buildReport({
    scorecard: read("scorecard-snakeoil.json"),
    github: normalizeGitHubData(
      read("github-repo-snakeoil.json"),
      read("github-community-snakeoil.json"),
    ),
    generatedAt: "2026-07-01T00:00:00.000Z",
    manifest: { installHooks: ["postinstall"] },
  });

  // Make the stored report self-consistent with the slug it is served under (key + URL + header).
  const report = {
    ...built,
    repo: {
      owner: FIXTURE_OWNER,
      name: FIXTURE_REPO,
      url: `https://github.com/${FIXTURE_OWNER}/${FIXTURE_REPO}`,
      commit: built.repo.commit,
    },
  };

  const stored: StoredReport = {
    key: {
      owner: FIXTURE_OWNER,
      repo: FIXTURE_REPO,
      commit: report.repo.commit ?? "fixture",
    },
    report,
    scorecardSource: "fastpath",
    fetchedAt: new Date().toISOString(),
  };

  await new FileReportStore(STORE_DIR).put(stored);
}
