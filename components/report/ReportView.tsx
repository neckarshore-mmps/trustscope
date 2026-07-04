import Link from "next/link";
import type { ReportModel } from "@/lib/report-core/types";
import type { ScorecardSource } from "@/lib/adapters";
import { PillarCard } from "./PillarCard";
import { IssueActions } from "./IssueActions";
import { ReportSummary } from "./ReportSummary";
import { DueDiligencePanel } from "./DueDiligencePanel";
import { ExportActions } from "./ExportActions";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function ReportView({
  report,
  source,
  cached = false,
}: {
  report: ReportModel;
  source: ScorecardSource;
  cached?: boolean;
}) {
  const totalFixes = report.pillars.reduce((n, p) => n + p.fixes.length, 0);
  const oauthConfigured = Boolean(
    process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
  );

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted">Trust report for</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            <a
              href={report.repo.url}
              target="_blank"
              rel="noreferrer"
              className="hover:text-brand"
            >
              {report.repo.owner}/{report.repo.name}
            </a>
          </h1>
          <p className="mt-2 text-sm text-muted">
            Assessed {fmtDate(report.assessedAt)}
            {report.scorecard && (
              <> · Scorecard {report.scorecard.version}</>
            )}{" "}
            · via {source === "fastpath" ? "OpenSSF dataset" : "on-demand run"}
            {cached && " · cached"}
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-brand/40"
        >
          ← Assess another repo
        </Link>
      </div>

      {/* Orientation layer — the 2-second read: synthesis + coverage + good-case (§A slot 2) */}
      <ReportSummary report={report} />

      {/* Due-diligence panel — quiet signals worth a second look (§A slot 3) */}
      <DueDiligencePanel report={report} />

      {/* No-aggregate rationale — the reputation differentiator, foregrounded */}
      <div className="mt-6 rounded-xl border border-brand/20 bg-brand/[0.04] p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-brand">
            Four pillars, no single grade
          </span>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
          {report.aggregateNote} That four-pillar synthesis — security, governance,
          community, and an honest “not assessed” for functional quality — is what {report.product}{" "}
          adds on top of the raw Scorecard.
        </p>
      </div>

      {/* Pillars */}
      <div className="mt-6 grid gap-4">
        {report.pillars.map((p) => (
          <PillarCard key={p.id} pillar={p} />
        ))}
      </div>

      {/* Constructive upstream action — the reputation mechanism */}
      {totalFixes > 0 && (
        <IssueActions
          report={report}
          totalFixes={totalFixes}
          oauthConfigured={oauthConfigured}
        />
      )}

      {/* Export — always shown, independent of totalFixes (§A slot 7) */}
      <ExportActions report={report} />

      <p className="mt-8 text-center text-xs text-muted/70">
        Report generated {fmtDate(report.generatedAt)} · commit{" "}
        <code className="font-mono">{report.repo.commit?.slice(0, 7) ?? "unknown"}</code>
      </p>
    </div>
  );
}
