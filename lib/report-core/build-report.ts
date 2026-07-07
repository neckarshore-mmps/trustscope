import { PRODUCT_NAME } from "@/config/product";
import { detectDueDiligence } from "./due-diligence";
import { FIX_TEXT } from "./fix-text";
import { PILLAR_META, pillarForCheck } from "./pillars";
import type {
  Finding,
  Fix,
  GitHubData,
  ManifestData,
  Pillar,
  ReportModel,
  ScorecardCheck,
  ScorecardResult,
} from "./types";

/**
 * The Report-Core (work-order §5 Phase 1) — PURE and deterministic.
 * (scorecard result + normalized GitHub data + a caller-supplied timestamp) -> ReportModel.
 * No I/O, no clock, no framework imports. Same input -> same output, always.
 */

const PASS_THRESHOLD = 8; // score >= 8 -> pass
const FAIL_THRESHOLD = 3; // score <= 3 -> fail; in-between -> warn
const ACTIVITY_WINDOW_DAYS = 90;

function checkStatus(score: number): Finding["status"] {
  if (score < 0) return "inconclusive";
  if (score >= PASS_THRESHOLD) return "pass";
  if (score <= FAIL_THRESHOLD) return "fail";
  return "warn";
}

function humanLabel(checkName: string): string {
  return checkName.replace(/-/g, " ");
}

/** "github.com/owner/repo" (or a URL) -> { owner, name }. */
export function parseOwnerRepo(scorecardRepoName: string): {
  owner: string;
  name: string;
} {
  const parts = scorecardRepoName.replace(/^https?:\/\//, "").split("/").filter(Boolean);
  const hostIdx = parts.findIndex((p) => p.includes("."));
  const base = hostIdx >= 0 ? parts.slice(hostIdx + 1) : parts;
  return { owner: base[0] ?? "unknown", name: base[1] ?? "unknown" };
}

function scorecardFinding(check: ScorecardCheck): Finding {
  return {
    check: check.name,
    label: humanLabel(check.name),
    status: checkStatus(check.score),
    score: check.score < 0 ? null : check.score,
    reason: check.reason,
    details: check.details ?? undefined,
    docUrl: check.documentation?.url,
    source: "scorecard",
  };
}

/** Mean (1-decimal) of the SCORED Scorecard findings; null if none scored. */
function meanScorecardScore(findings: Finding[]): number | null {
  const scored = findings.filter(
    (f) => f.source === "scorecard" && typeof f.score === "number",
  );
  if (scored.length === 0) return null;
  const sum = scored.reduce((acc, f) => acc + (f.score as number), 0);
  return Math.round((sum / scored.length) * 10) / 10;
}

/** One constructive fix per low (warn/fail) finding that has §3 fix text. */
function fixesFor(findings: Finding[]): Fix[] {
  const seen = new Set<string>();
  const fixes: Fix[] = [];
  for (const f of findings) {
    const low = f.status === "warn" || f.status === "fail";
    if (low && FIX_TEXT[f.check] && !seen.has(f.check)) {
      seen.add(f.check);
      fixes.push({ check: f.check, text: FIX_TEXT[f.check] });
    }
  }
  return fixes;
}

function daysBetween(aIso: string, bIso: string): number | null {
  const a = Date.parse(aIso);
  const b = Date.parse(bIso);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.abs(a - b) / 86_400_000;
}

function byCheck(a: Finding, b: Finding): number {
  return a.check.localeCompare(b.check);
}

// --- Pillar 4: Functional Quality — always honestly not-assessed. --------------------

function functionalQualityPillar(): Pillar {
  const m = PILLAR_META["functional-quality"];
  return {
    id: m.id,
    key: "functional-quality",
    title: m.title,
    question: m.question,
    status: "not-assessed",
    score: null,
    scoreBasis:
      "Not assessed. Whether software is well-built is a hands-on judgement — TrustScope never infers it from automated signals, and never fakes it.",
    findings: [],
    fixes: [],
    framingNote:
      "Deliberately not scored. A hands-on trial is the only honest source for “is it well-built?”",
  };
}

// --- Pillar 1: Security & Supply Chain — the Scorecard security checks. ---------------

function securityPillar(checks: ScorecardCheck[]): Pillar {
  const m = PILLAR_META["security-supply-chain"];
  const findings = checks
    .filter((c) => pillarForCheck(c.name) === "security-supply-chain")
    .map(scorecardFinding)
    .sort(byCheck);
  return {
    id: m.id,
    key: "security-supply-chain",
    title: m.title,
    question: m.question,
    status: findings.length ? "scored" : "not-assessed",
    score: meanScorecardScore(findings),
    scoreBasis:
      "Mean of the OpenSSF Scorecard security & supply-chain checks (0–10). Inconclusive checks are excluded.",
    findings,
    fixes: fixesFor(findings),
  };
}

// --- Pillar 2: Trust & Governance — Scorecard License/Security-Policy + GitHub signals. --

function trustGovernancePillar(checks: ScorecardCheck[], gh: GitHubData): Pillar {
  const m = PILLAR_META["trust-governance"];
  const scorecardFindings = checks
    .filter((c) => pillarForCheck(c.name) === "trust-governance")
    .map(scorecardFinding);

  const isOrg = gh.ownerType === "Organization";
  const ownerFinding: Finding = {
    check: "Owner-Type",
    label: "Project ownership",
    status: isOrg ? "pass" : "info",
    score: null,
    reason: isOrg
      ? `Owned by the organization “${gh.ownerLogin}” — organizational ownership signals shared governance.`
      : `Owned by the individual account “${gh.ownerLogin}”. Single-owner projects can be well-run, but consider the bus-factor.`,
    source: "github",
  };

  // §3 fail-open guard: when the community profile couldn't be read (403/5xx/timeout), the
  // security-policy signal is UNKNOWN — surface it as inconclusive, never as a confident "no channel".
  const contactFinding: Finding = gh.communityProfileFetched
    ? {
        check: "Contact-Channel",
        label: "Contact channel",
        status: gh.hasSecurityPolicy ? "pass" : gh.hasIssuesEnabled ? "warn" : "fail",
        score: null,
        reason: gh.hasSecurityPolicy
          ? "A security policy provides a disclosure/contact channel."
          : gh.hasIssuesEnabled
            ? "No security policy detected via the GitHub community profile; issues are enabled as a fallback channel. (Scorecard may still credit a Security-Policy found in an org .github repo — see the Security-Policy finding.)"
            : "No security policy and issues are disabled — no clear channel to report problems.",
        source: "github",
      }
    : {
        check: "Contact-Channel",
        label: "Contact channel",
        status: "inconclusive",
        score: null,
        reason:
          "Couldn’t read the GitHub community profile (rate-limited or unavailable) — the security-policy signal is unknown, not absent.",
        source: "github",
      };

  const findings = [...scorecardFindings, ownerFinding, contactFinding].sort(byCheck);
  return {
    id: m.id,
    key: "trust-governance",
    title: m.title,
    question: m.question,
    status: scorecardFindings.length ? "scored" : "not-assessed",
    score: meanScorecardScore(findings),
    scoreBasis:
      "Mean of the Scorecard License & Security-Policy checks (0–10). GitHub governance signals (ownership, contact channel) are shown as context and do not change the number.",
    findings,
    fixes: fixesFor(findings),
    framingNote:
      "Combines Scorecard governance checks with GitHub project signals. Where the two disagree (e.g. a security policy inherited from an org .github repo), both are shown.",
  };
}

// --- Pillar 3: Community & Sustainability — lifecycle, not a grade. -------------------

function communityPillar(
  checks: ScorecardCheck[],
  gh: GitHubData,
  assessedAt: string,
): Pillar {
  const m = PILLAR_META["community-sustainability"];
  const scorecardFindings = checks
    .filter((c) => pillarForCheck(c.name) === "community-sustainability")
    .map(scorecardFinding);

  const days = gh.pushedAt ? daysBetween(assessedAt, gh.pushedAt) : null;
  const active = days !== null && days <= ACTIVITY_WINDOW_DAYS;
  const activityFinding: Finding = {
    check: "Recent-Activity",
    label: "Recent activity",
    status: gh.archived
      ? "fail"
      : days === null
        ? "inconclusive"
        : active
          ? "pass"
          : "warn",
    score: null,
    reason: gh.archived
      ? "The repository is archived — no further development is expected."
      : days === null
        ? "No last-push date available from the GitHub API."
        : active
          ? `Last pushed ${Math.round(days)} day(s) before assessment — active within the ${ACTIVITY_WINDOW_DAYS}-day window.`
          : `Last pushed ${Math.round(days)} day(s) before assessment — outside the ${ACTIVITY_WINDOW_DAYS}-day activity window.`,
    source: "github",
  };

  const issueFinding: Finding = {
    check: "Issue-Activity",
    label: "Issue / PR activity",
    status: gh.hasIssuesEnabled ? (gh.openIssuesCount > 0 ? "pass" : "info") : "info",
    score: null,
    reason: gh.hasIssuesEnabled
      ? `${gh.openIssuesCount} open issue(s)/PR(s) — an active tracker signals a live project.`
      : "Issues are disabled on this repository.",
    source: "github",
  };

  const findings = [...scorecardFindings, activityFinding, issueFinding].sort(byCheck);
  return {
    id: m.id,
    key: "community-sustainability",
    title: m.title,
    question: m.question,
    status: scorecardFindings.length ? "scored" : "not-assessed",
    score: meanScorecardScore(findings),
    scoreBasis:
      "Mean of the Scorecard Maintained & Contributors checks (0–10). Activity signals are shown as lifecycle context.",
    findings,
    fixes: fixesFor(findings),
    framingNote:
      "A lifecycle stage, not a grade. A solo or single-org project with few contributors is a stage of the lifecycle — not a weakness. Read a low score here as “smaller community”, not “worse project”.",
  };
}

// --- Entry point ---------------------------------------------------------------------

export interface BuildReportInput {
  scorecard: ScorecardResult;
  github: GitHubData;
  /** ISO timestamp; caller supplies it so the core stays deterministic/pure. */
  generatedAt: string;
  /** Root package.json facts (batch-2 seam); null when unread. */
  manifest?: ManifestData | null;
}

export function buildReport(input: BuildReportInput): ReportModel {
  const { scorecard, github, generatedAt, manifest = null } = input;
  const { owner, name } = parseOwnerRepo(scorecard.repo?.name ?? "");

  const pillars: [Pillar, Pillar, Pillar, Pillar] = [
    securityPillar(scorecard.checks ?? []),
    trustGovernancePillar(scorecard.checks ?? [], github),
    communityPillar(scorecard.checks ?? [], github, scorecard.date),
    functionalQualityPillar(),
  ];

  const dueDiligence = detectDueDiligence(github, manifest, scorecard.date);

  return {
    product: PRODUCT_NAME,
    repo: {
      owner,
      name,
      url: github.htmlUrl || `https://github.com/${owner}/${name}`,
      commit: scorecard.repo?.commit ?? null,
    },
    assessedAt: scorecard.date,
    generatedAt,
    scorecard: scorecard.scorecard
      ? { version: scorecard.scorecard.version, commit: scorecard.scorecard.commit }
      : null,
    aggregateScore: null,
    aggregateNote:
      "By design, TrustScope shows no single aggregate score. Each pillar answers a different question; collapsing them into one number hides the trade-offs that matter for an adoption decision.",
    pillars,
    dueDiligence,
  };
}
