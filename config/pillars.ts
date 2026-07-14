export type PillarMeta = {
  readonly id: 1 | 2 | 3 | 4;
  readonly key: string;
  readonly title: string;
  readonly hue: string; // fixed accent color, single source of truth (fills/borders/tints)
  readonly hueText: string; // theme-aware accent for TEXT; deepens to AA in light mode
};

/**
 * Canonical pillar identity — title + hue. Question/blurb are surface-specific
 * (landing has its own; persona pages supply their own via config/personas.ts).
 * Landing and persona pages BOTH read `hue` from here so pillar colors cannot drift.
 *
 * `hue` is the vivid -300/-400 accent used for decorative fills, borders and tints
 * (no contrast requirement). `hueText` is a theme-aware CSS var (--pillar-text-N in
 * globals.css) used wherever the accent is TEXT — it deepens to the -700/-600 sibling
 * in light mode so pillar labels/numerals pass WCAG AA on a light ground.
 */
export const PILLARS_META: readonly PillarMeta[] = [
  { id: 1, key: "security-supply-chain", title: "Security & Supply Chain", hue: "#6ee7b7", hueText: "var(--pillar-text-1)" },
  { id: 2, key: "trust-governance", title: "Trust & Governance", hue: "#7dd3fc", hueText: "var(--pillar-text-2)" },
  { id: 3, key: "community-sustainability", title: "Community & Sustainability", hue: "#fcd34d", hueText: "var(--pillar-text-3)" },
  { id: 4, key: "functional-quality", title: "Functional Quality", hue: "#94a3b8", hueText: "var(--pillar-text-4)" },
];

/**
 * Canonical accent hue for a pillar id — the single source both the landing pillar
 * cards and the report (Scoreboard tile + PillarCard header) read, so the per-pillar
 * identity colour cannot drift between surfaces. Use for decorative fills/borders.
 */
export function pillarHue(id: 1 | 2 | 3 | 4): string {
  return PILLARS_META.find((p) => p.id === id)?.hue ?? "#94a3b8";
}

/**
 * Theme-aware accent for pillar TEXT (labels, questions, report tile/header numerals).
 * Resolves to the vivid -300/-400 hue on dark and its AA-passing -700/-600 sibling on
 * light (via the --pillar-text-N CSS vars). Use wherever the accent colours TEXT, so
 * pillar type never falls below WCAG AA on a light ground.
 */
export function pillarHueText(id: 1 | 2 | 3 | 4): string {
  return PILLARS_META.find((p) => p.id === id)?.hueText ?? "var(--color-muted)";
}
