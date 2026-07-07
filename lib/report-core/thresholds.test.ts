import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { scoreColor } from "@/lib/ui";
import { reportSynthesis } from "@/lib/report-summary";
import { ACTIVITY_WINDOW_DAYS, daysBetween, FAIL_THRESHOLD, PASS_THRESHOLD } from "./thresholds";
import type { Pillar, ReportModel } from "./types";

/**
 * §4 — thresholds + activity window are a single source of truth. Every consumer imports from
 * ./thresholds; the literals 8 / 3 / 90 live in exactly one module. These tests assert both the
 * grep-level invariant (no duplicate definitions) and that the consumers agree at the boundaries.
 */

function pillarAt(score: number, key: Pillar["key"], title: string): Pillar {
  return {
    id: 2,
    key,
    title,
    question: "?",
    status: "scored",
    score,
    scoreBasis: "",
    findings: [],
    fixes: [],
  };
}

function reportWith(pillars: Pillar[]): ReportModel {
  return {
    product: "p",
    repo: { owner: "o", name: "r", url: "", commit: "c" },
    assessedAt: "2026-07-01T00:00:00.000Z",
    generatedAt: "2026-07-01T00:00:00.000Z",
    scorecard: null,
    aggregateScore: null,
    aggregateNote: "",
    pillars: pillars as unknown as ReportModel["pillars"],
    dueDiligence: [],
  };
}

describe("threshold SSOT (§4)", () => {
  it("exposes the canonical values", () => {
    expect(PASS_THRESHOLD).toBe(8);
    expect(FAIL_THRESHOLD).toBe(3);
    expect(ACTIVITY_WINDOW_DAYS).toBe(90);
  });

  it("daysBetween: whole-day distance, null on unparseable input", () => {
    expect(daysBetween("2026-07-01T00:00:00Z", "2026-06-01T00:00:00Z")).toBe(30);
    expect(daysBetween("nope", "2026-06-01T00:00:00Z")).toBeNull();
  });

  it("report-summary bands agree with the thresholds at the boundaries", () => {
    const synth = (score: number) =>
      reportSynthesis(reportWith([pillarAt(score, "security-supply-chain", "security")]));
    expect(synth(PASS_THRESHOLD)).toMatch(/strong on security/i);
    expect(synth(FAIL_THRESHOLD)).toMatch(/worth checking on security/i);
    expect(synth(PASS_THRESHOLD - 1)).toMatch(/moderate on security/i);
  });

  it("ui scoreColor agrees with the pass threshold (strong = emerald at >= PASS_THRESHOLD)", () => {
    expect(scoreColor(PASS_THRESHOLD)).toMatch(/emerald/);
    expect(scoreColor(PASS_THRESHOLD - 1)).not.toMatch(/emerald/);
    expect(scoreColor(FAIL_THRESHOLD)).toMatch(/rose/); // <= FAIL_THRESHOLD is concern, never amber
  });

  it("the threshold literals live in exactly one module (no duplicate definitions)", () => {
    const root = process.cwd();
    const readSrc = (p: string) => readFileSync(join(root, p), "utf8");
    // The consumers must not RE-DEFINE the constants — they import them.
    for (const f of [
      "lib/report-core/build-report.ts",
      "lib/report-core/due-diligence.ts",
      "lib/report-summary.ts",
    ]) {
      const src = readSrc(f);
      expect(src).not.toMatch(/const\s+PASS_THRESHOLD\s*=/);
      expect(src).not.toMatch(/const\s+FAIL_THRESHOLD\s*=/);
      expect(src).not.toMatch(/const\s+ACTIVITY_WINDOW_DAYS\s*=/);
      expect(src).toMatch(/from ["']\.\/thresholds["']|report-core\/thresholds/);
    }
    // The definitions exist in the SSOT module.
    const ssot = readSrc("lib/report-core/thresholds.ts");
    expect(ssot).toMatch(/export const PASS_THRESHOLD = 8;/);
    expect(ssot).toMatch(/export const FAIL_THRESHOLD = 3;/);
    expect(ssot).toMatch(/export const ACTIVITY_WINDOW_DAYS = 90;/);
  });
});
