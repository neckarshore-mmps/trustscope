import type { ReportModel } from "@/lib/report-core/types";
import { isCleanReport, reportCoverage, reportSynthesis } from "@/lib/report-summary";

export function ReportSummary({ report }: { report: ReportModel }) {
  const cov = reportCoverage(report);
  const clean = isCleanReport(report);
  return (
    <div className="mt-6">
      <div
        data-testid="report-synthesis"
        className="rounded-xl border border-brand/20 bg-brand/[0.04] p-5 text-[15px] leading-relaxed"
      >
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
          In short
        </span>
        {reportSynthesis(report)}
      </div>

      {clean && (
        <p className="mt-3 text-sm text-emerald-300">
          Nothing flagged across the assessed pillars — this project looks solid.
        </p>
      )}

      <p data-testid="report-coverage" className="mt-3 text-xs text-muted/80">
        Assessed: {cov.assessed.join(", ") || "none"}
        {" · "}Not assessed: {cov.notAssessed.join(", ") || "none"}
        {cov.inconclusive.length > 0 && (
          <>
            {" · "}Inconclusive: {cov.inconclusive.length}
          </>
        )}
      </p>
    </div>
  );
}
