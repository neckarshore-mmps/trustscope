import { normalizeGitHubData } from "@/lib/report-core/normalize";
import type { GitHubData } from "@/lib/report-core/types";

/**
 * GitHub-API adapter (work-order §4a) — the P3 governance + P4 lifecycle signals Scorecard
 * doesn't cover. Reads GET /repos/{owner}/{repo} and GET /repos/{owner}/{repo}/community/profile,
 * then hands the raw payloads to the pure normalizeGitHubData transform.
 */

const GITHUB_API = "https://api.github.com";

export class RepoNotFoundError extends Error {
  constructor(slug: string) {
    super(`GitHub repository ${slug} not found (404)`);
    this.name = "RepoNotFoundError";
  }
}

export interface GitHubFetchOptions {
  githubToken?: string;
  /** Injectable for tests. */
  fetchFn?: typeof fetch;
}

function ghHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    "user-agent": "TrustScope",
  };
  if (token) headers.authorization = `Bearer ${token}`;
  return headers;
}

export async function fetchGitHubData(
  owner: string,
  repo: string,
  opts: GitHubFetchOptions = {},
): Promise<GitHubData> {
  const fetchImpl = opts.fetchFn ?? fetch;
  const token = opts.githubToken ?? process.env.GITHUB_AUTH_TOKEN;
  const headers = ghHeaders(token);

  const repoRes = await fetchImpl(`${GITHUB_API}/repos/${owner}/${repo}`, { headers });
  if (repoRes.status === 404) throw new RepoNotFoundError(`${owner}/${repo}`);
  if (!repoRes.ok) {
    throw new Error(`GitHub /repos failed for ${owner}/${repo}: HTTP ${repoRes.status}`);
  }
  const repoJson = await repoRes.json();

  // The community profile is best-effort: some repos 404 it. Treat a miss as "no signals".
  let communityJson: unknown = {};
  const commRes = await fetchImpl(
    `${GITHUB_API}/repos/${owner}/${repo}/community/profile`,
    { headers },
  );
  if (commRes.ok) communityJson = await commRes.json();

  return normalizeGitHubData(repoJson, communityJson as never);
}
