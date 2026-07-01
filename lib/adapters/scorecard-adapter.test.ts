import { describe, expect, it, vi } from "vitest";
import {
  getScorecard,
  ScorecardNotCoveredError,
  fetchScorecardFastPath,
  runScorecardDocker,
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

describe("getScorecard runner selection", () => {
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
