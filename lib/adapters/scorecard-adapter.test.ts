import { describe, expect, it, vi } from "vitest";
import {
  getScorecard,
  ScorecardNotCoveredError,
  fetchScorecardFastPath,
  runScorecardDocker,
  runScorecardBinary,
} from "./scorecard-adapter";

const FAKE_RESULT = { score: 7, checks: [], date: "2026-07-01", repo: { name: "x", commit: "abc" } };

function fakeFetch(status: number, body: unknown = FAKE_RESULT): typeof fetch {
  return vi.fn(async () => ({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  })) as unknown as typeof fetch;
}

describe("fetchScorecardFastPath", () => {
  it("returns the parsed result on 200", async () => {
    const r = await fetchScorecardFastPath("ossf", "scorecard", { fetchFn: fakeFetch(200) });
    expect(r.score).toBe(7);
  });

  it("throws ScorecardNotCoveredError on 404", async () => {
    await expect(
      fetchScorecardFastPath("neckarshore-mmps", "snakeoil-check", { fetchFn: fakeFetch(404) }),
    ).rejects.toBeInstanceOf(ScorecardNotCoveredError);
  });

  it("throws a generic error on other non-2xx", async () => {
    await expect(
      fetchScorecardFastPath("a", "b", { fetchFn: fakeFetch(500) }),
    ).rejects.toThrow(/HTTP 500/);
  });
});

describe("runScorecardDocker", () => {
  it("requires a GitHub token", async () => {
    const orig = process.env.GITHUB_AUTH_TOKEN;
    delete process.env.GITHUB_AUTH_TOKEN;
    await expect(
      runScorecardDocker("a", "b", { execFileFn: vi.fn() as never }),
    ).rejects.toThrow(/token is required/);
    if (orig !== undefined) process.env.GITHUB_AUTH_TOKEN = orig;
  });

  it("never puts the token in argv; passes it via the child env", async () => {
    const execSpy = vi.fn(async () => ({ stdout: JSON.stringify(FAKE_RESULT), stderr: "" }));
    await runScorecardDocker("ossf", "scorecard", {
      githubToken: "secret-token-value",
      execFileFn: execSpy as never,
    });
    const [cmd, args, options] = execSpy.mock.calls[0] as unknown as [
      string,
      string[],
      { env: Record<string, string> },
    ];
    expect(cmd).toBe("docker");
    expect(args).toContain("--repo=github.com/ossf/scorecard");
    expect(args.join(" ")).not.toContain("secret-token-value"); // token not in args
    expect(options.env.GITHUB_AUTH_TOKEN).toBe("secret-token-value"); // token in env
  });
});

describe("runScorecardBinary", () => {
  it("runs the scorecard binary directly (no docker), token in env not argv", async () => {
    const execSpy = vi.fn(async () => ({ stdout: JSON.stringify(FAKE_RESULT), stderr: "" }));
    await runScorecardBinary("ossf", "scorecard", {
      githubToken: "secret",
      scorecardBin: "/usr/local/bin/scorecard",
      execFileFn: execSpy as never,
    });
    const [cmd, args, options] = execSpy.mock.calls[0] as unknown as [
      string,
      string[],
      { env: Record<string, string> },
    ];
    expect(cmd).toBe("/usr/local/bin/scorecard");
    expect(args).toEqual(["--repo=github.com/ossf/scorecard", "--format=json"]);
    expect(args.join(" ")).not.toContain("secret");
    expect(options.env.GITHUB_AUTH_TOKEN).toBe("secret");
  });

  it("requires a token", async () => {
    const orig = process.env.GITHUB_AUTH_TOKEN;
    delete process.env.GITHUB_AUTH_TOKEN;
    await expect(
      runScorecardBinary("a", "b", { execFileFn: vi.fn() as never }),
    ).rejects.toThrow(/token is required/);
    if (orig !== undefined) process.env.GITHUB_AUTH_TOKEN = orig;
  });
});

/**
 * Scorecard exits non-zero when a check errors during execution (e.g. Branch-Protection can't be
 * read by a fine-grained/OAuth token) but still emits the full JSON report on stdout. Node's
 * execFile rejects on that non-zero exit; the runner must recover the report from err.stdout
 * instead of letting one errored check nuke the whole report. See issue #10.
 */
describe("scorecard exec: non-zero exit recovery", () => {
  /** Mimics a Node execFile rejection: an Error carrying stdout/stderr/code. */
  function rejectWith(stdout: string, stderr = "one or more checks failed during execution") {
    const err = Object.assign(
      new Error(`Command failed: scorecard --repo=... --format=json\n${stderr}`),
      { stdout, stderr, code: 1 },
    );
    return vi.fn(async () => {
      throw err;
    });
  }

  it("binary: recovers the report from stdout when the process exits non-zero", async () => {
    const r = await runScorecardBinary("ossf", "scorecard", {
      githubToken: "t",
      execFileFn: rejectWith(JSON.stringify(FAKE_RESULT)) as never,
    });
    expect(r.score).toBe(7);
  });

  it("docker: recovers the report from stdout when the process exits non-zero", async () => {
    const r = await runScorecardDocker("ossf", "scorecard", {
      githubToken: "t",
      execFileFn: rejectWith(JSON.stringify(FAKE_RESULT)) as never,
    });
    expect(r.score).toBe(7);
  });

  it("throws a clearer error (not raw 'Command failed') when there is NO JSON on stdout", async () => {
    await expect(
      runScorecardBinary("ossf", "scorecard", {
        githubToken: "t",
        execFileFn: rejectWith("") as never,
      }),
    ).rejects.toThrow(/Scorecard run failed/);
  });

  it("throws when stdout is non-JSON garbage (not a scorecard result)", async () => {
    await expect(
      runScorecardBinary("ossf", "scorecard", {
        githubToken: "t",
        execFileFn: rejectWith("panic: runtime error\nnot json") as never,
      }),
    ).rejects.toThrow(/Scorecard run failed/);
  });

  it("throws when stdout is JSON but lacks a checks array (wrong shape)", async () => {
    await expect(
      runScorecardBinary("ossf", "scorecard", {
        githubToken: "t",
        execFileFn: rejectWith(JSON.stringify({ message: "boom" })) as never,
      }),
    ).rejects.toThrow(/Scorecard run failed/);
  });
});

describe("getScorecard runner selection", () => {
  it("binary: always runs the binary, skips the fast-path", async () => {
    const execSpy = vi.fn(async () => ({ stdout: JSON.stringify(FAKE_RESULT), stderr: "" }));
    const fetchSpy = fakeFetch(200);
    const r = await getScorecard("ossf", "scorecard", {
      runner: "binary",
      githubToken: "t",
      fetchFn: fetchSpy,
      execFileFn: execSpy as never,
    });
    expect(r.source).toBe("binary");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("auto + onDemand=binary: falls back to the binary on a 404", async () => {
    const execSpy = vi.fn(async () => ({ stdout: JSON.stringify(FAKE_RESULT), stderr: "" }));
    const r = await getScorecard("x", "y", {
      runner: "auto",
      onDemand: "binary",
      fetchFn: fakeFetch(404),
      githubToken: "t",
      execFileFn: execSpy as never,
    });
    expect(r.source).toBe("binary");
    expect(execSpy).toHaveBeenCalledOnce();
  });

  it("auto: uses fast-path when covered", async () => {
    const r = await getScorecard("ossf", "scorecard", { runner: "auto", fetchFn: fakeFetch(200) });
    expect(r.source).toBe("fastpath");
  });

  it("auto: falls back to Docker on a fast-path 404", async () => {
    const execSpy = vi.fn(async () => ({ stdout: JSON.stringify(FAKE_RESULT), stderr: "" }));
    const r = await getScorecard("neckarshore-mmps", "snakeoil-check", {
      runner: "auto",
      fetchFn: fakeFetch(404),
      githubToken: "t",
      execFileFn: execSpy as never,
    });
    expect(r.source).toBe("docker");
    expect(execSpy).toHaveBeenCalledOnce();
  });

  it("fastpath: does NOT fall back to Docker (covered-only mode)", async () => {
    await expect(
      getScorecard("x", "y", { runner: "fastpath", fetchFn: fakeFetch(404) }),
    ).rejects.toBeInstanceOf(ScorecardNotCoveredError);
  });

  it("docker: always runs Docker, skips the fast-path", async () => {
    const execSpy = vi.fn(async () => ({ stdout: JSON.stringify(FAKE_RESULT), stderr: "" }));
    const fetchSpy = fakeFetch(200);
    const r = await getScorecard("ossf", "scorecard", {
      runner: "docker",
      githubToken: "t",
      fetchFn: fetchSpy,
      execFileFn: execSpy as never,
    });
    expect(r.source).toBe("docker");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
