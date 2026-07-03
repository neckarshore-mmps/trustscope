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
