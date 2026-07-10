import type { Pillar, ReportModel } from "@/lib/report-core/types";
import { displayPillars, pillarBand } from "@/lib/report-display";

/** Pure, deterministic report-orientation derivations (mirror lib/report-export.ts). No LLM, no clock. */

const SHORT: Record<string, string> = {
  "functional-quality": "functional quality",
  "security-supply-chain": "security",
  "trust-governance": "governance",
  "community-sustainability": "community",
};

function list(items: string[]): string {
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/**
 * One-line orientation over the SHOWN pillars (Functional Quality is out of the non-Pro product, so
 * it never appears here). Bands match the visible tile colours via pillarBand.
 */
export function reportSynthesis(report: ReportModel): string {
  const strong: string[] = [];
  const moderate: string[] = [];
  const concern: string[] = [];
  const notScored: string[] = [];
  for (const p of displayPillars(report.pillars)) {
    const name = SHORT[p.key] ?? p.title.toLowerCase();
    switch (pillarBand(p.score)) {
      case "strong":
        strong.push(name);
        break;
      case "moderate":
        moderate.push(name);
        break;
      case "concern":
        concern.push(name);
        break;
      default:
        notScored.push(name);
    }
  }
  const clauses: string[] = [];
  if (strong.length) clauses.push(`strong on ${list(strong)}`);
  if (moderate.length) clauses.push(`moderate on ${list(moderate)}`);
  if (concern.length) clauses.push(`worth checking on ${list(concern)}`);
  let s = clauses.length ? clauses.join("; ") : "no pillar could be scored";
  s = s.charAt(0).toUpperCase() + s.slice(1) + ".";
  if (notScored.length) {
    const names = list(notScored);
    s += ` ${names.charAt(0).toUpperCase() + names.slice(1)} couldn't be scored.`;
  }
  return s;
}

/**
 * Presentational pillar order: scored pillars lead, not-assessed pillars trail (#314 — the N/A
 * functional-quality pillar must never OPEN the report; a field-tester read the N/A-opener twice as
 * "is this a bug?"). Stable — relative order within each group is preserved.
 *
 * Since the pillar renumber (Functional Quality → Pillar 4), the core `ReportModel.pillars` order
 * already trails Functional Quality last, so this is a no-op for the common case. It remains as an
 * edge-case safety net: any OTHER pillar that comes back not-assessed (e.g. Security with zero
 * Scorecard checks) is still pushed behind the scored ones. Display-only — the deterministic export
 * reads the core order, so "same repo → same report" (D9) still holds.
 */
export function orderedPillars(pillars: Pillar[]): Pillar[] {
  const scored = pillars.filter((p) => p.status === "scored");
  const trailed = pillars.filter((p) => p.status !== "scored");
  return [...scored, ...trailed];
}

export interface CoverageSummary {
  assessed: string[];
  notAssessed: string[];
  inconclusive: string[];
}

export function reportCoverage(report: ReportModel): CoverageSummary {
  const assessed: string[] = [];
  const notAssessed: string[] = [];
  const inconclusive: string[] = [];
  for (const p of report.pillars) {
    (p.status === "scored" ? assessed : notAssessed).push(p.title);
    for (const f of p.findings) {
      if (f.status === "inconclusive") inconclusive.push(f.label);
    }
  }
  return { assessed, notAssessed, inconclusive };
}

export function isCleanReport(report: ReportModel): boolean {
  return report.pillars.every((p) =>
    p.findings.every((f) => f.status !== "fail" && f.status !== "warn"),
  );
}
