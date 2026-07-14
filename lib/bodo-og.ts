/**
 * Bodo-in-a-disc as a base64 SVG data URI, for embedding in the @vercel/og (Satori)
 * report card `<img>`. Satori has no clip/circle primitives, so the disc + mascot are
 * baked into one self-contained SVG that Satori rasterises via resvg.
 *
 * Single source: Bodo's paths come from `BODO_INLINE_SVG` (config/bodo-svg.ts) and the
 * gray tint from `BODO_BACKDROPS` (config/bodo.ts) — the same mark used in the site
 * header, favicon and social-preview card, so the OG card can't drift from the brand.
 */
import { BODO_BACKDROPS } from "@/config/bodo";
import { BODO_INLINE_SVG } from "@/config/bodo-svg";

// Inner paths only — drop the <svg> wrapper so we can re-wrap on a disc.
const BODO_INNER = BODO_INLINE_SVG.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

/** Bodo on a coloured disc, as a 1024x1024 self-contained SVG string. */
function discSvg(hex: string): string {
  // Bodo's ink bbox is 730x274 centred on (512,512); scale 1.2 about centre crops the
  // canvas padding so the mascot sits near the disc edge (matches BODO_ART_SCALE).
  return (
    `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">` +
    `<defs><clipPath id="d"><circle cx="512" cy="512" r="512"/></clipPath></defs>` +
    `<circle cx="512" cy="512" r="512" fill="${hex}"/>` +
    `<g clip-path="url(#d)"><g transform="translate(512 512) scale(1.2) translate(-512 -512)">${BODO_INNER}</g></g>` +
    `</svg>`
  );
}

/** Data URI for the neutral gray brand disc (the header/favicon lockup). */
export const BODO_DISC_GRAY_DATA_URI =
  "data:image/svg+xml;base64," +
  Buffer.from(discSvg(BODO_BACKDROPS.gray.hex)).toString("base64");
