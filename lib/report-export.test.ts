import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildReport } from "./report-core/build-report";
import { normalizeGitHubData } from "./report-core/normalize";
import { reportSynthesis } from "./report-summary";
import { reportToMarkdown, exportFilename } from "./report-export";

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

describe("reportToMarkdown", () => {
  const md = reportToMarkdown(report);

  it("has an H1 with owner/name", () => {
    expect(md).toContain(`# Trust report — ${report.repo.owner}/${report.repo.name}`);
  });
  it("surfaces the aggregate note but never an aggregate score", () => {
    expect(md).toContain(report.aggregateNote);
    expect(md).not.toMatch(/aggregate score:\s*\d/i);
  });
  it("renders all four pillars by title", () => {
    for (const p of report.pillars) expect(md).toContain(`## Pillar ${p.id} — ${p.title}`);
  });
  it("includes the synthesis sentence (§B)", () => {
    expect(md).toContain(reportSynthesis(report));
  });
  it("includes a due-diligence section with the fired signals (§B)", () => {
    expect(report.dueDiligence.length).toBeGreaterThan(0);
    expect(md).toContain("## Due diligence");
    for (const s of report.dueDiligence) expect(md).toContain(s.title);
  });
  it("is deterministic — same input, same output", () => {
    expect(reportToMarkdown(report)).toBe(md);
  });
});

describe("exportFilename", () => {
  it("slugifies owner-name and appends the extension", () => {
    expect(exportFilename(report, "md")).toMatch(/^[a-z0-9._-]+-trustscope\.md$/);
    expect(exportFilename(report, "html")).toMatch(/^[a-z0-9._-]+-trustscope\.html$/);
  });
});
