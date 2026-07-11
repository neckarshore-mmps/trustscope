import { scoreColor, scoreRing } from "@/lib/ui";

/** A circular 0–10 score dial, or a "not assessed" marker when score is null. */
export function ScoreBadge({ score }: { score: number | null }) {
  const radius = 26;
  const circ = 2 * Math.PI * radius;
  const pct = score === null ? 0 : Math.max(0, Math.min(10, score)) / 10;
  const dash = circ * pct;

  return (
    <div className="relative h-16 w-16 shrink-0" aria-hidden={score === null}>
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          className="text-border"
        />
        {score !== null && (
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            className={scoreRing(score)}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {score === null ? (
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted">
            n/a
          </span>
        ) : (
          <span className={`text-lg font-semibold tabular-nums ${scoreColor(score)}`}>
            {score.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );
}
