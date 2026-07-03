import { PILLAR_META } from "./pillars";
import type { DueDiligenceSignal, GitHubData, PillarKey } from "./types";

const ACTIVITY_WINDOW_DAYS = 90;

function daysBetween(aIso: string, bIso: string): number | null {
  const a = Date.parse(aIso);
  const b = Date.parse(bIso);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.abs(a - b) / 86_400_000;
}

/** Derive the numeric pillar id from its key (V2 amendment §D) so the panel can link to #pillar-{id}. */
function pillarId(key: PillarKey): 1 | 2 | 3 | 4 {
  return PILLAR_META[key].id;
}

/**
 * Batch 1 quiet signals from existing normalized GitHub data (TS16).
 * Calm + constructive (D1/D2): each is a reflective nudge with a mitigation, never a score,
 * never an accusation. Batch 2 (install-scripts, star-anomaly) slots in here unchanged.
 */
export function detectDueDiligence(
  github: GitHubData,
  assessedAt: string,
): DueDiligenceSignal[] {
  const signals: DueDiligenceSignal[] = [];

  if (github.licenseSpdxId === null) {
    signals.push({
      id: "no-license",
      title: "No license",
      detail:
        "Without a license the code is “all rights reserved” by default — legally you can’t use it in your build.",
      mitigation:
        "Ask the maintainer to add a LICENSE file (TrustScope can file a friendly issue).",
      pillarKey: "trust-governance",
      pillarId: pillarId("trust-governance"),
    });
  }

  if (!github.hasSecurityPolicy) {
    signals.push({
      id: "no-security-contact",
      title: "No security policy",
      // §D: repository-scoped, not an absolute claim — a SECURITY.md may live in an org .github repo.
      detail:
        "No security policy detected on this repository — no documented way to report a vulnerability responsibly (no SECURITY.md or contact channel here).",
      mitigation: "Suggest adding a SECURITY.md with a disclosure contact.",
      pillarKey: "trust-governance",
      pillarId: pillarId("trust-governance"),
    });
  }

  const days = github.pushedAt ? daysBetween(assessedAt, github.pushedAt) : null;
  if (github.archived) {
    signals.push({
      id: "archived",
      title: "Archived repository",
      detail: "The repository is archived — no further development is expected.",
      mitigation: null,
      pillarKey: "community-sustainability",
      pillarId: pillarId("community-sustainability"),
    });
  } else if (days !== null && days > ACTIVITY_WINDOW_DAYS) {
    signals.push({
      id: "low-activity",
      title: "Low recent activity",
      detail: `Last pushed about ${Math.round(days)} days before assessment — outside the ${ACTIVITY_WINDOW_DAYS}-day activity window. Not necessarily abandoned, but worth a second look.`,
      mitigation: null,
      pillarKey: "community-sustainability",
      pillarId: pillarId("community-sustainability"),
    });
  }

  return signals;
}
