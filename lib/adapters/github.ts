import { normalizeGitHubData } from "@/lib/report-core/normalize";
import type { GitHubData } from "@/lib/report-core/types";

/**
 * GitHub-API adapter (work-order §4a) — the P3 governance + P4 lifecycle signals Scorecard
 * doesn't cover. Reads GET /repos/{owner}/{repo} and GET /repos/{owner}/{repo}/community/profile,
 * then hands the raw payloads to the pure normalizeGitHubData transform.
 */

export const GITHUB_API = "https://api.github.com";

/** Hard deadline per outbound GitHub call (§3) — a hanging response degrades, never blocks the report. */
const GITHUB_FETCH_TIMEOUT_MS = 5000;

/** Fetch with a per-call AbortSignal timeout. Always clears the timer; caller handles rejection. */
async function fetchWithTimeout(
  fetchImpl: typeof fetch,
  url: string,
  init: RequestInit,
  ms = GITHUB_FETCH_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

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

export function ghHeaders(token?: string): Record<string, string> {
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

  // The repo call is essential — a timeout/abort here legitimately fails the whole report.
  const repoRes = await fetchWithTimeout(fetchImpl, `${GITHUB_API}/repos/${owner}/${repo}`, {
    headers,
  });
  if (repoRes.status === 404) throw new RepoNotFoundError(`${owner}/${repo}`);
  if (!repoRes.ok) {
    throw new Error(`GitHub /repos failed for ${owner}/${repo}: HTTP ${repoRes.status}`);
  }
  const repoJson = await repoRes.json();

  // §3 — the community profile is a secondary signal, but its failure modes must NOT fail open:
  //   200        -> definitive signals.
  //   404        -> definitive absence (the profile genuinely does not exist) -> empty is correct.
  //   other !ok  -> a FAILED fetch (403 rate-limit, 5xx) -> we do NOT know -> mark UNKNOWN.
  //   throw/abort (network/timeout) -> also UNKNOWN.
  // "Unknown" must never masquerade as "definitively absent" (the fail-open class Omnopsis forbids).
  let communityJson: unknown = {};
  let communityProfileFetched = true;
  try {
    const commRes = await fetchWithTimeout(
      fetchImpl,
      `${GITHUB_API}/repos/${owner}/${repo}/community/profile`,
      { headers },
    );
    if (commRes.ok) {
      communityJson = await commRes.json();
    } else if (commRes.status !== 404) {
      communityProfileFetched = false; // 403 / 5xx — we couldn't read it, not "absent"
    }
  } catch {
    communityProfileFetched = false; // network error / AbortError (timeout)
  }

  return normalizeGitHubData(repoJson, communityJson as never, communityProfileFetched);
}
