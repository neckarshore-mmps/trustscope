import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildReport } from "./report-core/build-report";
import { normalizeGitHubData } from "./report-core/normalize";
import { isCleanReport, orderedPillars, reportCoverage, reportSynthesis } from "./report-summary";

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
  it("never mentions functional quality — it is Pro-only, dropped from the non-Pro synthesis", () => {
    expect(reportSynthesis(report).toLowerCase()).not.toContain("functional quality");
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

describe("orderedPillars", () => {
  it("never opens with the not-assessed functional-quality pillar (#314)", () => {
    const ordered = orderedPillars(report.pillars);
    expect(ordered[0].key).not.toBe("functional-quality");
    expect(ordered[0].status).toBe("scored");
  });
  it("places every scored pillar before any not-assessed pillar", () => {
    const ordered = orderedPillars(report.pillars);
    const lastScored = ordered.reduce((acc, p, i) => (p.status === "scored" ? i : acc), -1);
    const firstTrailed = ordered.findIndex((p) => p.status !== "scored");
    if (firstTrailed !== -1) expect(lastScored).toBeLessThan(firstTrailed);
  });
  it("preserves every pillar — no drop, no duplicate", () => {
    const ordered = orderedPillars(report.pillars);
    expect(ordered.length).toBe(report.pillars.length);
    expect(new Set(ordered.map((p) => p.key)).size).toBe(report.pillars.length);
  });
  it("is stable within each group", () => {
    const ordered = orderedPillars(report.pillars);
    const orderedScored = ordered.filter((p) => p.status === "scored").map((p) => p.key);
    const origScored = report.pillars.filter((p) => p.status === "scored").map((p) => p.key);
    expect(orderedScored).toEqual(origScored);
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
