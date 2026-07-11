import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BODO_INLINE_SVG } from "./bodo-svg";

/**
 * Drift guard: the inlined export SVG must carry the SAME art as the served source of truth
 * (public/bodo.svg). We compare the <path> elements verbatim — the art is the paths; the <svg>
 * wrapper is intentionally different (viewBox + aria-label for the disc). If public/bodo.svg is
 * ever re-exported, this goes red until config/bodo-svg.ts is regenerated from it.
 */
describe("BODO_INLINE_SVG", () => {
  const source = readFileSync(join(process.cwd(), "public", "bodo.svg"), "utf8");
  const sourcePaths = source.match(/<path\b[^>]*\/>/g) ?? [];

  it("carries every path from public/bodo.svg verbatim (no art drift)", () => {
    expect(sourcePaths).toHaveLength(4);
    for (const p of sourcePaths) expect(BODO_INLINE_SVG).toContain(p);
  });

  it("is a self-contained, accessible svg — no external reference", () => {
    expect(BODO_INLINE_SVG.startsWith("<svg")).toBe(true);
    expect(BODO_INLINE_SVG).toContain('viewBox="0 0 1024 1024"');
    expect(BODO_INLINE_SVG).toContain('aria-label="Bodo, the TrustScope mascot"');
    expect(BODO_INLINE_SVG).not.toMatch(/\b(src|href)=/i);
  });
});
