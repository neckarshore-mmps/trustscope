import { describe, expect, it } from "vitest";
import {
  BODO_ART_SCALE,
  BODO_BACKDROPS,
  LANDING_BODO_BACKDROP,
  REPORT_BODO_BACKDROP,
} from "./bodo";

describe("Bodo backdrops", () => {
  it("stores the four on-brand tints as valid 6-digit hex", () => {
    expect(Object.keys(BODO_BACKDROPS)).toEqual(["gray", "teal", "orange", "red"]);
    for (const { hex, label } of Object.values(BODO_BACKDROPS)) {
      expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it("uses the gray disc on the landing", () => {
    expect(LANDING_BODO_BACKDROP).toBe("gray");
    expect(BODO_BACKDROPS[LANDING_BODO_BACKDROP].hex).toBe("#cdd6df");
  });

  it("uses the neutral gray disc on the report (no-single-score doctrine)", () => {
    expect(REPORT_BODO_BACKDROP).toBe("gray");
    expect(BODO_BACKDROPS[REPORT_BODO_BACKDROP].hex).toBe("#cdd6df");
  });

  it("keeps the Founder-accepted art scale", () => {
    expect(BODO_ART_SCALE).toBe(1.2);
  });
});
