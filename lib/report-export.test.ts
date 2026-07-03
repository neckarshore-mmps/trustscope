import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildReport } from "./report-core/build-report";
import { normalizeGitHubData } from "./report-core/normalize";
import { reportSynthesis } from "./report-summary";
import { reportToMarkdown, reportToHtml, exportFilename } from "./report-export";

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

describe("reportToHtml", () => {
  const html = reportToHtml(report);

  it("is a complete standalone document", () => {
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("</html>");
    expect(html).toContain(
      `<title>Trust report — ${report.repo.owner}/${report.repo.name}</title>`,
    );
  });
  it("escapes HTML-significant characters in content", () => {
    expect(reportToHtml({ ...report, product: "A<b>&c" })).toContain("A&lt;b&gt;&amp;c");
  });
  it("renders all four pillars (titles HTML-escaped) and never links an external asset", () => {
    // Pillar titles contain "&" (e.g. "Security & Supply Chain") — the serializer escapes all
    // content, so the rendered heading carries the escaped form.
    const esc = (s: string) =>
      s.replace(
        /[&<>"]/g,
        (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[m] as string,
      );
    for (const p of report.pillars) expect(html).toContain(`Pillar ${p.id} — ${esc(p.title)}`);
    expect(html).not.toMatch(/<(script|link)\b[^>]*\bsrc=|<link\b[^>]*\bhref=/i);
  });
  it("includes the synthesis + due-diligence sections (§B)", () => {
    expect(html).toContain("In short");
    expect(html).toContain(reportSynthesis(report));
    expect(html).toContain("Due diligence");
  });
  it("is deterministic", () => {
    expect(reportToHtml(report)).toBe(html);
  });
});

describe("exportFilename", () => {
  it("slugifies owner-name and appends the extension", () => {
    expect(exportFilename(report, "md")).toMatch(/^[a-z0-9._-]+-trustscope\.md$/);
    expect(exportFilename(report, "html")).toMatch(/^[a-z0-9._-]+-trustscope\.html$/);
  });
});
