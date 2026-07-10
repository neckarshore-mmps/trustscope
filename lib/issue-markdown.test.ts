import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildReport } from "./report-core/build-report";
import { normalizeGitHubData } from "./report-core/normalize";
import {
  buildPillarIssueMarkdown,
  buildPillarIssueTitle,
  prefilledPillarIssueUrl,
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

const withFixes = report.pillars.filter((p) => p.fixes.length > 0);
const target = withFixes[0];

describe("fixture precondition", () => {
  it("has at least two pillars with fixes (so scoping is testable)", () => {
    expect(withFixes.length).toBeGreaterThanOrEqual(2);
  });
});

describe("buildPillarIssueMarkdown", () => {
  const md = buildPillarIssueMarkdown(report, target);

  it("includes the target pillar's section heading and every one of its fixes", () => {
    expect(md).toContain(`### ${target.title}`);
    for (const fix of target.fixes) {
      expect(md).toContain(fix.text);
    }
  });

  it("is scoped to ONE pillar — no other pillar's section leaks in", () => {
    for (const other of report.pillars) {
      if (other.key === target.key) continue;
      expect(md).not.toContain(`### ${other.title}`);
    }
  });

  it("carries the required 'via TrustScope' attribution footer", () => {
    expect(md).toMatch(/Assessed via TrustScope/);
    expect(md).toMatch(/trust report by Neckarshore AI/);
  });

  it("frames the suggestions as optional, not demands", () => {
    expect(md).toMatch(/not demands/i);
    expect(md.toLowerCase()).toMatch(/optional|none of these are required/);
  });

  it("is deterministic (same input -> byte-identical output)", () => {
    expect(buildPillarIssueMarkdown(report, target)).toBe(md);
  });
});

describe("buildPillarIssueTitle", () => {
  const title = buildPillarIssueTitle(report, target);
  it("names the product", () => {
    expect(title).toMatch(/TrustScope/);
  });
  it("names the specific pillar", () => {
    expect(title).toContain(target.title);
  });
  it("names the repo", () => {
    expect(title).toContain(report.repo.name);
  });
});

describe("prefilledPillarIssueUrl", () => {
  const url = prefilledPillarIssueUrl(report, target);

  it("points at the repo's new-issue endpoint", () => {
    expect(url).toContain(
      `https://github.com/${report.repo.owner}/${report.repo.name}/issues/new`,
    );
  });

  it("URL-encodes title and body params (no raw spaces)", () => {
    expect(url).toMatch(/[?&]title=/);
    expect(url).toMatch(/[?&]body=/);
    expect(url).not.toMatch(/title=[^&]* [^&]*/);
  });

  it("carries the per-pillar body in the body param", () => {
    const body = new URL(url).searchParams.get("body") ?? "";
    expect(body).toContain(`### ${target.title}`);
  });
});
