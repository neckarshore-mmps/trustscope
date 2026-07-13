import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { buildReport } from "@/lib/report-core/build-report";
import { normalizeGitHubData } from "@/lib/report-core/normalize";
import { FileReportStore } from "./file-store";
import { InMemoryReportStore } from "./memory-store";
import { NeonReportStore } from "./neon-store";
import type { ReportStore, StoredReport } from "./types";

const FIXTURES = join(process.cwd(), "fixtures");
const read = (f: string) => JSON.parse(readFileSync(join(FIXTURES, f), "utf8"));

const report = buildReport({
  scorecard: read("scorecard-snakeoil.json"),
  github: normalizeGitHubData(
    read("github-repo-snakeoil.json"),
    read("github-community-snakeoil.json"),
  ),
  generatedAt: "2026-07-01T00:00:00.000Z",
});

function stored(commit: string, fetchedAt: string): StoredReport {
  return {
    key: { owner: "fixture-org", repo: "fixture-repo", commit },
    report,
    scorecardSource: "docker",
    fetchedAt,
  };
}

const tempDirs: string[] = [];
afterAll(async () => {
  await Promise.all(tempDirs.map((d) => rm(d, { recursive: true, force: true })));
});

async function makeFileStore(): Promise<ReportStore> {
  const dir = await mkdtemp(join(tmpdir(), "trustscope-store-"));
  tempDirs.push(dir);
  return new FileReportStore(dir);
}

const impls: Array<[string, () => Promise<ReportStore>]> = [
  ["InMemoryReportStore", async () => new InMemoryReportStore()],
  ["FileReportStore", makeFileStore],
];

describe.each(impls)("%s — ReportStore contract", (_name, make) => {
  it("returns null for a missing key", async () => {
    const store = await make();
    expect(await store.get({ owner: "a", repo: "b", commit: "c" })).toBeNull();
    expect(await store.getLatest("a", "b")).toBeNull();
  });

  it("round-trips a stored report by exact key", async () => {
    const store = await make();
    const s = stored("aaa111", "2026-07-01T10:00:00.000Z");
    await store.put(s);
    const got = await store.get(s.key);
    expect(got?.report.repo.name).toBe("fixture-repo");
    expect(got?.fetchedAt).toBe("2026-07-01T10:00:00.000Z");
  });

  it("getLatest returns the freshest entry across commits", async () => {
    const store = await make();
    await store.put(stored("old", "2026-07-01T08:00:00.000Z"));
    await store.put(stored("new", "2026-07-01T12:00:00.000Z"));
    await store.put(stored("mid", "2026-07-01T10:00:00.000Z"));
    const latest = await store.getLatest("fixture-org", "fixture-repo");
    expect(latest?.key.commit).toBe("new");
  });

  it("scopes getLatest to the requested repo", async () => {
    const store = await make();
    await store.put(stored("x", "2026-07-01T09:00:00.000Z"));
    expect(await store.getLatest("someone", "else")).toBeNull();
  });
});

describe("FileReportStore — §5 atomic write + bounded growth", () => {
  async function makeDir(): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), "trustscope-store-"));
    tempDirs.push(dir);
    return dir;
  }

  it("leaves no partial/temp files behind — the write is atomic (rename)", async () => {
    const dir = await makeDir();
    const store = new FileReportStore(dir);
    await store.put(stored("aaa111", "2026-07-01T10:00:00.000Z"));
    const files = await readdir(dir);
    // exactly the final .json, no .tmp residue from a temp-write-then-rename
    expect(files.every((f) => f.endsWith(".json"))).toBe(true);
    expect(files.some((f) => f.includes(".tmp"))).toBe(false);
    // and the file is complete, valid JSON
    const got = await store.get({ owner: "fixture-org", repo: "fixture-repo", commit: "aaa111" });
    expect(got?.report.repo.name).toBe("fixture-repo");
  });

  it("bounds growth — evicts the oldest entries beyond maxEntries", async () => {
    const dir = await makeDir();
    const store = new FileReportStore(dir, 3);
    // Put 5 distinct-commit reports, oldest first.
    for (let i = 0; i < 5; i++) {
      await store.put(stored(`c${i}`, `2026-07-01T0${i}:00:00.000Z`));
    }
    const files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
    expect(files.length).toBe(3);
    // the two oldest (c0, c1) were evicted; the three newest remain
    expect(await store.get({ owner: "fixture-org", repo: "fixture-repo", commit: "c0" })).toBeNull();
    expect(await store.get({ owner: "fixture-org", repo: "fixture-repo", commit: "c4" })).not.toBeNull();
  });
});

// Live-DB contract for the prod store. Gated on a DEDICATED, test-only var — NEON_TEST_DATABASE_URL,
// NEVER the production DATABASE_URL — because this suite TRUNCATEs `reports` between tests: pointing
// it at prod would wipe live reports. Point it at a throwaway Neon TEST branch. CI sets neither var →
// skipped there, so green CI does NOT prove the store works — the launch DoD is running this suite
// against a test branch + the E2E flow on the preview. Run the migration first: `npm run db:migrate`.
const NEON_TEST_URL = process.env.NEON_TEST_DATABASE_URL;
describe.skipIf(!NEON_TEST_URL)("NeonReportStore — ReportStore contract (live DB)", () => {
  // Guarded: `describe.skipIf` skips the TESTS but still runs this body at collection time, so
  // neither the store nor the driver may be constructed unconditionally (both throw on undefined).
  const store = new NeonReportStore(NEON_TEST_URL ?? "postgres://u:p@localhost/db");
  const sql = neon(NEON_TEST_URL ?? "postgres://u:p@localhost/db");

  beforeEach(async () => {
    // Isolation: unlike the temp-dir stores, Neon shares one table across tests.
    await sql`TRUNCATE reports`;
  });

  it("returns null for a missing key", async () => {
    expect(await store.get({ owner: "a", repo: "b", commit: "c" })).toBeNull();
    expect(await store.getLatest("a", "b")).toBeNull();
  });

  it("round-trips a stored report by exact key", async () => {
    const s = stored("aaa111", "2026-07-01T10:00:00.000Z");
    await store.put(s);
    const got = await store.get(s.key);
    expect(got?.report.repo.name).toBe("fixture-repo");
    expect(got?.fetchedAt).toBe("2026-07-01T10:00:00.000Z");
  });

  it("getLatest returns the freshest entry across commits", async () => {
    await store.put(stored("old", "2026-07-01T08:00:00.000Z"));
    await store.put(stored("new", "2026-07-01T12:00:00.000Z"));
    await store.put(stored("mid", "2026-07-01T10:00:00.000Z"));
    expect((await store.getLatest("fixture-org", "fixture-repo"))?.key.commit).toBe("new");
  });

  it("scopes getLatest to the requested repo", async () => {
    await store.put(stored("x", "2026-07-01T09:00:00.000Z"));
    expect(await store.getLatest("someone", "else")).toBeNull();
  });

  it("upserts on (owner, repo, commit) — the same key stays one row, newest write wins", async () => {
    await store.put(stored("dup", "2026-07-01T08:00:00.000Z"));
    await store.put(stored("dup", "2026-07-01T09:00:00.000Z"));
    const got = await store.get({ owner: "fixture-org", repo: "fixture-repo", commit: "dup" });
    expect(got?.fetchedAt).toBe("2026-07-01T09:00:00.000Z");
  });

  it("returns fetchedAt as the EXACT ISO string — TTL-safe round-trip (the 'Not assessed' bug)", async () => {
    // timestamptz comes back as a JS Date; if the store leaked the Date through, Date.parse in the
    // TTL check would be NaN → false cache-miss → "Not assessed". Assert the ISO contract directly.
    await store.put(stored("iso", "2026-07-01T10:00:00.000Z"));
    const got = await store.getLatest("fixture-org", "fixture-repo");
    expect(got?.fetchedAt).toBe("2026-07-01T10:00:00.000Z");
    expect(Number.isNaN(Date.parse(got?.fetchedAt ?? "x"))).toBe(false);
  });
});
