import { describe, it, expect } from "vitest";
import { FAQ_ITEMS } from "./faq";
import { PERSONAS } from "./personas";

describe("FAQ dedup invariant", () => {
  it("no question string appears in more than one FAQ set", () => {
    const all = [
      ...FAQ_ITEMS.map((f) => f.q),
      ...PERSONAS.adopter.spoke.faqs.map((f) => f.q),
      ...PERSONAS.maintainer.spoke.faqs.map((f) => f.q),
    ].map((q) => q.trim().toLowerCase());
    const dupes = all.filter((q, i) => all.indexOf(q) !== i);
    expect(dupes).toEqual([]);
  });
});
