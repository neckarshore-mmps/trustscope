/**
 * Bodo — the TrustScope mascot (a beaver on a boat). Single source for the mascot's
 * disc backdrops so every surface (landing hero now; report + exports later) pulls the
 * same on-brand tints. Bodo's art is cyan (#00D4FF / #00B8D4) + navy (#0A2540) on a
 * transparent canvas, so it needs a LIGHT backdrop to read fully on the dark theme.
 *
 * The four tints were chosen together with the Founder (2026-07-11). Gray leads on the
 * landing; the others are kept here so we can recall and reuse them per context.
 */
export const BODO_BACKDROPS = {
  gray: { hex: "#cdd6df", label: "Grau" },
  teal: { hex: "#bfe6dc", label: "Teal" },
  orange: { hex: "#f5c07c", label: "Orange" },
  red: { hex: "#f2a9a9", label: "Hellrot" },
} as const;

export type BodoBackdrop = keyof typeof BODO_BACKDROPS;

/** The landing hero uses the gray disc. */
export const LANDING_BODO_BACKDROP: BodoBackdrop = "gray";

/**
 * Bodo's SVG carries generous internal padding, so the art is scaled up inside the
 * (overflow-clipped) disc to sit close to the edge while keeping a small margin to the
 * tail and nose. Founder-accepted value.
 */
export const BODO_ART_SCALE = 1.2;
