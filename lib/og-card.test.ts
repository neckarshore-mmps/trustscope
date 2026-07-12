import { describe, it, expect } from "vitest";
import { buildOgCardData } from "./og-card";
import type { ReportModel, Pillar } from "@/lib/report-core/types";

function pillar(id: 1 | 2 | 3 | 4, score: number | null): Pillar {
  return {
    id,
    key: (["security-supply-chain", "trust-governance", "community-sustainability", "functional-quality"] as const)[id - 1],
    title: `P${id}`,
    question: "?",
    status: score === null ? "not-assessed" : "scored",
    score,
    scoreBasis: "",
    findings: [],
    fixes: [],
  };
}

function report(scores: [number | null, number | null, number | null, number | null]): ReportModel {
  return {
    product: "TrustScope",
    repo: { owner: "o", name: "r", url: "", commit: null },
    assessedAt: "2026-07-12",
    generatedAt: "2026-07-12",
    scorecard: null,
    aggregateScore: null,
    aggregateNote: "",
    pillars: [pillar(1, scores[0]), pillar(2, scores[1]), pillar(3, scores[2]), pillar(4, scores[3])],
    dueDiligence: [],
  };
}

describe("buildOgCardData", () => {
  it("always shows the three FREE pillars in fixed P1→P2→P3 order (Pro-only dropped)", () => {
    const card = buildOgCardData({ owner: "ossf", repo: "scorecard" }, null);
    expect(card.pillars).toHaveLength(3);
    expect(card.pillars.map((p) => p.title)).toEqual([
      "Security & Supply Chain",
      "Trust & Governance",
      "Community & Sustainability",
    ]);
  });

  it("labels the repo owner/repo", () => {
    expect(buildOgCardData({ owner: "ossf", repo: "scorecard" }, null).repoLabel).toBe("ossf/scorecard");
  });

  it("leaves scores null when there is no cached report (label-only fallback)", () => {
    const card = buildOgCardData({ owner: "o", repo: "r" }, null);
    expect(card.pillars.every((p) => p.score === null)).toBe(true);
  });

  it("fills per-pillar scores from a cached report, never an aggregate", () => {
    const card = buildOgCardData({ owner: "o", repo: "r" }, report([8.2, 6.5, 4.1, 9.9]));
    expect(card.pillars.map((p) => p.score)).toEqual([8.2, 6.5, 4.1]); // P4 (9.9) excluded
  });

  it("keeps a not-assessed free pillar as null while still showing it", () => {
    const card = buildOgCardData({ owner: "o", repo: "r" }, report([7.0, null, 5.0, null]));
    expect(card.pillars.map((p) => p.score)).toEqual([7.0, null, 5.0]);
    expect(card.pillars).toHaveLength(3);
  });

  it("never surfaces the Pro-only Functional Quality pillar", () => {
    const card = buildOgCardData({ owner: "o", repo: "r" }, report([1, 2, 3, 4]));
    expect(card.pillars.some((p) => p.title.includes("Functional"))).toBe(false);
  });
});
