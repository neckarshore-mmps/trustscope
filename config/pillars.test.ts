import { describe, it, expect } from "vitest";
import { PILLARS_META, pillarHue, pillarHueText } from "./pillars";

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
  it("carries a theme-aware hueText CSS var per pillar (light-mode AA)", () => {
    expect(PILLARS_META.map((p) => p.hueText)).toEqual([
      "var(--pillar-text-1)",
      "var(--pillar-text-2)",
      "var(--pillar-text-3)",
      "var(--pillar-text-4)",
    ]);
  });
  it("pillarHue returns the decorative hue; pillarHueText returns the text var", () => {
    expect(pillarHue(1)).toBe("#6ee7b7");
    expect(pillarHueText(1)).toBe("var(--pillar-text-1)");
    expect(pillarHueText(3)).toBe("var(--pillar-text-3)");
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
