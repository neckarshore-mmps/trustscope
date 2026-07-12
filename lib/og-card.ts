import { PILLARS_META } from "@/config/pillars";
import { scoreboardFill } from "@/lib/report-display";
import { PASS_THRESHOLD } from "@/lib/report-core/thresholds";
import type { ReportModel } from "@/lib/report-core/types";

/**
 * B1 (per-report social card) data selection — the pure, testable seam behind the
 * `/report/og` ImageResponse route. Kept free of any rendering so the "which pillars,
 * what scores, what colours, in what order" rules can be unit-tested without Satori/next-og.
 *
 * The card mirrors the on-page Scoreboard tile: identity HUE on the eyebrow, the score
 * coloured by DIRECTION (green/amber/red), and a fill bar whose length is intensity.
 *
 * Doctrine held here:
 *   - The Pro-only pillar (Functional Quality, id 4) is dropped — the card shows the
 *     three FREE pillars, matching `displayPillars()` + the three-pillar guard.
 *   - Fixed P1→P2→P3 order (never resequenced by score).
 *   - NEVER a single aggregate score (the product has none by design). Per-pillar only.
 *   - `score` is best-effort: filled from a cached report when one exists, else null
 *     (the card still names the repo + its three pillar dimensions). Reliable per-pillar
 *     scores depend on a shared cross-instance store — see the launch follow-up.
 */

/** Functional Quality — Pro-only, never shown on the free card. */
const PRO_ONLY_PILLAR_ID = 4;

// Display-only midpoint (shared with lib/ui.ts): amber floor for the rose/amber split.
const AMBER_FLOOR = 4;

// Direction hexes, matching the Tailwind classes lib/ui.ts uses (Satori needs hex, not classes).
const DIRECTION = {
  strong: { text: "#6ee7b7", bar: "#34d399" }, // emerald-300 / emerald-400  (score >= PASS_THRESHOLD)
  moderate: { text: "#fcd34d", bar: "#fbbf24" }, // amber-300 / amber-400     (score >= AMBER_FLOOR)
  weak: { text: "#fda4af", bar: "#fb7185" }, // rose-300 / rose-400           (below AMBER_FLOOR)
  none: { text: "#94a3b8", bar: "#475569" }, // slate-400 / slate-600         (not assessed)
} as const;

/** Direction colours for a 0–10 score (or null). Same thresholds as scoreColor/scoreBar. */
export function scoreDirection(score: number | null): { text: string; bar: string } {
  if (score === null) return DIRECTION.none;
  if (score >= PASS_THRESHOLD) return DIRECTION.strong;
  if (score >= AMBER_FLOOR) return DIRECTION.moderate;
  return DIRECTION.weak;
}

export interface OgPillarCell {
  /** Pillar id 1–3 (fixed order). */
  id: 1 | 2 | 3;
  title: string;
  /** Identity accent (the eyebrow), never a score signal. */
  hue: string;
  /** 0–10 mean, or null when not assessed / no cached report. */
  score: number | null;
  /** Bar length 0–100 (intensity = distance from a neutral 5); 0 when not assessed. */
  fill: number;
  /** Score-text hex by direction. */
  scoreHex: string;
  /** Bar-fill hex by direction. */
  barHex: string;
}

export interface OgCardData {
  /** "owner/repo". */
  repoLabel: string;
  /** The three free pillars in fixed P1→P2→P3 order. */
  pillars: OgPillarCell[];
}

export function buildOgCardData(
  parsed: { owner: string; repo: string },
  report: ReportModel | null,
): OgCardData {
  const shown = PILLARS_META.filter((p) => p.id !== PRO_ONLY_PILLAR_ID)
    .slice()
    .sort((a, b) => a.id - b.id);

  const scoreById = new Map<number, number | null>();
  if (report) {
    for (const p of report.pillars) scoreById.set(p.id, p.score);
  }

  return {
    repoLabel: `${parsed.owner}/${parsed.repo}`,
    pillars: shown.map((p) => {
      const score = report ? (scoreById.get(p.id) ?? null) : null;
      const dir = scoreDirection(score);
      return {
        id: p.id as 1 | 2 | 3,
        title: p.title,
        hue: p.hue,
        score,
        fill: scoreboardFill(score),
        scoreHex: dir.text,
        barHex: dir.bar,
      };
    }),
  };
}
