import { describe, expect, it, vi } from "vitest";
import { fetchGitHubData, RepoNotFoundError } from "./github";

const REPO_JSON = {
  name: "scorecard",
  html_url: "https://github.com/ossf/scorecard",
  owner: { login: "ossf", type: "Organization" },
  license: { spdx_id: "Apache-2.0" },
  pushed_at: "2026-07-01T11:06:03Z",
  archived: false,
  has_issues: true,
  open_issues_count: 419,
  stargazers_count: 5555,
};
const COMMUNITY_JSON = {
  health_percentage: 87,
  files: { security: null, contributing: {}, code_of_conduct: {}, license: {} },
};

/** Routes /repos vs /community/profile to the right fake response. */
function routedFetch(
  repo: { status: number; body?: unknown },
  community: { status: number; body?: unknown },
): typeof fetch {
  return vi.fn(async (url: string) => {
    const isCommunity = String(url).endsWith("/community/profile");
    const spec = isCommunity ? community : repo;
    return {
      status: spec.status,
      ok: spec.status >= 200 && spec.status < 300,
      json: async () => spec.body ?? {},
    };
  }) as unknown as typeof fetch;
}

describe("fetchGitHubData", () => {
  it("normalizes /repos + /community/profile", async () => {
    const data = await fetchGitHubData("ossf", "scorecard", {
      fetchFn: routedFetch({ status: 200, body: REPO_JSON }, { status: 200, body: COMMUNITY_JSON }),
    });
    expect(data.ownerType).toBe("Organization");
    expect(data.licenseSpdxId).toBe("Apache-2.0");
    expect(data.hasSecurityPolicy).toBe(false); // files.security is null
    expect(data.hasContributing).toBe(true);
    expect(data.healthPercentage).toBe(87);
    expect(data.openIssuesCount).toBe(419);
  });

  it("throws RepoNotFoundError on a 404 repo", async () => {
    await expect(
      fetchGitHubData("ghost", "nope", {
        fetchFn: routedFetch({ status: 404 }, { status: 404 }),
      }),
    ).rejects.toBeInstanceOf(RepoNotFoundError);
  });

  it("tolerates a missing community profile (404) as a DEFINITIVE 'no signals'", async () => {
    const data = await fetchGitHubData("ossf", "scorecard", {
      fetchFn: routedFetch({ status: 200, body: REPO_JSON }, { status: 404 }),
    });
    expect(data.hasSecurityPolicy).toBe(false);
    expect(data.hasContributing).toBe(false);
    expect(data.ownerType).toBe("Organization"); // repo data still present
    // A 404 is a definitive answer: the profile is genuinely absent, not "we couldn't check".
    expect(data.communityProfileFetched).toBe(true);
  });

  it("§3: a non-404 community failure (403 rate-limit) is UNKNOWN, not a clean 'empty' profile", async () => {
    const data = await fetchGitHubData("ossf", "scorecard", {
      fetchFn: routedFetch({ status: 200, body: REPO_JSON }, { status: 403 }),
    });
    // The repo data survives, but the community signal must NOT masquerade as "definitively absent".
    expect(data.ownerType).toBe("Organization");
    expect(data.communityProfileFetched).toBe(false);
  });

  it("§3: a community fetch that throws (network/timeout) degrades to UNKNOWN, report survives", async () => {
    const fetchFn = vi.fn(async (url: string) => {
      if (String(url).endsWith("/community/profile")) {
        throw Object.assign(new Error("aborted"), { name: "AbortError" });
      }
      return { status: 200, ok: true, json: async () => REPO_JSON };
    }) as unknown as typeof fetch;
    const data = await fetchGitHubData("ossf", "scorecard", { fetchFn });
    expect(data.ownerType).toBe("Organization");
    expect(data.communityProfileFetched).toBe(false);
  });

  it("§3: passes an AbortSignal to every outbound fetch (timeout guard)", async () => {
    const spy = routedFetch({ status: 200, body: REPO_JSON }, { status: 200, body: COMMUNITY_JSON });
    await fetchGitHubData("ossf", "scorecard", { fetchFn: spy });
    const calls = (spy as unknown as { mock: { calls: [string, { signal?: AbortSignal }][] } }).mock.calls;
    expect(calls.length).toBe(2);
    for (const [, init] of calls) {
      expect(init.signal).toBeInstanceOf(AbortSignal);
    }
  });

  it("sends an auth header when a token is supplied", async () => {
    const spy = routedFetch({ status: 200, body: REPO_JSON }, { status: 200, body: COMMUNITY_JSON });
    await fetchGitHubData("ossf", "scorecard", { fetchFn: spy, githubToken: "tok" });
    const [, init] = (spy as unknown as { mock: { calls: [string, { headers: Record<string, string> }][] } }).mock.calls[0];
    expect(init.headers.authorization).toBe("Bearer tok");
  });
});
