import { describe, expect, it } from "vitest";
import type { GitHubData } from "./types";
import { detectDueDiligence } from "./due-diligence";

const base: GitHubData = {
  ownerLogin: "acme",
  ownerType: "Organization",
  repoName: "x",
  htmlUrl: "https://github.com/acme/x",
  licenseSpdxId: "MIT",
  pushedAt: "2026-06-20T00:00:00Z",
  archived: false,
  hasIssuesEnabled: true,
  openIssuesCount: 3,
  stargazersCount: 100,
  hasSecurityPolicy: true,
  hasContributing: true,
  hasCodeOfConduct: true,
  healthPercentage: 90,
};
const assessedAt = "2026-07-01T00:00:00Z";

describe("detectDueDiligence", () => {
  it("is empty for a clean, recently-active, licensed repo", () => {
    expect(detectDueDiligence(base, assessedAt)).toEqual([]);
  });
  it("flags a missing license", () => {
    const s = detectDueDiligence({ ...base, licenseSpdxId: null }, assessedAt);
    expect(s.map((x) => x.id)).toContain("no-license");
    expect(s.find((x) => x.id === "no-license")?.mitigation).toBeTruthy();
  });
  it("flags a missing security policy", () => {
    const s = detectDueDiligence({ ...base, hasSecurityPolicy: false }, assessedAt);
    expect(s.map((x) => x.id)).toContain("no-security-contact");
  });
  it("frames the missing security policy as repository-scoped, not absolute (§D)", () => {
    const s = detectDueDiligence({ ...base, hasSecurityPolicy: false }, assessedAt);
    expect(s.find((x) => x.id === "no-security-contact")?.detail).toMatch(
      /no security policy detected on this repository/i,
    );
  });
  it("flags low activity outside the 90-day window", () => {
    const s = detectDueDiligence({ ...base, pushedAt: "2026-01-01T00:00:00Z" }, assessedAt);
    expect(s.map((x) => x.id)).toContain("low-activity");
  });
  it("flags archived over low-activity (never both)", () => {
    const s = detectDueDiligence(
      { ...base, archived: true, pushedAt: "2026-01-01T00:00:00Z" },
      assessedAt,
    );
    expect(s.map((x) => x.id)).toContain("archived");
    expect(s.map((x) => x.id)).not.toContain("low-activity");
  });
  it("carries a pillarId matching its pillarKey (§D)", () => {
    const s = detectDueDiligence(
      { ...base, licenseSpdxId: null, hasSecurityPolicy: false, archived: true },
      assessedAt,
    );
    expect(s.find((x) => x.id === "no-license")?.pillarId).toBe(3); // trust-governance
    expect(s.find((x) => x.id === "no-security-contact")?.pillarId).toBe(3);
    expect(s.find((x) => x.id === "archived")?.pillarId).toBe(4); // community-sustainability
  });
  it("is deterministic", () => {
    const g = { ...base, licenseSpdxId: null };
    expect(detectDueDiligence(g, assessedAt)).toEqual(detectDueDiligence(g, assessedAt));
  });
});
