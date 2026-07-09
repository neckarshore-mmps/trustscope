import { mkdir, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ReportKey, ReportStore, StoredReport } from "./types";

const safe = (s: string) => s.replace(/[^A-Za-z0-9._-]/g, "-");

/** Default cap on stored report files — bounds unbounded growth (§5). Prod (Postgres) has no such cap. */
const DEFAULT_MAX_ENTRIES = 500;

/** Process-local counter so concurrent temp files never collide within an instance. */
let tmpCounter = 0;

/**
 * File-backed ReportStore — a genuinely PERSISTENT local impl (survives restarts), one JSON file
 * per (owner, repo, commit). Fine for dev; prod swaps in a Postgres impl behind the same interface.
 *
 * §5 hardening:
 *  - `put` writes to a unique temp file then `rename`s it over the final path. rename is atomic on
 *    POSIX, so a concurrent reader never observes a half-written file (the non-atomic writeFile could).
 *  - growth is bounded to `maxEntries`; the oldest entries (by fetchedAt) are evicted on overflow.
 */
export class FileReportStore implements ReportStore {
  constructor(
    private readonly dir: string,
    private readonly maxEntries: number = DEFAULT_MAX_ENTRIES,
  ) {}

  private fileFor(k: ReportKey): string {
    return join(this.dir, `${safe(k.owner)}__${safe(k.repo)}__${safe(k.commit)}.json`);
  }

  async get(key: ReportKey): Promise<StoredReport | null> {
    try {
      return JSON.parse(await readFile(this.fileFor(key), "utf8")) as StoredReport;
    } catch {
      return null;
    }
  }

  async getLatest(owner: string, repo: string): Promise<StoredReport | null> {
    const prefix = `${safe(owner)}__${safe(repo)}__`;
    let files: string[];
    try {
      files = await readdir(this.dir);
    } catch {
      return null;
    }
    let latest: StoredReport | null = null;
    for (const f of files) {
      if (!f.startsWith(prefix) || !f.endsWith(".json")) continue;
      try {
        const s = JSON.parse(await readFile(join(this.dir, f), "utf8")) as StoredReport;
        if (!latest || s.fetchedAt > latest.fetchedAt) latest = s;
      } catch {
        // skip unreadable/corrupt entries
      }
    }
    return latest;
  }

  async put(stored: StoredReport): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    const finalPath = this.fileFor(stored.key);
    // Atomic write: serialize to a unique temp file, then rename over the final path.
    const tmpPath = `${finalPath}.tmp-${process.pid}-${tmpCounter++}`;
    try {
      await writeFile(tmpPath, JSON.stringify(stored, null, 2), "utf8");
      await rename(tmpPath, finalPath);
    } catch (err) {
      await unlink(tmpPath).catch(() => {}); // never leave a temp file behind on failure
      throw err;
    }
    await this.evictOverflow();
  }

  /** Keep at most `maxEntries` report files; drop the oldest (by fetchedAt) beyond the cap. */
  private async evictOverflow(): Promise<void> {
    let files: string[];
    try {
      files = (await readdir(this.dir)).filter((f) => f.endsWith(".json"));
    } catch {
      return;
    }
    if (files.length <= this.maxEntries) return;

    const withAge = await Promise.all(
      files.map(async (f) => {
        try {
          const s = JSON.parse(await readFile(join(this.dir, f), "utf8")) as StoredReport;
          return { f, fetchedAt: s.fetchedAt };
        } catch {
          return { f, fetchedAt: "" }; // corrupt/unreadable -> evict first
        }
      }),
    );
    withAge.sort((a, b) => (a.fetchedAt < b.fetchedAt ? -1 : a.fetchedAt > b.fetchedAt ? 1 : 0));
    const toEvict = withAge.slice(0, withAge.length - this.maxEntries);
    await Promise.all(toEvict.map(({ f }) => unlink(join(this.dir, f)).catch(() => {})));
  }
}
