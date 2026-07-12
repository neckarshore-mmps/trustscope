import { describe, it, expect } from "vitest";
import { badgeSvg } from "./badge-svg";

describe("badgeSvg", () => {
  it("renders a valid self-contained SVG", () => {
    const svg = badgeSvg();
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg.trimEnd().endsWith("</svg>")).toBe(true);
  });

  it("is label-only — the visible text encodes NO numeric score (doctrine: no aggregate)", () => {
    const svg = badgeSvg();
    // Only the two <text> element contents are user-visible; geometry attrs carry digits and are irrelevant.
    const visible = [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]).join(" ");
    expect(visible.length).toBeGreaterThan(0);
    expect(/\d/.test(visible)).toBe(false);
  });

  it("defaults to the TrustScope · trust report mark", () => {
    const svg = badgeSvg();
    expect(svg).toContain("TrustScope");
    expect(svg).toContain("trust report");
    expect(svg).toContain("aria-label=");
    expect(svg).toContain("<title>");
  });

  it("escapes untrusted text", () => {
    const svg = badgeSvg({ label: "a<b>&\"c" });
    expect(svg).toContain("a&lt;b&gt;&amp;&quot;c");
    expect(svg).not.toContain("<b>");
  });

  it("widens with longer text (deterministic geometry)", () => {
    const short = badgeSvg({ message: "x" });
    const long = badgeSvg({ message: "a much longer message" });
    const w = (s: string) => Number(s.match(/^<svg[^>]*\swidth="(\d+)"/)![1]);
    expect(w(long)).toBeGreaterThan(w(short));
  });

  it("sizes by RAW glyph count, not escaped length (CodeRabbit #96 fix)", () => {
    const w = (s: string) => Number(s.match(/^<svg[^>]*\swidth="(\d+)"/)![1]);
    // "a&b" and "axb" are both 3 glyphs — the escaped '&amp;' must not inflate the width.
    expect(w(badgeSvg({ label: "a&b" }))).toBe(w(badgeSvg({ label: "axb" })));
  });
});
