import { pillarHueText } from "@/config/pillars";
import type { Finding, Pillar, ReportModel } from "@/lib/report-core/types";
import { findingHasEvidence } from "@/lib/finding-evidence";
import {
  buildPillarIssueMarkdown,
  buildPillarIssueTitle,
  prefilledPillarIssueUrl,
} from "@/lib/issue-markdown";
import { partitionFindings } from "@/lib/report-display";
import { STATUS_META } from "@/lib/ui";
import { InfoIcon } from "./InfoIcon";
import { PillarIssueButton } from "./PillarIssueButton";
import { ScoreBadge } from "./ScoreBadge";
import { StatusPill } from "./StatusPill";

const isConcern = (f: Finding) => f.status === "fail" || f.status === "warn";

/** One check: score leads the line, then label + source + info affordance; reason and evidence below. */
function FindingRow({ finding }: { finding: Finding }) {
  const m = STATUS_META[finding.status];
  return (
    <li className="flex gap-3 py-2.5">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${m.dot}`} aria-hidden />
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {finding.score !== null && (
            <span className={`text-xs font-semibold tabular-nums ${m.text}`}>{finding.score}/10</span>
          )}
          <span className="text-sm font-medium text-foreground">{finding.label}</span>
          <span className="text-[11px] uppercase tracking-wide text-muted/70 light:text-muted">{finding.source}</span>
          <InfoIcon label={finding.label} />
        </div>
        <p className="mt-0.5 text-sm leading-relaxed text-muted">{finding.reason}</p>
        {findingHasEvidence(finding) && (
          <details data-testid="finding-evidence" className="mt-1.5">
            <summary className="cursor-pointer text-xs text-muted/80 light:text-muted hover:text-foreground">
              Details / evidence
            </summary>
            <div className="mt-1.5 rounded-md border border-border/60 bg-surface-2/50 p-2.5">
              <p className="font-mono text-[11px] text-muted/70 light:text-muted">
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

export function PillarCard({
  pillar,
  report,
  oauthConfigured,
}: {
  pillar: Pillar;
  report: ReportModel;
  oauthConfigured: boolean;
}) {
  const notAssessed = pillar.status === "not-assessed";
  const { shown, collapsed, capped } = partitionFindings(pillar.findings);
  const shownConcerns = shown.filter(isConcern).length;
  const moreLabel =
    capped > 0
      ? `Show ${collapsed.length} more — ${capped} still need${capped === 1 ? "s" : ""} attention`
      : `Show ${collapsed.length} more check${collapsed.length === 1 ? "" : "s"}`;

  return (
    <section
      className="rounded-xl border border-border bg-surface/60 p-5 sm:p-6"
      aria-labelledby={`pillar-${pillar.id}`}
    >
      <div className="flex items-start gap-4">
        <ScoreBadge score={pillar.score} />
        <div className="min-w-0 flex-1">
          <div
            className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider"
            style={{ color: pillarHueText(pillar.id) }}
          >
            Pillar {pillar.id}
          </div>
          <h2
            id={`pillar-${pillar.id}`}
            className="mt-0.5 text-lg font-semibold tracking-tight text-foreground"
          >
            {pillar.title}
          </h2>
          <p className="text-sm text-muted">
            {pillar.question}
            <InfoIcon label={pillar.title} />
          </p>
        </div>
      </div>

      {pillar.framingNote && (
        <p className="mt-4 rounded-lg border border-border/70 bg-surface-2/60 px-3.5 py-2.5 text-sm leading-relaxed text-muted">
          {pillar.framingNote}
        </p>
      )}

      {notAssessed ? (
        <div className="mt-4 flex items-center gap-2">
          <StatusPill status="inconclusive" />
          <span className="text-sm text-muted">Not assessed — never faked.</span>
        </div>
      ) : (
        <>
          {/* Constructive suggestion — up top, straight under the score, with a convert-to-issue action */}
          {pillar.fixes.length > 0 && (
            <div className="mt-4 rounded-lg border border-brand/20 bg-brand/[0.04] p-4">
              <h3 className="text-sm font-semibold text-foreground">
                Constructive suggestion{pillar.fixes.length > 1 ? "s" : ""}
              </h3>
              <ul className="mt-2 space-y-2">
                {pillar.fixes.map((fix) => (
                  <li key={fix.check} className="flex gap-2.5 text-sm leading-relaxed">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                    <span className="text-foreground/90">
                      {fix.text}
                      <InfoIcon label={fix.check} />
                    </span>
                  </li>
                ))}
              </ul>
              <PillarIssueButton
                owner={report.repo.owner}
                repo={report.repo.name}
                title={buildPillarIssueTitle(report, pillar)}
                body={buildPillarIssueMarkdown(report, pillar)}
                prefilledUrl={prefilledPillarIssueUrl(report, pillar)}
                oauthConfigured={oauthConfigured}
              />
            </div>
          )}

          {shown.length > 0 && (
            <>
              <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-muted/70 light:text-muted">
                {shownConcerns > 0 ? `Worth addressing · ${shownConcerns}` : "Checks"}
              </p>
              <ul className="mt-1 divide-y divide-border/60">
                {shown.map((f) => (
                  <FindingRow key={f.check} finding={f} />
                ))}
              </ul>
            </>
          )}

          {collapsed.length > 0 && (
            <details className="group mt-3">
              <summary className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-brand">
                <span className="transition-transform group-open:rotate-90" aria-hidden>
                  ▸
                </span>
                {moreLabel}
              </summary>
              <ul className="mt-1 divide-y divide-border/60">
                {collapsed.map((f) => (
                  <FindingRow key={f.check} finding={f} />
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </section>
  );
}
