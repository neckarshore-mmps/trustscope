export type PillarMeta = {
  readonly id: 1 | 2 | 3 | 4;
  readonly key: string;
  readonly title: string;
  readonly hue: string; // fixed accent color, single source of truth
};

/**
 * Canonical pillar identity — title + hue. Question/blurb are surface-specific
 * (landing has its own; persona pages supply their own via config/personas.ts).
 * Landing and persona pages BOTH read `hue` from here so pillar colors cannot drift.
 */
export const PILLARS_META: readonly PillarMeta[] = [
  { id: 1, key: "security-supply-chain", title: "Security & Supply Chain", hue: "#6ee7b7" },
  { id: 2, key: "trust-governance", title: "Trust & Governance", hue: "#7dd3fc" },
  { id: 3, key: "community-sustainability", title: "Community & Sustainability", hue: "#fcd34d" },
  { id: 4, key: "functional-quality", title: "Functional Quality", hue: "#94a3b8" },
];
