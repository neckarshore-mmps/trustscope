import type { Pillar, ReportModel } from "@/lib/report-core/types";

/** Pure, deterministic report-orientation derivations (mirror lib/report-export.ts). No LLM, no clock. */

type Band = "strong" | "moderate" | "concern" | "not-assessed";

// Thresholds match build-report.ts (PASS_THRESHOLD = 8, FAIL_THRESHOLD = 3) so a pillar the core
// would call "pass" is never labelled "moderate" here (V2 amendment §C).
function band(p: Pillar): Band {
  if (p.status === "not-assessed" || p.score === null) return "not-assessed";
  if (p.score >= 8) return "strong";
  if (p.score <= 3) return "concern";
  return "moderate";
}

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

export function reportSynthesis(report: ReportModel): string {
  const strong: string[] = [];
  const moderate: string[] = [];
  const concern: string[] = [];
  let notAssessed = false;
  for (const p of report.pillars) {
    const name = SHORT[p.key] ?? p.title.toLowerCase();
    switch (band(p)) {
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
        notAssessed = true;
    }
  }
  const clauses: string[] = [];
  if (strong.length) clauses.push(`strong on ${list(strong)}`);
  if (moderate.length) clauses.push(`moderate on ${list(moderate)}`);
  if (concern.length) clauses.push(`worth checking on ${list(concern)}`);
  let s = clauses.length ? clauses.join("; ") : "no pillar could be scored";
  s = s.charAt(0).toUpperCase() + s.slice(1) + ".";
  if (notAssessed) {
    s += " Functional quality isn't assessed — it's a hands-on judgement, never faked.";
  }
  return s;
}

/**
 * Presentational pillar order: scored pillars lead, not-assessed pillars trail (#314 — the N/A
 * functional-quality pillar must never OPEN the report; a field-tester read the N/A-opener twice as
 * "is this a bug?"). Stable — relative order within each group is preserved. Display-only: the core
 * `ReportModel.pillars` order and the deterministic export are untouched, so "same repo → same
 * report" (D9) still holds.
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
