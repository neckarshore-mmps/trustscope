import { describe, expect, it } from "vitest";
import type { SeedRepo } from "@/config/seed-repos";
import type { RecentRepo } from "./recent-repos";
import { buildSuggestions, filterSuggestions } from "./repo-suggestions";

const seeds: SeedRepo[] = [
  { owner: "neckarshore-mmps", repo: "trustscope", pinned: true },
  { owner: "ossf", repo: "scorecard" },
  { owner: "sindresorhus", repo: "got" },
];
const recent: RecentRepo[] = [
  { owner: "acme", repo: "widget", viewedAt: "2026-07-02T00:00:00Z" },
];

describe("buildSuggestions", () => {
  it("orders pinned → recent → remaining seeds A→Z, deduped", () => {
    const out = buildSuggestions(seeds, recent).map((s) => `${s.owner}/${s.repo}`);
    expect(out).toEqual([
      "neckarshore-mmps/trustscope",
      "acme/widget",
      "ossf/scorecard",
      "sindresorhus/got",
    ]);
  });
  it("does not double-list a recent repo that is also a seed", () => {
    const out = buildSuggestions(seeds, [
      { owner: "ossf", repo: "scorecard", viewedAt: "2026-07-02T00:00:00Z" },
    ]);
    expect(out.filter((s) => `${s.owner}/${s.repo}` === "ossf/scorecard")).toHaveLength(1);
  });
});
describe("filterSuggestions", () => {
  it("substring-filters case-insensitively; empty query returns all", () => {
    const all = buildSuggestions(seeds, recent);
    expect(filterSuggestions(all, "GOT").map((s) => s.repo)).toEqual(["got"]);
    expect(filterSuggestions(all, "").length).toBe(all.length);
  });
});
