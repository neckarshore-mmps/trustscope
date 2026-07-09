import type { GitHubData } from "./types";

/**
 * Pure normalizers: raw GitHub-API JSON -> the Report-Core's GitHubData shape.
 * Kept in report-core so the same transform is unit-tested here and reused by the Phase-2 adapter.
 */

export interface RawGitHubRepo {
  name?: string;
  html_url?: string;
  owner?: { login?: string; type?: string };
  license?: { spdx_id?: string | null } | null;
  pushed_at?: string | null;
  archived?: boolean;
  has_issues?: boolean;
  open_issues_count?: number;
  stargazers_count?: number;
}

export interface RawGitHubCommunity {
  health_percentage?: number;
  files?: {
    security?: unknown;
    contributing?: unknown;
    code_of_conduct?: unknown;
    license?: unknown;
  };
}

export function normalizeGitHubData(
  repo: RawGitHubRepo,
  community: RawGitHubCommunity,
  /** §3: false when the community fetch failed (403/5xx/timeout) — signals are "unknown", not "absent". */
  communityProfileFetched = true,
): GitHubData {
  return {
    ownerLogin: repo.owner?.login ?? "unknown",
    ownerType: repo.owner?.type ?? "unknown",
    repoName: repo.name ?? "unknown",
    htmlUrl: repo.html_url ?? "",
    licenseSpdxId: repo.license?.spdx_id ?? null,
    pushedAt: repo.pushed_at ?? null,
    archived: Boolean(repo.archived),
    hasIssuesEnabled: Boolean(repo.has_issues),
    openIssuesCount: repo.open_issues_count ?? 0,
    stargazersCount: repo.stargazers_count ?? 0,
    hasSecurityPolicy: Boolean(community.files?.security),
    hasContributing: Boolean(community.files?.contributing),
    hasCodeOfConduct: Boolean(community.files?.code_of_conduct),
    healthPercentage:
      typeof community.health_percentage === "number"
        ? community.health_percentage
        : null,
    communityProfileFetched,
  };
}
