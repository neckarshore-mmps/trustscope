import Link from "next/link";
import { pillarHueText } from "@/config/pillars";
import type { Pillar, ReportModel } from "@/lib/report-core/types";
import { displayPillars, scoreboardFill } from "@/lib/report-display";
import { scoreBar, scoreColor } from "@/lib/ui";
import { InfoIcon } from "./InfoIcon";

/**
 * The score block at the very top (#403 a): one compact tile per SHOWN pillar in fixed P1→P2→P3
 * order, each a jump-link to its `#pillar-{id}` detail. Per-pillar readouts only — never a single
 * aggregate. The eyebrow carries the pillar's identity hue; the bar fills by INTENSITY (distance
 * from a neutral 5) and its colour marks the score direction (a separate signal from the hue).
 */
function Tile({ pillar }: { pillar: Pillar }) {
  const { score } = pillar;
  const fill = scoreboardFill(score);
  return (
    <Link
      href={`#pillar-${pillar.id}`}
      className="group flex flex-col rounded-xl border border-border bg-surface/60 p-4 transition-colors hover:border-brand/40"
    >
      <span
        className="text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: pillarHueText(pillar.id) }}
      >
        Pillar {pillar.id}
      </span>
      <span className="mt-1 flex-1 text-sm font-medium leading-snug text-foreground">
        {pillar.title}
      </span>
      {score === null ? (
        <span className="mt-3 text-sm font-semibold text-muted">Not assessed</span>
      ) : (
        <span className="mt-3 flex items-baseline gap-1">
          <span
            className={`text-[1.7rem] font-semibold leading-none tabular-nums ${scoreColor(score)}`}
          >
            {score.toFixed(1)}
          </span>
          <span className="text-xs font-medium text-muted">/ 10</span>
        </span>
      )}
      <span className="mt-3 h-1 w-full overflow-hidden rounded-full bg-border" aria-hidden>
        {score !== null && (
          <span
            className={`block h-full rounded-full ${scoreBar(score)}`}
            style={{ width: `${fill}%` }}
          />
        )}
      </span>
    </Link>
  );
}

export function Scoreboard({ report }: { report: ReportModel }) {
  const pillars = displayPillars(report.pillars);
  if (pillars.length === 0) return null;
  return (
    <section aria-label="Pillar scores" className="mt-8">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {pillars.map((p) => (
          <Tile key={p.id} pillar={p} />
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        Bar length shows intensity (distance from a neutral 5); colour shows direction. No single
        grade, by design.
        <InfoIcon label="how scores are shown" />
      </p>
    </section>
  );
}
