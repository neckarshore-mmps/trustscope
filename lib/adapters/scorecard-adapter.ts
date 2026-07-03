import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ScorecardResult } from "@/lib/report-core/types";

/**
 * The swappable OpenSSF Scorecard source (work-order §4b — the load-bearing infra).
 *
 * ONE interface, several implementations. The "on-demand" runners all shell out to Scorecard
 * and return the SAME JSON shape, so the Report-Core never knows which ran (AP-1):
 *   1. fast-path GET api.securityscorecards.dev — instant, but only for repos in the OpenSSF
 *      public dataset. Our own repos 404 here.
 *   2. Docker run gcr.io/openssf/scorecard — ~90s, works for any public repo. The local-dev default.
 *   3. Binary — runs the `scorecard` Go binary directly (no Docker). This is the Vercel-native prod
 *      path (Sandbox microVM / Fluid-Compute function running the binary — work-order §7 #4).
 *
 * The prod host decision (Vercel Sandbox vs Fluid-Compute vs external) is a DEPLOY-gate choice the
 * adapter absorbs via SCORECARD_RUNNER / SCORECARD_ONDEMAND — an impl swap, never a rewrite.
 *
 * Security: the Docker/binary invocations use execFile with an ARRAY of args (no shell, so no
 * command injection), owner/repo are pre-validated by parseRepoInput, and the GitHub token is
 * passed by NAME into the child env (never in argv / `ps`).
 */

const execFileAsync = promisify(execFile);

const FAST_PATH_BASE = "https://api.securityscorecards.dev/projects/github.com";
const DEFAULT_IMAGE = "gcr.io/openssf/scorecard:stable";
const DEFAULT_BIN = "scorecard";
const RUN_MAX_BUFFER = 32 * 1024 * 1024;

/** Fast-path returned 404 — the repo is not in the OpenSSF dataset; fall back to Docker. */
export class ScorecardNotCoveredError extends Error {
  constructor(slug: string) {
    super(`Scorecard fast-path: ${slug} is not in the OpenSSF public dataset (404)`);
    this.name = "ScorecardNotCoveredError";
  }
}

export type ScorecardSource = "fastpath" | "docker" | "binary";
export type ScorecardRunner = "auto" | "fastpath" | "docker" | "binary";
/** The on-demand runner "auto" falls back to when the fast-path 404s. */
export type OnDemandRunner = "docker" | "binary";

export interface ScorecardRunOptions {
  githubToken?: string;
  runner?: ScorecardRunner;
  /** Which on-demand runner "auto" uses on a fast-path miss. Defaults to env or "docker". */
  onDemand?: OnDemandRunner;
  scorecardImage?: string;
  /** Path to the `scorecard` Go binary (binary runner). Defaults to env or "scorecard" on PATH. */
  scorecardBin?: string;
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

/** A valid Scorecard JSON result always carries a `checks` array. */
function parseScorecardJson(stdout: string | undefined): ScorecardResult | null {
  if (!stdout) return null;
  try {
    const parsed = JSON.parse(stdout) as ScorecardResult;
    return Array.isArray(parsed?.checks) ? parsed : null;
  } catch {
    return null; // not JSON (a panic trace, an empty stream, …)
  }
}

/**
 * Run a `scorecard` command and return its parsed JSON result.
 *
 * Scorecard exits NON-ZERO whenever any check errors during execution — e.g. `Branch-Protection`
 * cannot be read by a fine-grained / OAuth / App token ("some github tokens can't read classic
 * branch protection rules"). Crucially, it still writes the FULL report to stdout, with the errored
 * check at `score: -1`. Node's execFile rejects on that non-zero exit, so without this recovery a
 * single unreadable check would nuke the entire report — fatal for a tool that scores third-party
 * repos, where admin-gated checks are routinely unreadable. See issue #10.
 *
 * A run that produces NO parseable Scorecard JSON (repo unreachable, invalid token, binary crash)
 * is a genuine failure and is re-thrown with a message clearer than the raw "Command failed: …".
 */
async function execScorecard(
  execFileImpl: typeof execFileAsync,
  cmd: string,
  args: string[],
  token: string,
): Promise<ScorecardResult> {
  const options = {
    maxBuffer: RUN_MAX_BUFFER,
    env: { ...process.env, GITHUB_AUTH_TOKEN: token },
  };
  try {
    const { stdout } = await execFileImpl(cmd, args, options);
    return JSON.parse(stdout) as ScorecardResult;
  } catch (err) {
    const stdout = (err as { stdout?: string | Buffer })?.stdout?.toString();
    const recovered = parseScorecardJson(stdout);
    if (recovered) return recovered; // partial-but-valid report (an errored check, exit != 0)
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Scorecard run failed and produced no report (${cmd}). If this mentions branch ` +
        `protection, the GITHUB_AUTH_TOKEN cannot read it — use a classic PAT. Cause: ${detail}`,
    );
  }
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
  return execScorecard(execFileImpl, "docker", args, token);
}

/**
 * Run the `scorecard` Go binary directly (no Docker) — the Vercel-native prod path (§7 #4).
 * Same args + JSON output as the Docker run; the binary is expected on PATH or via SCORECARD_BIN.
 */
export async function runScorecardBinary(
  owner: string,
  repo: string,
  opts: ScorecardRunOptions = {},
): Promise<ScorecardResult> {
  const execFileImpl = opts.execFileFn ?? execFileAsync;
  const bin = opts.scorecardBin ?? process.env.SCORECARD_BIN ?? DEFAULT_BIN;
  const token = opts.githubToken ?? process.env.GITHUB_AUTH_TOKEN;
  if (!token) {
    throw new Error(
      "runScorecardBinary: a GitHub token is required (Scorecard rate-limits without GITHUB_AUTH_TOKEN)",
    );
  }
  const args = [`--repo=github.com/${owner}/${repo}`, "--format=json"];
  return execScorecard(execFileImpl, bin, args, token);
}

function runOnDemand(
  which: OnDemandRunner,
  owner: string,
  repo: string,
  opts: ScorecardRunOptions,
): Promise<ScorecardResult> {
  return which === "binary"
    ? runScorecardBinary(owner, repo, opts)
    : runScorecardDocker(owner, repo, opts);
}

/**
 * Get a Scorecard result via the configured runner.
 * - "auto" (default): fast-path, then the on-demand runner on a 404.
 * - "fastpath": fast-path only (covered repos only — e.g. a pure-serverless prod).
 * - "docker": always run Docker (local-dev default on-demand path).
 * - "binary": always run the `scorecard` Go binary (Vercel-native prod path).
 */
export async function getScorecard(
  owner: string,
  repo: string,
  opts: ScorecardRunOptions = {},
): Promise<{ result: ScorecardResult; source: ScorecardSource }> {
  const runner: ScorecardRunner =
    opts.runner ?? (process.env.SCORECARD_RUNNER as ScorecardRunner) ?? "auto";
  const onDemand: OnDemandRunner =
    opts.onDemand ?? (process.env.SCORECARD_ONDEMAND as OnDemandRunner) ?? "docker";

  if (runner === "docker") {
    return { result: await runScorecardDocker(owner, repo, opts), source: "docker" };
  }
  if (runner === "binary") {
    return { result: await runScorecardBinary(owner, repo, opts), source: "binary" };
  }
  if (runner === "fastpath") {
    return { result: await fetchScorecardFastPath(owner, repo, opts), source: "fastpath" };
  }
  // auto
  try {
    return { result: await fetchScorecardFastPath(owner, repo, opts), source: "fastpath" };
  } catch (err) {
    if (err instanceof ScorecardNotCoveredError) {
      return { result: await runOnDemand(onDemand, owner, repo, opts), source: onDemand };
    }
    throw err;
  }
}
