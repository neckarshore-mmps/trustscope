import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parsePublicChangelog } from "./changelog";

const SAMPLE = `# Changelog

## [Unreleased]

### Changed

- dev-facing note that must NOT leak into the public view.

## [baseline] — 2026-07-10

- **A dev milestone.** ([#57](https://example.com/57))

## [public]

<!-- a comment the parser must ignore -->

### v0.2.0 — 2026-08-01

- Newest feature highlight.
- Small stuff bundled into one line.

### v0.1.0 — 2026-07-06

- First public feature.
`;

describe("parsePublicChangelog", () => {
  it("parses only the [public] section, newest first", () => {
    const entries = parsePublicChangelog(SAMPLE);
    expect(entries.map((e) => e.version)).toEqual(["0.2.0", "0.1.0"]);
    expect(entries[0]).toEqual({
      version: "0.2.0",
      date: "2026-08-01",
      changes: ["Newest feature highlight.", "Small stuff bundled into one line."],
    });
  });

  it("does not leak bullets from [Unreleased] or [baseline]", () => {
    const all = parsePublicChangelog(SAMPLE).flatMap((e) => e.changes);
    expect(all.join(" ")).not.toContain("dev-facing note");
    expect(all.join(" ")).not.toContain("A dev milestone");
  });

  it("ignores HTML comments inside the section", () => {
    const all = parsePublicChangelog(SAMPLE).flatMap((e) => e.changes);
    expect(all.some((c) => c.includes("<!--"))).toBe(false);
  });

  it("throws when the [public] section is missing", () => {
    expect(() => parsePublicChangelog("# Changelog\n\n## [Unreleased]\n")).toThrow(/\[public\]/);
  });

  it("throws when [public] has no version entries", () => {
    expect(() => parsePublicChangelog("## [public]\n\nno entries here\n")).toThrow(/no `### v/);
  });

  it("throws when a public entry has no bullets", () => {
    expect(() => parsePublicChangelog("## [public]\n\n### v0.1.0 — 2026-07-06\n")).toThrow(
      /no bullet points/,
    );
  });

  it("parses the real CHANGELOG.md and exposes the launch entry", () => {
    const md = readFileSync(join(process.cwd(), "CHANGELOG.md"), "utf8");
    const entries = parsePublicChangelog(md);
    expect(entries.length).toBeGreaterThanOrEqual(1);
    const launch = entries.find((e) => e.version === "0.1.0");
    expect(launch).toBeDefined();
    expect(launch!.date).toBe("2026-07-06");
    expect(launch!.changes.length).toBeGreaterThanOrEqual(3);
    // No dev-changelog artifacts leaked into the public view.
    for (const c of launch!.changes) {
      expect(c).not.toMatch(/\(\[#\d+\]/); // no PR links
      expect(c).not.toContain("**"); // no markdown emphasis
    }
  });
});
