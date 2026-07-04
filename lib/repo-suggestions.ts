import type { SeedRepo } from "@/config/seed-repos";
import type { RecentRepo } from "./recent-repos";

export interface Suggestion {
  owner: string;
  repo: string;
  kind: "pinned" | "recent" | "seed";
}

const slug = (r: { owner: string; repo: string }) => `${r.owner}/${r.repo}`;

/** pinned seeds → recently-viewed (recency, as given) → remaining seeds A→Z, deduped by slug. */
export function buildSuggestions(seeds: SeedRepo[], recent: RecentRepo[]): Suggestion[] {
  const out: Suggestion[] = [];
  const seen = new Set<string>();
  for (const s of seeds.filter((x) => x.pinned)) {
    out.push({ owner: s.owner, repo: s.repo, kind: "pinned" });
    seen.add(slug(s));
  }
  for (const r of recent) {
    if (seen.has(slug(r))) continue;
    seen.add(slug(r));
    out.push({ owner: r.owner, repo: r.repo, kind: "recent" });
  }
  const rest = seeds
    .filter((s) => !s.pinned && !seen.has(slug(s)))
    .sort((a, b) => slug(a).localeCompare(slug(b)));
  for (const s of rest) {
    seen.add(slug(s));
    out.push({ owner: s.owner, repo: s.repo, kind: "seed" });
  }
  return out;
}

/** Case-insensitive substring filter on owner/repo. Empty query returns all. */
export function filterSuggestions(list: Suggestion[], query: string): Suggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((s) => slug(s).toLowerCase().includes(q));
}
