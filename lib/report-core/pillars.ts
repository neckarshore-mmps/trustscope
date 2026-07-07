import type { PillarKey } from "./types";

/**
 * Pillar metadata + the Scorecard-check -> pillar assignment (work-order §4a).
 *
 * Each Scorecard check belongs to exactly ONE pillar. Checks not listed default to
 * "security-supply-chain" so new Scorecard checks are forward-compatible (AP-1).
 */

export const PILLAR_META: Record<
  PillarKey,
  { id: 1 | 2 | 3 | 4; title: string; question: string }
> = {
  "security-supply-chain": {
    id: 1,
    title: "Security & Supply Chain",
    question: "Is it built and operated securely?",
  },
  "trust-governance": {
    id: 2,
    title: "Trust & Governance",
    question: "Can I trust the project behind it?",
  },
  "community-sustainability": {
    id: 3,
    title: "Community & Sustainability",
    question: "Will it still be here in twelve months?",
  },
  "functional-quality": {
    id: 4,
    title: "Functional Quality",
    question: "Is it well-built?",
  },
};

/** Explicit non-default assignments. Everything else -> security-supply-chain. */
const CHECK_PILLAR: Record<string, PillarKey> = {
  License: "trust-governance",
  "Security-Policy": "trust-governance",
  Maintained: "community-sustainability",
  Contributors: "community-sustainability",
};

export function pillarForCheck(checkName: string): PillarKey {
  return CHECK_PILLAR[checkName] ?? "security-supply-chain";
}
