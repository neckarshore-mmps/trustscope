import type { BodoBackdrop } from "@/config/bodo";
import { PASS_THRESHOLD } from "@/lib/report-core/thresholds";
import type { DueDiligenceSignal, Finding, Pillar, ReportModel } from "@/lib/report-core/types";

/**
 * Display-only derivations for the report UI + export (Founder redesign 2026-07-10). PURE and
 * deterministic — no clock, no LLM, no I/O. The Report-Core model is untouched: it still computes
 * four pillars (Functional Quality returns in TrustScope Pro); everything here only decides what the
 * non-Pro surfaces SHOW. "No single grade" holds — TL;DR yields a colour band, never a number.
 */

// Display midpoint mirrors lib/ui.ts: the amber/rose split is >= 4 (a presentation boundary, not the
// fail threshold), so the sort/band match the colour a reader actually sees on the tile.
const AMBER_FLOOR = 4;

/** The pillar excluded from the non-Pro product (kept in the core for Pro). */
const PRO_ONLY_PILLAR: Pillar["key"] = "functional-quality";

export type Band = "concern" | "moderate" | "strong" | "na";

const BAND_RANK: Record<Band, number> = { concern: 0, moderate: 1, strong: 2, na: 3 };

/** Visible band for a pillar score (matches the tile colour: >=8 strong, >=4 moderate, <4 concern). */
export function pillarBand(score: number | null): Band {
  if (score === null) return "na";
  if (score >= PASS_THRESHOLD) return "strong";
  if (score >= AMBER_FLOOR) return "moderate";
  return "concern";
}

/**
 * Scoreboard bar fill %, by INTENSITY: `max(score, 10-score)/10`. Length encodes distance from a
 * neutral 5, colour encodes direction — a low red score fills toward a broad red bar (2.3 -> 77%),
 * a high green score toward a broad green one (9.1 -> 91%). 5 -> 50%; 0 and 10 -> 100%.
 */
export function scoreboardFill(score: number | null): number {
  if (score === null) return 0;
  const s = Math.max(0, Math.min(10, score));
  return Math.round(Math.max(s, 10 - s) * 10);
}

/**
 * The pillars the non-Pro report shows: Functional Quality (Pro-only) dropped, then in FIXED
 * pillar order — P1 Security → P2 Trust → P3 Community. The order is a product rule: pillars never
 * reorder by findings/score, and a not-assessed pillar keeps its fixed slot (it does not trail).
 * The due-diligence read still surfaces problems first — via the TL;DR band + the concern-first
 * order of findings WITHIN each pillar — just not by resequencing the pillars themselves.
 */
export function displayPillars(pillars: readonly Pillar[]): Pillar[] {
  return pillars
    .filter((p) => p.key !== PRO_ONLY_PILLAR)
    .slice()
    .sort((a, b) => a.id - b.id);
}

/**
 * The TL;DR ground colour follows the WORST shown pillar (not-assessed pillars ignored). A colour,
 * never a number — so the "no single aggregate score" doctrine holds. Returns "na" when nothing
 * could be scored, so an unassessed report never renders green ("Looks solid").
 */
export function tldrBand(pillars: readonly Pillar[]): Band {
  let worst: Band | null = null;
  for (const p of displayPillars(pillars)) {
    const b = pillarBand(p.score);
    if (b === "na") continue;
    if (worst === null || BAND_RANK[b] < BAND_RANK[worst]) worst = b;
  }
  return worst ?? "na";
}

/**
 * Bodo's disc backdrop echoes the TL;DR ground band (Founder 2026-07-11): the mascot picks up the
 * SAME colour the TL;DR box already shows, so the two can never drift. It reads as no NEW signal —
 * the colour is already on the page. `na` (nothing assessed) falls back to the neutral gray disc.
 */
const BAND_TO_BODO: Record<Band, BodoBackdrop> = {
  concern: "red",
  moderate: "orange",
  strong: "teal",
  na: "gray",
};

export function reportBodoBackdrop(pillars: readonly Pillar[]): BodoBackdrop {
  return BAND_TO_BODO[tldrBand(pillars)];
}

/**
 * Due-diligence signals for the SHOWN pillars only: Pro-only (functional-quality) signals are
 * dropped so they never leak into a non-Pro surface — the same visibility rule displayPillars
 * applies to the pillars themselves.
 */
export function displayDueDiligence(report: ReportModel): DueDiligenceSignal[] {
  return report.dueDiligence.filter((d) => d.pillarKey !== PRO_ONLY_PILLAR);
}

function isConcern(f: Finding): boolean {
  return f.status === "fail" || f.status === "warn";
}

// Worst-first among concerns: fail before warn, then lower score first, then label A->Z.
function concernSort(a: Finding, b: Finding): number {
  const rank = (f: Finding) => (f.status === "fail" ? 0 : 1);
  const r = rank(a) - rank(b);
  if (r !== 0) return r;
  const s = (a.score ?? 999) - (b.score ?? 999);
  if (s !== 0) return s;
  return a.label.localeCompare(b.label);
}

// Rest order: passes first (best score first), then info, then inconclusive; label A->Z ties.
function restSort(a: Finding, b: Finding): number {
  const rank = (f: Finding) => (f.status === "pass" ? 0 : f.status === "info" ? 1 : 2);
  const r = rank(a) - rank(b);
  if (r !== 0) return r;
  const s = (b.score ?? -1) - (a.score ?? -1);
  if (s !== 0) return s;
  return a.label.localeCompare(b.label);
}

export interface FindingPartition {
  /** Findings shown expanded at the top. */
  shown: Finding[];
  /** Findings behind the "Show me more" collapse. */
  collapsed: Finding[];
  /** How many CONCERNS were pushed into the collapse by the cap (0 unless > CONCERN_CAP). */
  capped: number;
}

/** Soft cap on the passing rest shown when a pillar is all-clear. */
const REST_CAP = 4;
/** Hard cap on concerns shown up top before we collapse the overflow (rare — keeps a pillar bounded). */
const CONCERN_CAP = 6;

/**
 * Option 2 — "never bury a concern". Every red/amber finding shows up top (worst-first); only the
 * passing/info/inconclusive rest collapses. When a pillar is all-clear, the first four of the rest
 * show as reassurance. The one exception is the rare pillar with more than six concerns: it caps at
 * six and reports how many still need attention, so the collapse label can say so honestly.
 */
export function partitionFindings(findings: readonly Finding[]): FindingPartition {
  const concerns = findings.filter(isConcern).slice().sort(concernSort);
  const rest = findings.filter((f) => !isConcern(f)).slice().sort(restSort);

  if (concerns.length > 0) {
    if (concerns.length <= CONCERN_CAP) {
      return { shown: concerns, collapsed: rest, capped: 0 };
    }
    return {
      shown: concerns.slice(0, CONCERN_CAP),
      collapsed: [...concerns.slice(CONCERN_CAP), ...rest],
      capped: concerns.length - CONCERN_CAP,
    };
  }
  return { shown: rest.slice(0, REST_CAP), collapsed: rest.slice(REST_CAP), capped: 0 };
}
