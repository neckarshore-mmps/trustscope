import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ScorecardResult } from "@/lib/report-core/types";

/**
 * The swappable OpenSSF Scorecard source (work-order §4b — the load-bearing infra).
 *
 * ONE interface, two implementations tried in order:
 *   1. fast-path GET api.securityscorecards.dev — instant, but only for repos in the OpenSSF
 *      public dataset. Our own repos 404 here.
 *   2. Docker run gcr.io/openssf/scorecard — ~90s, works for any public repo. Runs locally in
 *      dev; prod needs a container-host (NOT pure serverless — §7 User-Action #4).
 * Both return the SAME Scorecard JSON shape, so the Report-Core never knows which ran (AP-1).
 *
 * Security: the Docker invocation uses execFile with an ARRAY of args (no shell, so no command
 * injection), owner/repo are pre-validated by parseRepoInput, and the GitHub token is passed by
 * NAME into the child env (never in argv / `ps`).
 */

const execFileAsync = promisify(execFile);

const FAST_PATH_BASE = "https://api.securityscorecards.dev/projects/github.com";
const DEFAULT_IMAGE = "gcr.io/openssf/scorecard:stable";
const DOCKER_MAX_BUFFER = 32 * 1024 * 1024;

/** Fast-path returned 404 — the repo is not in the OpenSSF dataset; fall back to Docker. */
export class ScorecardNotCoveredError extends Error {
  constructor(slug: string) {
    super(`Scorecard fast-path: ${slug} is not in the OpenSSF public dataset (404)`);
    this.name = "ScorecardNotCoveredError";
  }
}

export type ScorecardSource = "fastpath" | "docker";
export type ScorecardRunner = "auto" | "fastpath" | "docker";

export interface ScorecardRunOptions {
  githubToken?: string;
  runner?: ScorecardRunner;
  scorecardImage?: string;
  /** Injectable for tests. */
  fetchFn?: typeof fetch;
  execFileFn?: typeof execFileAsync;
}

export async function fetchScorecardFastPath(
  owner: string,
  repo: string,
  opts: ScorecardRunOptions = {},
): Promise<ScorecardResult> {
  const fetchImpl = opts.fetchFn ?? fetch;
  const res = await fetchImpl(`${FAST_PATH_BASE}/${owner}/${repo}`, {
    headers: { accept: "application/json" },
  });
  if (res.status === 404) throw new ScorecardNotCoveredError(`${owner}/${repo}`);
  if (!res.ok) {
    throw new Error(`Scorecard fast-path failed for ${owner}/${repo}: HTTP ${res.status}`);
  }
  return (await res.json()) as ScorecardResult;
}

export async function runScorecardDocker(
  owner: string,
  repo: string,
  opts: ScorecardRunOptions = {},
): Promise<ScorecardResult> {
  const execFileImpl = opts.execFileFn ?? execFileAsync;
  const image = opts.scorecardImage ?? process.env.SCORECARD_IMAGE ?? DEFAULT_IMAGE;
  const token = opts.githubToken ?? process.env.GITHUB_AUTH_TOKEN;
  if (!token) {
    throw new Error(
      "runScorecardDocker: a GitHub token is required (Scorecard rate-limits without GITHUB_AUTH_TOKEN)",
    );
  }
  // Token passed by NAME (-e GITHUB_AUTH_TOKEN) + injected via child env, so it never lands in argv.
  const args = [
    "run",
    "--rm",
    "-e",
    "GITHUB_AUTH_TOKEN",
    image,
    `--repo=github.com/${owner}/${repo}`,
    "--format=json",
  ];
  const { stdout } = await execFileImpl("docker", args, {
    maxBuffer: DOCKER_MAX_BUFFER,
    env: { ...process.env, GITHUB_AUTH_TOKEN: token },
  });
  return JSON.parse(stdout) as ScorecardResult;
}

/**
 * Get a Scorecard result via the configured runner.
 * - "auto" (default): fast-path, then Docker on a 404.
 * - "fastpath": fast-path only (covered repos only — e.g. a pure-serverless prod).
 * - "docker": always run Docker.
 */
export async function getScorecard(
  owner: string,
  repo: string,
  opts: ScorecardRunOptions = {},
): Promise<{ result: ScorecardResult; source: ScorecardSource }> {
  const runner: ScorecardRunner =
    opts.runner ?? (process.env.SCORECARD_RUNNER as ScorecardRunner) ?? "auto";

  if (runner === "docker") {
    return { result: await runScorecardDocker(owner, repo, opts), source: "docker" };
  }
  if (runner === "fastpath") {
    return { result: await fetchScorecardFastPath(owner, repo, opts), source: "fastpath" };
  }
  // auto
  try {
    return { result: await fetchScorecardFastPath(owner, repo, opts), source: "fastpath" };
  } catch (err) {
    if (err instanceof ScorecardNotCoveredError) {
      return { result: await runScorecardDocker(owner, repo, opts), source: "docker" };
    }
    throw err;
  }
}
