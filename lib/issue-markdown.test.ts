import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildReport } from "./report-core/build-report";
import { normalizeGitHubData } from "./report-core/normalize";
import {
  buildIssueMarkdown,
  buildIssueTitle,
  prefilledIssueUrl,
} from "./issue-markdown";

const FIXTURES = join(process.cwd(), "fixtures");
const read = (f: string) => JSON.parse(readFileSync(join(FIXTURES, f), "utf8"));

const report = buildReport({
  scorecard: read("scorecard-snakeoil.json"),
  github: normalizeGitHubData(
    read("github-repo-snakeoil.json"),
    read("github-community-snakeoil.json"),
  ),
  generatedAt: "2026-07-01T00:00:00.000Z",
});

describe("buildIssueMarkdown", () => {
  const md = buildIssueMarkdown(report);

  it("carries the required 'via TrustScope' attribution footer", () => {
    expect(md).toMatch(/Assessed via TrustScope/);
    expect(md).toMatch(/trust report by Neckarshore AI/);
  });

  it("frames the suggestions as optional, not demands", () => {
    expect(md).toMatch(/not demands/i);
    expect(md.toLowerCase()).toMatch(/optional|none of these are required/);
  });

  it("includes at least one real fix from the report", () => {
    const anyFix = report.pillars.flatMap((p) => p.fixes)[0];
    expect(anyFix).toBeDefined();
    expect(md).toContain(anyFix.text);
  });

  it("groups by pillar title", () => {
    const scoredWithFixes = report.pillars.filter((p) => p.fixes.length > 0);
    for (const p of scoredWithFixes) {
      expect(md).toContain(`### ${p.title}`);
    }
  });
});

describe("buildIssueTitle", () => {
  it("names the product", () => {
    expect(buildIssueTitle(report)).toMatch(/TrustScope/);
  });
});

describe("prefilledIssueUrl", () => {
  const url = prefilledIssueUrl(report);
  it("points at the repo's new-issue endpoint", () => {
    expect(url).toContain(
      `https://github.com/${report.repo.owner}/${report.repo.name}/issues/new`,
    );
  });
  it("URL-encodes title and body params", () => {
    expect(url).toMatch(/[?&]title=/);
    expect(url).toMatch(/[?&]body=/);
    // spaces must be encoded, not raw
    expect(url).not.toMatch(/title=[^&]* [^&]*/);
  });
});
