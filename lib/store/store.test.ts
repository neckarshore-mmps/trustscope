import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { buildReport } from "@/lib/report-core/build-report";
import { normalizeGitHubData } from "@/lib/report-core/normalize";
import { FileReportStore } from "./file-store";
import { InMemoryReportStore } from "./memory-store";
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
