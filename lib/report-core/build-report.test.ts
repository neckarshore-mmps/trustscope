import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildReport } from "./build-report";
import { normalizeGitHubData } from "./normalize";
import { pillarForCheck } from "./pillars";
import type { GitHubData, Pillar, ReportModel, ScorecardResult } from "./types";

const FIXTURES = join(process.cwd(), "fixtures");
const read = (f: string) => JSON.parse(readFileSync(join(FIXTURES, f), "utf8"));

/** Build a report from the captured fixtures for a given repo slug. */
function reportFor(slug: string): ReportModel {
  const scorecard = read(`scorecard-${slug}.json`) as ScorecardResult;
  const github: GitHubData = normalizeGitHubData(
    read(`github-repo-${slug}.json`),
    read(`github-community-${slug}.json`),
  );
  return buildReport({ scorecard, github, generatedAt: "2026-07-01T00:00:00.000Z" });
}

const pillar = (r: ReportModel, id: 1 | 2 | 3 | 4): Pillar =>
  r.pillars.find((p) => p.id === id)!;

describe("buildReport — structure (both fixtures)", () => {
  for (const slug of ["ossf", "snakeoil"]) {
    it(`${slug}: exactly 4 pillars, ids 1-4 in order`, () => {
      const r = reportFor(slug);
      expect(r.pillars).toHaveLength(4);
      expect(r.pillars.map((p) => p.id)).toEqual([1, 2, 3, 4]);
    });

    it(`${slug}: no single aggregate score (framework doctrine)`, () => {
      const r = reportFor(slug);
      expect(r.aggregateScore).toBeNull();
      expect(r.aggregateNote).toMatch(/no single aggregate/i);
    });

    it(`${slug}: Pillar 4 (Functional Quality) is always honestly not-assessed`, () => {
      const p = pillar(reportFor(slug), 4);
      expect(p.key).toBe("functional-quality");
      expect(p.status).toBe("not-assessed");
      expect(p.score).toBeNull();
      expect(p.findings).toHaveLength(0);
      expect(p.framingNote).toMatch(/not scored/i);
    });

    it(`${slug}: report is deterministic (same input -> same output)`, () => {
      expect(reportFor(slug)).toEqual(reportFor(slug));
    });
  }
});

describe("check -> pillar assignment is a partition (no check in two pillars)", () => {
  it("every scorecard check lands in exactly one pillar, none dropped", () => {
    const scorecard = read("scorecard-ossf.json") as ScorecardResult;
    const r = reportFor("ossf");
    const namesInPillars = r.pillars.flatMap((p) =>
      p.findings.filter((f) => f.source === "scorecard").map((f) => f.check),
    );
    // no duplicates
    expect(new Set(namesInPillars).size).toBe(namesInPillars.length);
    // every scorecard check present exactly once
    const scorecardNames = scorecard.checks.map((c) => c.name).sort();
    expect([...namesInPillars].sort()).toEqual(scorecardNames);
  });

  it("License & Security-Policy -> P3; Maintained & Contributors -> P4; else P2", () => {
    expect(pillarForCheck("License")).toBe("trust-governance");
    expect(pillarForCheck("Security-Policy")).toBe("trust-governance");
    expect(pillarForCheck("Maintained")).toBe("community-sustainability");
    expect(pillarForCheck("Contributors")).toBe("community-sustainability");
    expect(pillarForCheck("Token-Permissions")).toBe("security-supply-chain");
    expect(pillarForCheck("Some-Future-Check")).toBe("security-supply-chain");
  });
});

describe("§3: unknown community profile does not fail open into a confident 'no channel'", () => {
  const scorecard = read("scorecard-ossf.json") as ScorecardResult;
  const findContact = (github: GitHubData) =>
    buildReport({ scorecard, github, generatedAt: "2026-07-01T00:00:00.000Z" })
      .pillars.flatMap((p) => p.findings)
      .find((f) => f.check === "Contact-Channel")!;

  it("communityProfileFetched=false -> Contact-Channel is inconclusive, not a fail/warn", () => {
    const github = normalizeGitHubData(read("github-repo-ossf.json"), {}, false);
    const contact = findContact(github);
    expect(contact.status).toBe("inconclusive");
    expect(contact.reason).toMatch(/couldn.t (read|check)|unknown|unavailable|rate.?limit/i);
  });

  it("communityProfileFetched=true with no security file -> still a definite warn/fail (unchanged)", () => {
    const github = normalizeGitHubData(read("github-repo-ossf.json"), {}, true);
    const contact = findContact(github);
    expect(["warn", "fail"]).toContain(contact.status);
  });
});

describe("ossf/scorecard — a strong repo", () => {
  const r = reportFor("ossf");

  it("repo metadata parsed from 'github.com/owner/repo'", () => {
    expect(r.repo.owner).toBe("ossf");
    expect(r.repo.name).toBe("scorecard");
    expect(r.repo.commit).toBeTruthy();
    expect(r.scorecard?.version).toMatch(/^v/);
  });

  it("security pillar scores high", () => {
    const p = pillar(r, 1);
    expect(p.status).toBe("scored");
    expect(p.score).not.toBeNull();
    expect(p.score!).toBeGreaterThan(7);
  });

  it("owner-type finding recognises an organization", () => {
    const owner = pillar(r, 2).findings.find((f) => f.check === "Owner-Type")!;
    expect(owner.status).toBe("pass");
    expect(owner.reason).toMatch(/organization/i);
  });
});

describe("snakeoil-check — a sparse repo (the dogfood, Docker path)", () => {
  const r = reportFor("snakeoil");

  it("security pillar scores low and yields constructive fixes", () => {
    const p = pillar(r, 1);
    expect(p.score!).toBeLessThan(5);
    const fixChecks = p.fixes.map((f) => f.check);
    expect(fixChecks).toContain("Token-Permissions");
    expect(fixChecks).toContain("Pinned-Dependencies");
  });

  it("missing License surfaces in P2 with the §3 fix text", () => {
    const p = pillar(r, 2);
    const license = p.findings.find((f) => f.check === "License")!;
    expect(license.status).toBe("fail");
    const licenseFix = p.fixes.find((f) => f.check === "License")!;
    expect(licenseFix.text).toMatch(/LICENSE.*SPDX/i);
  });

  it("P3 frames low community as a lifecycle stage, not a weakness", () => {
    const p = pillar(r, 3);
    expect(p.framingNote).toMatch(/lifecycle/i);
    expect(p.framingNote).toMatch(/not a (weakness|grade)/i);
  });

  it("recent activity is detected (snakeoil was pushed within 90 days of assessment)", () => {
    const activity = pillar(r, 3).findings.find((f) => f.check === "Recent-Activity")!;
    expect(activity.status).toBe("pass");
  });
});

describe("scoring rules", () => {
  it("inconclusive (-1) checks are excluded from the pillar mean", () => {
    // snakeoil has Packaging=-1 and Signed-Releases=-1 in P2 — must not drag the mean to a
    // negative or count them as zeros.
    const p = pillar(reportFor("snakeoil"), 1);
    const inconclusive = p.findings.filter((f) => f.status === "inconclusive");
    expect(inconclusive.length).toBeGreaterThan(0);
    expect(p.score!).toBeGreaterThanOrEqual(0);
    inconclusive.forEach((f) => expect(f.score).toBeNull());
  });

  it("fixes are only emitted for low (warn/fail) findings, de-duplicated", () => {
    const p = pillar(reportFor("snakeoil"), 1);
    const passFindings = p.findings.filter((f) => f.status === "pass").map((f) => f.check);
    p.fixes.forEach((fix) => expect(passFindings).not.toContain(fix.check));
    expect(new Set(p.fixes.map((f) => f.check)).size).toBe(p.fixes.length);
  });
});
