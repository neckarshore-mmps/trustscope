import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ReportKey, ReportStore, StoredReport } from "./types";

const safe = (s: string) => s.replace(/[^A-Za-z0-9._-]/g, "-");

/**
 * File-backed ReportStore — a genuinely PERSISTENT local impl (survives restarts), one JSON file
 * per (owner, repo, commit). Fine for dev; prod swaps in a Postgres impl behind the same interface.
 */
export class FileReportStore implements ReportStore {
  constructor(private readonly dir: string) {}

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
    await writeFile(this.fileFor(stored.key), JSON.stringify(stored, null, 2), "utf8");
  }
}
