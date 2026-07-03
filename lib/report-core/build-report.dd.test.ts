import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildReport } from "./build-report";
import { normalizeGitHubData } from "./normalize";

const FIXTURES = join(process.cwd(), "fixtures");
const read = (f: string) => JSON.parse(readFileSync(join(FIXTURES, f), "utf8"));

describe("buildReport dueDiligence", () => {
  it("exposes a dueDiligence array on the model", () => {
    const report = buildReport({
      scorecard: read("scorecard-snakeoil.json"),
      github: normalizeGitHubData(
        read("github-repo-snakeoil.json"),
        read("github-community-snakeoil.json"),
      ),
      generatedAt: "2026-07-01T00:00:00.000Z",
    });
    expect(Array.isArray(report.dueDiligence)).toBe(true);
  });
});
