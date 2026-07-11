import Link from "next/link";
import type { ReportModel } from "@/lib/report-core/types";
import type { ScorecardSource } from "@/lib/adapters";
import { displayPillars } from "@/lib/report-display";
import { BodoBadge } from "@/components/BodoBadge";
import { REPORT_BODO_BACKDROP } from "@/config/bodo";
import { PillarCard } from "./PillarCard";
import { ExportActions } from "./ExportActions";
import { InfoIcon } from "./InfoIcon";
import { Scoreboard } from "./Scoreboard";
import { Tldr } from "./Tldr";

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
  const oauthConfigured = Boolean(
    process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
  );

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      {/* Masthead — the repo identity as hero (mono repo-path), the no-grade doctrine foregrounded */}
      <header>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Identity lockup — Bodo (the reporter) hands you the report, sitting to the left of the
              repo identity. Sized so the disc spans from the eyebrow down to the assessed line; the
              aggregate note below flows full-width under the disc, wrapping the text around it. */}
          <div className="flex items-start gap-4 sm:gap-5">
            <BodoBadge
              backdrop={REPORT_BODO_BACKDROP}
              sizeClass="h-[88px] w-[88px] flex-none sm:h-24 sm:w-24"
            />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
                Trust report
              </p>
              <h1 className="mt-1.5 break-words font-mono text-2xl font-semibold tracking-tight sm:text-[2rem]">
                <a
                  href={report.repo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-brand"
                >
                  <span className="text-muted">{report.repo.owner}/</span>
                  {report.repo.name}
                </a>
              </h1>
              <p className="mt-2 text-sm text-muted">
                Assessed {fmtDate(report.assessedAt)}
                {report.scorecard && <> · Scorecard {report.scorecard.version}</>} · via{" "}
                {source === "fastpath" ? "OpenSSF dataset" : "on-demand run"}
                {cached && " · cached"}
                <InfoIcon label="how this was assessed" />
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex w-fit shrink-0 items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-brand/40"
          >
            ← Assess another repo
          </Link>
        </div>
        <p className="mt-4 max-w-2xl border-l-2 border-brand/40 pl-3 text-sm leading-relaxed text-muted">
          {report.aggregateNote}
          <InfoIcon label="why there is no single score" />
        </p>
      </header>

      {/* Scoreboard — the per-pillar scores surfaced at the very top (#403 a) */}
      <Scoreboard report={report} />

      {/* TL;DR — the two-second read, due diligence folded in, ground colour = worst pillar */}
      <Tldr report={report} />

      {/* Pillars — fixed order P1 → P2 → P3 (never reordered by findings); Functional Quality is Pro-only.
          Each pillar with fixes carries its own Convert-to-issue control (the reputation mechanism);
          the former bulk "Send the suggestions upstream" section is retired. */}
      <div className="mt-6 grid gap-4">
        {displayPillars(report.pillars).map((p) => (
          <PillarCard key={p.id} pillar={p} report={report} oauthConfigured={oauthConfigured} />
        ))}
      </div>

      {/* Export — always shown, independent of fixes (§A slot 7) */}
      <ExportActions report={report} />

      <p className="mt-8 text-center text-xs text-muted/70">
        Report generated {fmtDate(report.generatedAt)} · commit{" "}
        <code className="font-mono">{report.repo.commit?.slice(0, 7) ?? "unknown"}</code>
      </p>
    </div>
  );
}
