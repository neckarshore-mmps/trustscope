/**
 * B4 (README trust badge) — a flat two-segment SVG badge, LABEL-ONLY by doctrine.
 * TrustScope has no aggregate score (`aggregateScore` is always null; "no single fake
 * score — by design"), so the badge NEVER encodes a number — it is a branded
 * "TrustScope · trust report" mark whose per-repo meaning lives in the link that wraps it,
 * not in the image. Pure + deterministic so it can be unit-tested and cached hard.
 */

const CHAR_W = 6.5; // approx advance width at font-size 11, DejaVu-ish
const PAD = 11;
const HEIGHT = 20;

const LABEL_BG = "#24303f";
const LABEL_FG = "#e6edf3";
const MESSAGE_BG = "#2dd4bf";
const MESSAGE_FG = "#05201c";

function seg(text: string): number {
  return Math.round(text.length * CHAR_W) + PAD * 2;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface BadgeOptions {
  label?: string;
  message?: string;
}

export function badgeSvg(opts: BadgeOptions = {}): string {
  const rawLabel = opts.label ?? "TrustScope";
  const rawMessage = opts.message ?? "trust report";
  // Measure the RAW glyphs; escape only for output. Measuring escaped text would inflate the
  // width of any input with &, <, >, or " (e.g. "&" → "&amp;", 1 glyph counted as 5).
  const lw = seg(rawLabel);
  const mw = seg(rawMessage);
  const label = esc(rawLabel);
  const message = esc(rawMessage);
  const total = lw + mw;
  const alt = `${label}: ${message}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="${HEIGHT}" viewBox="0 0 ${total} ${HEIGHT}" role="img" aria-label="${alt}">
<title>${alt}</title>
<clipPath id="r"><rect width="${total}" height="${HEIGHT}" rx="3" fill="#fff"/></clipPath>
<g clip-path="url(#r)">
<rect width="${lw}" height="${HEIGHT}" fill="${LABEL_BG}"/>
<rect x="${lw}" width="${mw}" height="${HEIGHT}" fill="${MESSAGE_BG}"/>
</g>
<g fill="#fff" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11" text-rendering="geometricPrecision">
<text x="${lw / 2}" y="14" fill="${LABEL_FG}" text-anchor="middle">${label}</text>
<text x="${lw + mw / 2}" y="14" fill="${MESSAGE_FG}" text-anchor="middle">${message}</text>
</g>
</svg>`;
}
