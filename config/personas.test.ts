import { describe, it, expect } from "vitest";
import { PERSONAS, PERSONA_ORDER } from "./personas";

describe("persona config", () => {
  it("defines both personas with the required fields", () => {
    for (const id of ["adopter", "maintainer"] as const) {
      const p = PERSONAS[id];
      expect(p.id).toBe(id);
      expect(p.tag.length).toBeGreaterThan(0);
      expect(p.spokeHref).toBe(`/for/${id}s`);
      expect(p.spoke.title.length).toBeGreaterThan(0);
      expect(p.spoke.heroTitle.length).toBeGreaterThan(0);
      expect(p.spoke.accentHex).toMatch(/^#[0-9a-f]{6}$/i);
      expect(p.spoke.whoWhatWhy).toHaveLength(3);
      expect(p.spoke.pillars).toHaveLength(4);
      expect(p.spoke.faqs.length).toBeGreaterThan(0);
    }
  });

  it("defaults to adopter-first order (swap seam)", () => {
    expect(PERSONA_ORDER).toEqual(["adopter", "maintainer"]);
  });
});
