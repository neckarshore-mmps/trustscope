import { describe, expect, it } from "vitest";
import type { Finding, Pillar } from "./report-core/types";
import {
  displayPillars,
  partitionFindings,
  pillarBand,
  scoreboardFill,
  tldrBand,
} from "./report-display";

// ---- fixtures -------------------------------------------------------------

function pillar(over: Partial<Pillar> & { key: Pillar["key"]; score: number | null }): Pillar {
  return {
    id: 1,
    key: over.key,
    title: over.title ?? over.key,
    question: "?",
    status: over.score === null ? "not-assessed" : "scored",
    score: over.score,
    scoreBasis: "",
    findings: over.findings ?? [],
    fixes: over.fixes ?? [],
  } as Pillar;
}

function finding(over: Partial<Finding> & { check: string; status: Finding["status"] }): Finding {
  return {
    check: over.check,
    label: over.label ?? over.check,
    status: over.status,
    score: over.score ?? null,
    reason: "",
    source: "scorecard",
  };
}

// ---- pillarBand -----------------------------------------------------------

describe("pillarBand", () => {
  it("maps score to the visible band (>=8 strong, >=4 moderate, <4 concern)", () => {
    expect(pillarBand(9.1)).toBe("strong");
    expect(pillarBand(8)).toBe("strong");
    expect(pillarBand(5.4)).toBe("moderate");
    expect(pillarBand(4)).toBe("moderate");
    expect(pillarBand(2.3)).toBe("concern");
    expect(pillarBand(0)).toBe("concern");
  });
  it("treats a null score as not-assessed", () => {
    expect(pillarBand(null)).toBe("na");
  });
});

// ---- scoreboardFill (intensity) ------------------------------------------

describe("scoreboardFill", () => {
  it("fills by intensity = max(score, 10-score)/10 — a low red score fills broad", () => {
    expect(scoreboardFill(2.3)).toBe(77); // max(2.3, 7.7) = 7.7
    expect(scoreboardFill(5)).toBe(50);
    expect(scoreboardFill(9.1)).toBe(91);
    expect(scoreboardFill(0)).toBe(100);
    expect(scoreboardFill(10)).toBe(100);
  });
  it("returns 0 for a null score", () => {
    expect(scoreboardFill(null)).toBe(0);
  });
});

// ---- displayPillars -------------------------------------------------------

describe("displayPillars", () => {
  const community = pillar({ key: "community-sustainability", title: "Community & Sustainability", score: 2.3 });
  const governance = pillar({ key: "trust-governance", title: "Trust & Governance", score: 5.4 });
  const security = pillar({ key: "security-supply-chain", title: "Security & Supply Chain", score: 9.1 });
  const functional = pillar({ key: "functional-quality", title: "Functional Quality", score: null });

  it("drops functional quality entirely (non-Pro shows three pillars)", () => {
    const out = displayPillars([functional, security, governance, community]);
    expect(out.map((p) => p.key)).not.toContain("functional-quality");
    expect(out).toHaveLength(3);
  });
  it("sorts worst-first: concern -> moderate -> strong", () => {
    const out = displayPillars([security, governance, community, functional]);
    expect(out.map((p) => p.title)).toEqual([
      "Community & Sustainability", // 2.3 concern
      "Trust & Governance", // 5.4 moderate
      "Security & Supply Chain", // 9.1 strong
    ]);
  });
  it("sorts alphabetically within a band", () => {
    const a = pillar({ key: "security-supply-chain", title: "Alpha", score: 1 });
    const b = pillar({ key: "trust-governance", title: "Bravo", score: 2 });
    // both concern -> alpha before bravo
    expect(displayPillars([b, a]).map((p) => p.title)).toEqual(["Alpha", "Bravo"]);
  });
  it("trails a not-assessed non-FQ pillar behind the scored ones", () => {
    const dead = pillar({ key: "security-supply-chain", title: "Security & Supply Chain", score: null });
    const out = displayPillars([dead, governance]);
    expect(out.map((p) => p.title)).toEqual(["Trust & Governance", "Security & Supply Chain"]);
  });
});

// ---- tldrBand -------------------------------------------------------------

describe("tldrBand", () => {
  const strong = pillar({ key: "security-supply-chain", score: 9.1 });
  const moderate = pillar({ key: "trust-governance", score: 5.4 });
  const concern = pillar({ key: "community-sustainability", score: 2.3 });
  it("follows the worst pillar (a colour, never a number)", () => {
    expect(tldrBand([strong, moderate, concern])).toBe("concern");
    expect(tldrBand([strong, moderate])).toBe("moderate");
    expect(tldrBand([strong])).toBe("strong");
  });
  it("ignores not-assessed pillars when picking the worst", () => {
    const dead = pillar({ key: "security-supply-chain", score: null });
    expect(tldrBand([dead, strong])).toBe("strong");
  });
});

// ---- partitionFindings (Option 2: never bury a concern) -------------------

describe("partitionFindings", () => {
  it("shows all concerns and collapses the rest when concerns <= 6", () => {
    const findings = [
      finding({ check: "a", status: "fail", score: 0 }),
      finding({ check: "b", status: "warn", score: 5 }),
      finding({ check: "c", status: "pass", score: 10 }),
      finding({ check: "d", status: "pass", score: 9 }),
    ];
    const { shown, collapsed, capped } = partitionFindings(findings);
    expect(shown.map((f) => f.check)).toEqual(["a", "b"]);
    expect(collapsed.map((f) => f.check).sort()).toEqual(["c", "d"]);
    expect(capped).toBe(0);
  });
  it("orders concerns worst-first: fail before warn, then by score ascending", () => {
    const findings = [
      finding({ check: "warn5", status: "warn", score: 5 }),
      finding({ check: "fail2", status: "fail", score: 2 }),
      finding({ check: "fail0", status: "fail", score: 0 }),
    ];
    expect(partitionFindings(findings).shown.map((f) => f.check)).toEqual(["fail0", "fail2", "warn5"]);
  });
  it("never buries a concern but caps at 6, flagging how many need attention", () => {
    const findings = Array.from({ length: 8 }, (_, i) =>
      finding({ check: `f${i}`, status: "fail", score: i }),
    );
    const { shown, collapsed, capped } = partitionFindings(findings);
    expect(shown).toHaveLength(6);
    expect(collapsed).toHaveLength(2);
    expect(capped).toBe(2);
  });
  it("groups info and inconclusive with the passing rest, not with concerns", () => {
    const findings = [
      finding({ check: "info", status: "info" }),
      finding({ check: "incon", status: "inconclusive" }),
      finding({ check: "fail", status: "fail", score: 1 }),
    ];
    const { shown, collapsed } = partitionFindings(findings);
    expect(shown.map((f) => f.check)).toEqual(["fail"]);
    expect(collapsed.map((f) => f.check).sort()).toEqual(["incon", "info"]);
  });
  it("when everything is clean, shows the first 4 and collapses the rest", () => {
    const findings = Array.from({ length: 7 }, (_, i) =>
      finding({ check: `p${i}`, status: "pass", score: 10 - i }),
    );
    const { shown, collapsed, capped } = partitionFindings(findings);
    expect(shown).toHaveLength(4);
    expect(collapsed).toHaveLength(3);
    expect(capped).toBe(0);
  });
  it("collapses nothing when everything fits", () => {
    const findings = [finding({ check: "a", status: "pass", score: 10 })];
    expect(partitionFindings(findings).collapsed).toHaveLength(0);
  });
});
