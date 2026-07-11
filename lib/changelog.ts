import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The website `/changelog` view — curated end-user highlights, single-sourced from
 * the `## [public]` section of `CHANGELOG.md` (the repo's one changelog file).
 *
 * Parsed at BUILD time (the `/changelog` route is force-static), so there is no
 * runtime filesystem access and no markdown-renderer dependency: the output is
 * deterministic, typed, and rendered as plain text — the same guarantees the old
 * typed `config/changelog.ts` gave, now with a single source instead of a
 * hand-synced duplicate (which drifted). See DECISIONS.md §8.
 */
export interface ChangelogEntry {
  version: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  changes: string[];
}

const PUBLIC_HEADING = /^##\s+\[public\]\s*$/i;
const SECTION_HEADING = /^##\s+/;
const ENTRY_HEADING = /^###\s+v(\d+\.\d+\.\d+)\s+[—–-]\s+(\d{4}-\d{2}-\d{2})\s*$/;
const BULLET = /^-\s+(.+?)\s*$/;

/**
 * Parse the `## [public]` section of a CHANGELOG.md string into typed entries,
 * newest first. Pure and deterministic — no I/O — so it is unit-testable.
 *
 * Throws on a missing/empty/malformed section: the page depends on this data, so a
 * broken changelog must fail the build loudly rather than ship an empty view.
 */
export function parsePublicChangelog(markdown: string): ChangelogEntry[] {
  const lines = markdown.split("\n");

  const start = lines.findIndex((l) => PUBLIC_HEADING.test(l));
  if (start === -1) {
    throw new Error("CHANGELOG.md: missing a `## [public]` section (the /changelog source).");
  }

  const entries: ChangelogEntry[] = [];
  let current: ChangelogEntry | null = null;

  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];

    // End of the [public] section at the next `## ` heading.
    if (SECTION_HEADING.test(line)) break;

    const entryMatch = line.match(ENTRY_HEADING);
    if (entryMatch) {
      current = { version: entryMatch[1], date: entryMatch[2], changes: [] };
      entries.push(current);
      continue;
    }

    const bulletMatch = line.match(BULLET);
    if (bulletMatch && current) {
      current.changes.push(bulletMatch[1]);
    }
    // Everything else (blank lines, HTML comments, prose) is ignored.
  }

  if (entries.length === 0) {
    throw new Error("CHANGELOG.md: the `## [public]` section has no `### v<x.y.z> — <date>` entries.");
  }
  const empty = entries.find((e) => e.changes.length === 0);
  if (empty) {
    throw new Error(`CHANGELOG.md: public entry v${empty.version} has no bullet points.`);
  }

  return entries;
}

/** Build-time read of the repo's CHANGELOG.md; consumed by the static /changelog route. */
export const CHANGELOG: ChangelogEntry[] = parsePublicChangelog(
  readFileSync(join(process.cwd(), "CHANGELOG.md"), "utf8"),
);
