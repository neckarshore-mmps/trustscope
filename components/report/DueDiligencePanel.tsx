import type { ReportModel } from "@/lib/report-core/types";

const PILLAR_LABEL: Record<string, string> = {
  "functional-quality": "Functional Quality",
  "security-supply-chain": "Security & Supply Chain",
  "trust-governance": "Trust & Governance",
  "community-sustainability": "Community & Sustainability",
};

export function DueDiligencePanel({ report }: { report: ReportModel }) {
  if (report.dueDiligence.length === 0) return null;
  return (
    <section
      data-testid="due-diligence"
      className="mt-6 rounded-xl border border-amber-400/25 bg-amber-400/[0.04] p-5"
    >
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
        Due Diligence — worth a second look
      </h2>
      <ul className="mt-3 space-y-3">
        {report.dueDiligence.map((s) => (
          <li key={s.id}>
            <div className="flex items-baseline gap-2">
              {/* §D: link the signal to its pillar section (#pillar-{id}), which carries this id. */}
              <a
                href={`#pillar-${s.pillarId}`}
                className="font-semibold tracking-tight hover:text-brand hover:underline"
              >
                {s.title}
              </a>
              <span className="text-xs text-muted">· {PILLAR_LABEL[s.pillarKey]}</span>
            </div>
            <p className="mt-0.5 text-sm leading-relaxed text-muted">{s.detail}</p>
            {s.mitigation && (
              <p className="mt-0.5 text-sm leading-relaxed text-brand">{s.mitigation}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
