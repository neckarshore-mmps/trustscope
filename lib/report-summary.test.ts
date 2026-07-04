import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildReport } from "./report-core/build-report";
import { normalizeGitHubData } from "./report-core/normalize";
import { isCleanReport, reportCoverage, reportSynthesis } from "./report-summary";

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

describe("reportSynthesis", () => {
  it("returns one capitalized sentence, no digits (no aggregate score)", () => {
    const s = reportSynthesis(report);
    expect(s.length).toBeGreaterThan(0);
    expect(s[0]).toBe(s[0].toUpperCase());
    expect(s.trim().endsWith(".")).toBe(true);
    expect(s).not.toMatch(/\d/);
  });
  it("names the not-assessed functional-quality pillar honestly", () => {
    expect(reportSynthesis(report).toLowerCase()).toContain("functional quality isn't assessed");
  });
  it("is deterministic", () => {
    expect(reportSynthesis(report)).toBe(reportSynthesis(report));
  });
});

describe("reportCoverage", () => {
  const cov = reportCoverage(report);
  it("puts functional-quality under notAssessed and scored pillars under assessed", () => {
    expect(cov.notAssessed).toContain("Functional Quality");
    expect(cov.assessed.length + cov.notAssessed.length).toBe(4);
  });
  it("lists inconclusive findings by label", () => {
    expect(Array.isArray(cov.inconclusive)).toBe(true);
  });
});

describe("isCleanReport", () => {
  it("is false when any finding is fail or warn", () => {
    const dirty = {
      ...report,
      pillars: report.pillars.map((p, i) =>
        i === 1
          ? {
              ...p,
              findings: [
                {
                  check: "x",
                  label: "X",
                  status: "fail" as const,
                  score: 0,
                  reason: "r",
                  source: "scorecard" as const,
                },
              ],
            }
          : p,
      ),
    };
    expect(isCleanReport(dirty as unknown as typeof report)).toBe(false);
  });
  it("is true when no finding is fail or warn", () => {
    const clean = {
      ...report,
      pillars: report.pillars.map((p) => ({ ...p, findings: [] })),
    };
    expect(isCleanReport(clean as unknown as typeof report)).toBe(true);
  });
});
