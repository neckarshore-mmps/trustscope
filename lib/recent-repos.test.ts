import { describe, expect, it } from "vitest";
import {
  addRecentRepo,
  clearRecentRepos,
  getRecentRepos,
  MAX_RECENT,
  type RecentStore,
} from "./recent-repos";

function fakeStore(initial = ""): RecentStore {
  let v = initial;
  return {
    read: () => v || null,
    write: (x) => {
      v = x;
    },
  };
}

describe("recent-repos", () => {
  it("adds newest-first and reads it back", () => {
    const s = fakeStore();
    addRecentRepo(s, { owner: "a", repo: "x" }, "2026-07-01T00:00:00Z");
    addRecentRepo(s, { owner: "b", repo: "y" }, "2026-07-02T00:00:00Z");
    expect(getRecentRepos(s).map((r) => `${r.owner}/${r.repo}`)).toEqual(["b/y", "a/x"]);
  });
  it("dedups by owner/repo, moving the re-viewed entry to the front", () => {
    const s = fakeStore();
    addRecentRepo(s, { owner: "a", repo: "x" }, "2026-07-01T00:00:00Z");
    addRecentRepo(s, { owner: "b", repo: "y" }, "2026-07-02T00:00:00Z");
    addRecentRepo(s, { owner: "a", repo: "x" }, "2026-07-03T00:00:00Z");
    expect(getRecentRepos(s).map((r) => `${r.owner}/${r.repo}`)).toEqual(["a/x", "b/y"]);
  });
  it("caps at MAX_RECENT", () => {
    const s = fakeStore();
    for (let i = 0; i < MAX_RECENT + 3; i++)
      addRecentRepo(s, { owner: "o", repo: `r${i}` }, `2026-07-01T00:00:0${i}Z`);
    expect(getRecentRepos(s).length).toBe(MAX_RECENT);
  });
  it("clear empties the list; malformed storage reads as empty", () => {
    const s = fakeStore("not json");
    expect(getRecentRepos(s)).toEqual([]);
    addRecentRepo(s, { owner: "a", repo: "x" }, "2026-07-01T00:00:00Z");
    clearRecentRepos(s);
    expect(getRecentRepos(s)).toEqual([]);
  });
  it("orders ties on equal viewedAt deterministically by slug (total order)", () => {
    // Equal viewedAt must not depend on input array order — the comparator has a
    // secondary slug key so the sort is a total order (no -1-on-equal instability).
    const s = fakeStore(
      JSON.stringify([
        { owner: "zeta", repo: "z", viewedAt: "2026-07-01T00:00:00Z" },
        { owner: "alpha", repo: "a", viewedAt: "2026-07-01T00:00:00Z" },
      ]),
    );
    expect(getRecentRepos(s).map((r) => r.owner)).toEqual(["alpha", "zeta"]);
  });
});
