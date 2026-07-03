import type { Finding, Pillar } from "@/lib/report-core/types";
import { findingHasEvidence } from "@/lib/finding-evidence";
import { STATUS_META } from "@/lib/ui";
import { ScoreBadge } from "./ScoreBadge";
import { StatusPill } from "./StatusPill";

function FindingRow({ finding }: { finding: Finding }) {
  const m = STATUS_META[finding.status];
  return (
    <li className="flex gap-3 py-2.5">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${m.dot}`} aria-hidden />
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-medium text-foreground">{finding.label}</span>
          {finding.score !== null && (
            <span className={`text-xs tabular-nums ${m.text}`}>{finding.score}/10</span>
          )}
          <span className="text-[11px] uppercase tracking-wide text-muted/70">
            {finding.source}
          </span>
        </div>
        <p className="mt-0.5 text-sm leading-relaxed text-muted">{finding.reason}</p>
        {findingHasEvidence(finding) && (
          <details data-testid="finding-evidence" className="mt-1.5">
            <summary className="cursor-pointer text-xs text-muted/80 hover:text-foreground">
              Details / evidence
            </summary>
            <div className="mt-1.5 rounded-md border border-border/60 bg-surface-2/50 p-2.5">
              <p className="font-mono text-[11px] text-muted/70">
                check: {finding.check} · source: {finding.source}
              </p>
              {finding.details && finding.details.length > 0 && (
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {finding.details.map((line, i) => (
                    <li key={i} className="font-mono text-[11px] leading-relaxed text-muted">
                      {line}
                    </li>
                  ))}
                </ul>
              )}
              {finding.docUrl && (
                <a
                  href={finding.docUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 inline-block text-xs text-brand hover:underline"
                >
                  Scorecard check reference ↗
                </a>
              )}
            </div>
          </details>
        )}
      </div>
    </li>
  );
}

export function PillarCard({ pillar }: { pillar: Pillar }) {
  const notAssessed = pillar.status === "not-assessed";
  return (
    <section
      className="rounded-xl border border-border bg-surface/60 p-5 sm:p-6"
      aria-labelledby={`pillar-${pillar.id}`}
    >
      <div className="flex items-start gap-4">
        <ScoreBadge score={pillar.score} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-brand">
            Pillar {pillar.id}
          </div>
          <h2
            id={`pillar-${pillar.id}`}
            className="mt-0.5 text-lg font-semibold tracking-tight text-foreground"
          >
            {pillar.title}
          </h2>
          <p className="text-sm text-muted">{pillar.question}</p>
        </div>
      </div>

      {pillar.framingNote && (
        <p className="mt-4 rounded-lg border border-border/70 bg-surface-2/60 px-3.5 py-2.5 text-sm leading-relaxed text-muted">
          {pillar.framingNote}
        </p>
      )}

      {!notAssessed && (
        <>
          <p className="mt-4 text-xs leading-relaxed text-muted/80">{pillar.scoreBasis}</p>

          <ul className="mt-2 divide-y divide-border/60">
            {pillar.findings.map((f) => (
              <FindingRow key={f.check} finding={f} />
            ))}
          </ul>

          {pillar.fixes.length > 0 && (
            <div className="mt-4 rounded-lg border border-brand/20 bg-brand/[0.04] p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <WrenchIcon />
                Constructive suggestions
                <span className="rounded-full bg-brand/15 px-2 py-0.5 text-xs font-normal text-brand">
                  {pillar.fixes.length}
                </span>
              </h3>
              <p className="mt-1 text-xs text-muted">
                Share these upstream — they are phrased as improvements the maintainer can make.
              </p>
              <ul className="mt-3 space-y-2.5">
                {pillar.fixes.map((fix) => (
                  <li key={fix.check} className="flex gap-2.5 text-sm leading-relaxed">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                    <span className="text-foreground/90">{fix.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {notAssessed && (
        <div className="mt-4 flex items-center gap-2">
          <StatusPill status="inconclusive" />
          <span className="text-sm text-muted">Not assessed — never faked.</span>
        </div>
      )}
    </section>
  );
}

function WrenchIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-brand"
      aria-hidden="true"
    >
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-2.4Z" />
    </svg>
  );
}
