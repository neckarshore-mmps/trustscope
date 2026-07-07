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
    expect(detectDueDiligence(base, null, assessedAt)).toEqual([]);
  });
  it("flags a missing license", () => {
    const s = detectDueDiligence({ ...base, licenseSpdxId: null }, null, assessedAt);
    expect(s.map((x) => x.id)).toContain("no-license");
    expect(s.find((x) => x.id === "no-license")?.mitigation).toBeTruthy();
  });
  it("flags a missing security policy", () => {
    const s = detectDueDiligence({ ...base, hasSecurityPolicy: false }, null, assessedAt);
    expect(s.map((x) => x.id)).toContain("no-security-contact");
  });
  it("frames the missing security policy as repository-scoped, not absolute (§D)", () => {
    const s = detectDueDiligence({ ...base, hasSecurityPolicy: false }, null, assessedAt);
    expect(s.find((x) => x.id === "no-security-contact")?.detail).toMatch(
      /no security policy detected on this repository/i,
    );
  });
  it("flags low activity outside the 90-day window", () => {
    const s = detectDueDiligence({ ...base, pushedAt: "2026-01-01T00:00:00Z" }, null, assessedAt);
    expect(s.map((x) => x.id)).toContain("low-activity");
  });
  it("flags archived over low-activity (never both)", () => {
    const s = detectDueDiligence(
      { ...base, archived: true, pushedAt: "2026-01-01T00:00:00Z" },
      null,
      assessedAt,
    );
    expect(s.map((x) => x.id)).toContain("archived");
    expect(s.map((x) => x.id)).not.toContain("low-activity");
  });
  it("carries a pillarId matching its pillarKey (§D)", () => {
    const s = detectDueDiligence(
      { ...base, licenseSpdxId: null, hasSecurityPolicy: false, archived: true },
      null,
      assessedAt,
    );
    expect(s.find((x) => x.id === "no-license")?.pillarId).toBe(2); // trust-governance
    expect(s.find((x) => x.id === "no-security-contact")?.pillarId).toBe(2);
    expect(s.find((x) => x.id === "archived")?.pillarId).toBe(3); // community-sustainability
  });
  it("is deterministic", () => {
    const g = { ...base, licenseSpdxId: null };
    expect(detectDueDiligence(g, null, assessedAt)).toEqual(detectDueDiligence(g, null, assessedAt));
  });
  it("flags install scripts from the manifest, on the security pillar", () => {
    const s = detectDueDiligence(base, { installHooks: ["postinstall"] }, assessedAt);
    const sig = s.find((x) => x.id === "install-scripts");
    expect(sig).toBeTruthy();
    expect(sig?.detail).toContain("postinstall");
    expect(sig?.pillarId).toBe(1); // security-supply-chain
    expect(sig?.mitigation).toContain("--ignore-scripts");
  });
  it("does not flag install scripts when the manifest has no hooks or is null", () => {
    // manifest parsed, no install hooks → no signal
    expect(
      detectDueDiligence(base, { installHooks: [] }, assessedAt).map((x) => x.id),
    ).not.toContain("install-scripts");
    // manifest missing / fetch failed → no signal
    expect(detectDueDiligence(base, null, assessedAt).map((x) => x.id)).not.toContain(
      "install-scripts",
    );
  });
});
