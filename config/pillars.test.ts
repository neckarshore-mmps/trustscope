import { describe, it, expect } from "vitest";
import { PILLARS_META } from "./pillars";

describe("PILLARS_META", () => {
  it("has exactly four pillars with ids 1..4", () => {
    expect(PILLARS_META.map((p) => p.id)).toEqual([1, 2, 3, 4]);
  });
  it("carries the fixed landing hues", () => {
    expect(PILLARS_META.map((p) => p.hue)).toEqual([
      "#6ee7b7",
      "#7dd3fc",
      "#fcd34d",
      "#94a3b8",
    ]);
  });
  it("titles match the report-core pillar titles", () => {
    expect(PILLARS_META.map((p) => p.title)).toEqual([
      "Security & Supply Chain",
      "Trust & Governance",
      "Community & Sustainability",
      "Functional Quality",
    ]);
  });
});
