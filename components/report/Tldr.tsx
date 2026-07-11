import type { ReportModel } from "@/lib/report-core/types";
import { type Band, displayDueDiligence, tldrBand } from "@/lib/report-display";
import { reportSynthesis } from "@/lib/report-summary";

/**
 * TL;DR — the two-second read, with the due-diligence signals folded in. Its ground colour follows
 * the WORST shown pillar (Founder 2026-07-10): a colour, never a number, so the "no single aggregate
 * score" doctrine holds. A soft ground — a pointer, not a verdict. No info affordance inside the
 * TL;DR (Founder: keep it clean).
 */
const BAND_STYLE: Record<Band, { box: string; chip: string; divider: string; label: string }> = {
  concern: {
    box: "border-rose-400/30 bg-rose-400/[0.06]",
    chip: "bg-rose-400/[0.14] text-rose-300 light:text-rose-700",
    divider: "border-rose-400/25",
    label: "Worth a closer look",
  },
  moderate: {
    box: "border-amber-400/30 bg-amber-400/[0.06]",
    chip: "bg-amber-400/[0.12] text-amber-300 light:text-amber-700",
    divider: "border-amber-400/25",
    label: "Mixed — worth a look",
  },
  strong: {
    box: "border-emerald-400/30 bg-emerald-400/[0.06]",
    chip: "bg-emerald-400/[0.12] text-emerald-300 light:text-emerald-700",
    divider: "border-emerald-400/25",
    label: "Looks solid",
  },
  na: {
    box: "border-border bg-surface/60",
    chip: "bg-surface-2 text-muted",
    divider: "border-border",
    label: "Not assessed",
  },
};

const PILLAR_LABEL: Record<string, string> = {
  "functional-quality": "Functional Quality",
  "security-supply-chain": "Security & Supply Chain",
  "trust-governance": "Trust & Governance",
  "community-sustainability": "Community & Sustainability",
};

export function Tldr({ report }: { report: ReportModel }) {
  const s = BAND_STYLE[tldrBand(report.pillars)];
  const dueDiligence = displayDueDiligence(report);
  return (
    <section
      data-testid="report-tldr"
      aria-label="TL;DR"
      className={`mt-6 rounded-xl border p-5 sm:p-6 ${s.box}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-bold tracking-tight">TL;DR</h2>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${s.chip}`}
        >
          {s.label}
        </span>
      </div>
      <p data-testid="report-synthesis" className="mt-3 text-[15px] leading-relaxed">
        {reportSynthesis(report)}
      </p>

      {dueDiligence.length > 0 && (
        <div data-testid="due-diligence" className={`mt-4 border-t pt-4 ${s.divider}`}>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Due Diligence — worth a second look
          </h3>
          <ul className="mt-3 space-y-3">
            {dueDiligence.map((d) => (
              <li key={d.id}>
                <div className="flex flex-wrap items-baseline gap-2">
                  <a
                    href={`#pillar-${d.pillarId}`}
                    className="font-semibold tracking-tight hover:text-brand hover:underline"
                  >
                    {d.title}
                  </a>
                  <span className="text-xs text-muted">· {PILLAR_LABEL[d.pillarKey]}</span>
                </div>
                <p className="mt-0.5 text-sm leading-relaxed text-muted">{d.detail}</p>
                {d.mitigation && (
                  <p className="mt-0.5 text-sm leading-relaxed text-brand">{d.mitigation}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
