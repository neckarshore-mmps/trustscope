/**
 * Report-Core types — the AP-1 anchor (work-order §5 Phase 1, §4).
 *
 * The Report-Core is a PURE function: (scorecard JSON + normalized GitHub data) -> ReportModel.
 * No framework imports, no I/O, no clock. Everything downstream (UI, persistence, OAuth flow)
 * builds on this shape. Shapes below were verified against the real OpenSSF Scorecard API and a
 * real `docker run gcr.io/openssf/scorecard` output on 2026-07-01.
 */

// ---------------------------------------------------------------------------
// Raw OpenSSF Scorecard result (the subset we consume).
// ---------------------------------------------------------------------------

export interface ScorecardDoc {
  short: string;
  url: string;
}

export interface ScorecardCheck {
  name: string;
  /** 0-10, or -1 = inconclusive (Scorecard could not determine). */
  score: number;
  reason: string;
  details: string[] | null;
  documentation?: ScorecardDoc;
}

export interface ScorecardResult {
  /** ISO date of the assessment. */
  date: string;
  repo: { name: string; commit: string };
  scorecard: { version: string; commit: string };
  /** Scorecard's own aggregate — captured but deliberately NOT surfaced (framework doctrine). */
  score: number;
  checks: ScorecardCheck[];
}

// ---------------------------------------------------------------------------
// Normalized GitHub data (from GET /repos + GET /repos/.../community/profile).
// ---------------------------------------------------------------------------

export interface GitHubData {
  ownerLogin: string;
  /** "Organization" | "User" | ... */
  ownerType: string;
  repoName: string;
  htmlUrl: string;
  licenseSpdxId: string | null;
  /** ISO timestamp of the last push, or null. */
  pushedAt: string | null;
  archived: boolean;
  hasIssuesEnabled: boolean;
  openIssuesCount: number;
  stargazersCount: number;
  /** community profile files.security present. */
  hasSecurityPolicy: boolean;
  hasContributing: boolean;
  hasCodeOfConduct: boolean;
  healthPercentage: number | null;
}

// ---------------------------------------------------------------------------
// Report model.
// ---------------------------------------------------------------------------

export type FindingStatus = "pass" | "warn" | "fail" | "inconclusive" | "info";

export interface Finding {
  /** Scorecard check name, or a synthetic key (e.g. "Owner-Type"). */
  check: string;
  label: string;
  status: FindingStatus;
  /** 0-10 for scored Scorecard checks; null for synthetic/inconclusive findings. */
  score: number | null;
  reason: string;
  details?: string[];
  docUrl?: string;
  source: "scorecard" | "github";
}

export interface Fix {
  check: string;
  text: string;
}

export interface DueDiligenceSignal {
  /** Stable key, e.g. "no-license". */
  id: string;
  title: string;
  /** Why it matters, from the adopter's side — calm, never accusatory. */
  detail: string;
  /** A constructive next step, or null when there is nothing to do. */
  mitigation: string | null;
  /** The pillar this signal relates to. */
  pillarKey: PillarKey;
  /** The pillar's numeric id — links the signal to its `#pillar-{id}` section (V2 amendment §D). */
  pillarId: 1 | 2 | 3 | 4;
}

export type PillarKey =
  | "functional-quality"
  | "security-supply-chain"
  | "trust-governance"
  | "community-sustainability";

export type PillarStatus = "scored" | "not-assessed";

export interface Pillar {
  id: 1 | 2 | 3 | 4;
  key: PillarKey;
  title: string;
  question: string;
  status: PillarStatus;
  /** Mean of the scored Scorecard checks in this pillar (0-10); null when not-assessed. */
  score: number | null;
  scoreBasis: string;
  findings: Finding[];
  fixes: Fix[];
  framingNote?: string;
}

export interface ReportRepo {
  owner: string;
  name: string;
  url: string;
  commit: string | null;
}

export interface ReportModel {
  product: string;
  repo: ReportRepo;
  /** ISO date Scorecard assessed the repo. */
  assessedAt: string;
  /** ISO timestamp the report model was built. */
  generatedAt: string;
  scorecard: { version: string; commit: string } | null;
  /** Always null — no single aggregate score by design (framework doctrine). */
  aggregateScore: null;
  aggregateNote: string;
  pillars: [Pillar, Pillar, Pillar, Pillar];
}
