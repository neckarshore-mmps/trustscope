/**
 * Compact, scannable trust signals for above-the-fold placement. The strongest lever
 * for the DACH audience ("Made in Germany", GDPR) previously lived only in the footer —
 * this surfaces it at the decision point. Every claim is verifiable and matches /about:
 * German origin, GDPR posture, no third-party trackers, MIT/public source, no login to
 * read a report.
 */
const SIGNALS = [
  "Made in Germany",
  "GDPR-clean",
  "No tracking",
  "No sign-in",
  "Open source",
] as const;

export function TrustStrip({ className = "" }: { className?: string }) {
  return (
    <ul
      className={`flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs text-muted ${className}`}
      aria-label="Trust signals"
    >
      {SIGNALS.map((s, i) => (
        <li key={s} className="inline-flex items-center gap-2.5">
          {i > 0 && (
            <span aria-hidden className="text-muted/40">
              ·
            </span>
          )}
          <span>{s}</span>
        </li>
      ))}
    </ul>
  );
}
