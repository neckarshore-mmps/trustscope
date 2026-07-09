/**
 * Human-readable changelog, newest first. Typed rather than a rendered Markdown file — no markdown
 * renderer dependency, deterministic output, and a single typed source. Rendered by /changelog and
 * linked from the footer (MDViewer-style status line).
 */
export interface ChangelogEntry {
  version: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.1.0",
    date: "2026-07-06",
    changes: [
      "Public launch — deterministic four-pillar trust reports built on the OpenSSF Scorecard, with no misleading single score.",
      "Adopter and maintainer paths, a searchable repo picker with recently-viewed, and Markdown / HTML export.",
      "Constructive upstream issue-filing as yourself, carrying a “via TrustScope” attribution footer.",
    ],
  },
];
