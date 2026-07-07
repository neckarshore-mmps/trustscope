import { describe, expect, it, vi } from "vitest";
import { resolveReport, CACHE_TTL_MS } from "./resolve-report";
import { AtCapacityError } from "./concurrency-gate";
import { RepoNotFoundError } from "./adapters/github";
import { ScorecardNotCoveredError } from "./adapters/scorecard-adapter";
import type { ReportModel } from "./report-core/types";
import type { ReportStore, StoredReport } from "./store/types";
import type { GeneratedReport } from "./adapters";

const NOW = 1_700_000_000_000; // fixed clock for deterministic TTL boundaries
const PARSED = { owner: "o", repo: "r" };
const REPORT = { repo: { owner: "o", name: "r", commit: "abc" } } as unknown as ReportModel;

function fakeStore(over: Partial<ReportStore> = {}): ReportStore {
  return {
    get: vi.fn(async () => null),
    getLatest: vi.fn(async () => null),
    put: vi.fn(async () => {}),
    ...over,
  };
}

function stored(fetchedAtMs: number): StoredReport {
  return {
    key: { owner: "o", repo: "r", commit: "abc" },
    report: REPORT,
    scorecardSource: "fastpath",
    fetchedAt: new Date(fetchedAtMs).toISOString(),
  };
}

const gen = (source: GeneratedReport["scorecardSource"]) =>
  vi.fn(async (): Promise<GeneratedReport> => ({ report: REPORT, scorecardSource: source }));

describe("resolveReport", () => {
  it("cache hit within TTL: serves the stored report, cached:true, does NOT generate", async () => {
    const generateReport = gen("binary");
    const store = fakeStore({ getLatest: vi.fn(async () => stored(NOW - 1000)) });
    const r = await resolveReport(PARSED, { store, generateReport, now: () => NOW });
    expect(r).toMatchObject({ kind: "ok", cached: true, source: "fastpath" });
    expect(generateReport).not.toHaveBeenCalled();
    expect(store.put).not.toHaveBeenCalled();
  });

  it("stale cache (exactly at/over TTL): regenerates, persists, cached:false", async () => {
    const generateReport = gen("binary");
    const store = fakeStore({ getLatest: vi.fn(async () => stored(NOW - CACHE_TTL_MS)) });
    const r = await resolveReport(PARSED, { store, generateReport, now: () => NOW });
    expect(r).toMatchObject({ kind: "ok", cached: false, source: "binary" });
    expect(generateReport).toHaveBeenCalledOnce();
    expect(store.put).toHaveBeenCalledOnce();
  });

  it("no cached report: regenerates and persists", async () => {
    const generateReport = gen("docker");
    const store = fakeStore();
    const r = await resolveReport(PARSED, { store, generateReport, now: () => NOW });
    expect(r).toMatchObject({ kind: "ok", cached: false, source: "docker" });
    expect(store.put).toHaveBeenCalledOnce();
  });

  it("store.put failure still returns the ok report (the swallow invariant)", async () => {
    const generateReport = gen("binary");
    const store = fakeStore({
      put: vi.fn(async () => {
        throw new Error("read-only FS");
      }),
    });
    const r = await resolveReport(PARSED, { store, generateReport, now: () => NOW });
    expect(r.kind).toBe("ok");
  });

  it("RepoNotFoundError -> 'Repository not found' error outcome", async () => {
    const generateReport = vi.fn(async () => {
      throw new RepoNotFoundError("o/r");
    });
    const r = await resolveReport(PARSED, { store: fakeStore(), generateReport, now: () => NOW });
    expect(r).toMatchObject({ kind: "error", title: "Repository not found" });
  });

  it("ScorecardNotCoveredError -> on-demand-unavailable error outcome", async () => {
    const generateReport = vi.fn(async () => {
      throw new ScorecardNotCoveredError("o/r");
    });
    const r = await resolveReport(PARSED, { store: fakeStore(), generateReport, now: () => NOW });
    expect(r.kind).toBe("error");
    if (r.kind === "error") expect(r.title).toMatch(/Scorecard/i);
  });

  it("§5: coalesces concurrent misses for the SAME repo into exactly one pipeline run", async () => {
    let resolveGen!: (v: GeneratedReport) => void;
    const pending = new Promise<GeneratedReport>((res) => (resolveGen = res));
    const generateReport = vi.fn(async () => pending);
    const store = fakeStore();
    const inFlight = new Map<string, Promise<GeneratedReport>>();

    // Fire N concurrent requests for the same repo while generation is still in flight.
    const calls = Array.from({ length: 5 }, () =>
      resolveReport(PARSED, { store, generateReport, now: () => NOW, inFlight }),
    );
    await Promise.resolve();

    resolveGen({ report: REPORT, scorecardSource: "binary" });
    const results = await Promise.all(calls);

    // Exactly ONE pipeline run despite 5 concurrent misses; every caller got the same ok report.
    expect(generateReport).toHaveBeenCalledOnce();
    expect(results.every((r) => r.kind === "ok")).toBe(true);
    // And it persisted once, not five times.
    expect(store.put).toHaveBeenCalledOnce();
  });

  it("§5: does NOT coalesce distinct repos (independent generations)", async () => {
    const generateReport = gen("binary");
    const inFlight = new Map<string, Promise<GeneratedReport>>();
    await Promise.all([
      resolveReport({ owner: "o", repo: "a" }, { store: fakeStore(), generateReport, now: () => NOW, inFlight }),
      resolveReport({ owner: "o", repo: "b" }, { store: fakeStore(), generateReport, now: () => NOW, inFlight }),
    ]);
    expect(generateReport).toHaveBeenCalledTimes(2);
  });

  it("AtCapacityError -> a distinct 'at capacity' outcome, NOT a generic report failure", async () => {
    const generateReport = vi.fn(async () => {
      throw new AtCapacityError(2);
    });
    const r = await resolveReport(PARSED, { store: fakeStore(), generateReport, now: () => NOW });
    expect(r.kind).toBe("error");
    if (r.kind === "error") {
      expect(r.title).toMatch(/capacity/i);
      // must not leak the internal "N concurrent operations" detail as the user message
      expect(r.message).not.toMatch(/concurrent operations/i);
    }
  });

  it("generic error -> 'Couldn't generate the report', surfacing the message", async () => {
    const generateReport = vi.fn(async () => {
      throw new Error("boom");
    });
    const r = await resolveReport(PARSED, { store: fakeStore(), generateReport, now: () => NOW });
    expect(r.kind).toBe("error");
    if (r.kind === "error") {
      expect(r.title).toMatch(/generate the report/i);
      expect(r.message).toBe("boom");
    }
  });
});
