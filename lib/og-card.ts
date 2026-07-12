import { PILLARS_META } from "@/config/pillars";
import type { ReportModel } from "@/lib/report-core/types";

/**
 * B1 (per-report social card) data selection — the pure, testable seam behind the
 * `/report/og` ImageResponse route. Kept free of any rendering so the "which pillars,
 * what scores, in what order" rules can be unit-tested without Satori/next-og.
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

export interface OgPillarCell {
  title: string;
  hue: string;
  /** 0–10 mean, or null when not assessed / no cached report. */
  score: number | null;
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
    pillars: shown.map((p) => ({
      title: p.title,
      hue: p.hue,
      score: report ? (scoreById.get(p.id) ?? null) : null,
    })),
  };
}
