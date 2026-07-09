import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { generateReport } from "./generate-report";

/**
 * §6 — `generateReport()` is the single prod orchestrator (repo-ref -> ReportModel) and was imported
 * by no test. This drives it end-to-end offline: a routed fetch serves the Scorecard fast-path, the
 * GitHub /repos + /community/profile calls, and the package.json manifest; no network, no subprocess.
 */

const FIXTURES = join(process.cwd(), "fixtures");
const read = (f: string) => JSON.parse(readFileSync(join(FIXTURES, f), "utf8"));

/** Route every outbound URL the orchestrator touches to a fixture response. */
function routedFetch(): typeof fetch {
  const scorecard = read("scorecard-ossf.json");
  const repoJson = read("github-repo-ossf.json");
  const communityJson = read("github-community-ossf.json");
  const pkg = { scripts: { build: "tsc" } };
  const manifestBody = {
    content: Buffer.from(JSON.stringify(pkg), "utf8").toString("base64"),
  };

  return vi.fn(async (url: string) => {
    const u = String(url);
    const body = u.includes("securityscorecards.dev")
      ? scorecard
      : u.endsWith("/community/profile")
        ? communityJson
        : u.endsWith("/contents/package.json")
          ? manifestBody
          : repoJson;
    return { status: 200, ok: true, json: async () => body };
  }) as unknown as typeof fetch;
}

describe("generateReport (orchestrator)", () => {
  it("assembles a well-formed ReportModel from the Scorecard + GitHub + manifest sources", async () => {
    const { report, scorecardSource } = await generateReport("ossf", "scorecard", {
      runner: "fastpath", // fast-path only — no docker/binary spawn
      fetchFn: routedFetch(),
      generatedAt: "2026-07-01T00:00:00.000Z",
    });

    expect(scorecardSource).toBe("fastpath");
    expect(report.repo.owner).toBe("ossf");
    expect(report.repo.name).toBe("scorecard");
    expect(report.pillars).toHaveLength(4);
    expect(report.pillars.map((p) => p.id)).toEqual([1, 2, 3, 4]);
    expect(report.aggregateScore).toBeNull(); // framework doctrine — no single score
    expect(report.generatedAt).toBe("2026-07-01T00:00:00.000Z");
  });

  it("is deterministic — same inputs produce the same report", async () => {
    const opts = {
      runner: "fastpath" as const,
      fetchFn: routedFetch(),
      generatedAt: "2026-07-01T00:00:00.000Z",
    };
    const a = await generateReport("ossf", "scorecard", opts);
    const b = await generateReport("ossf", "scorecard", { ...opts, fetchFn: routedFetch() });
    expect(a.report).toEqual(b.report);
  });

  it("propagates a repo-not-found failure from the GitHub source", async () => {
    const fetchFn = vi.fn(async (url: string) => {
      const u = String(url);
      if (u.includes("securityscorecards.dev")) {
        return { status: 200, ok: true, json: async () => read("scorecard-ossf.json") };
      }
      return { status: 404, ok: false, json: async () => ({}) }; // /repos 404
    }) as unknown as typeof fetch;

    await expect(
      generateReport("ghost", "nope", { runner: "fastpath", fetchFn }),
    ).rejects.toThrow(/not found/i);
  });
});
