import { keyId, type ReportKey, type ReportStore, type StoredReport } from "./types";

/** In-memory ReportStore — zero-config, for tests and single-instance dev. */
export class InMemoryReportStore implements ReportStore {
  private readonly map = new Map<string, StoredReport>();

  async get(key: ReportKey): Promise<StoredReport | null> {
    return this.map.get(keyId(key)) ?? null;
  }

  async getLatest(owner: string, repo: string): Promise<StoredReport | null> {
    let latest: StoredReport | null = null;
    for (const s of this.map.values()) {
      if (s.key.owner === owner && s.key.repo === repo) {
        if (!latest || s.fetchedAt > latest.fetchedAt) latest = s;
      }
    }
    return latest;
  }

  async put(stored: StoredReport): Promise<void> {
    this.map.set(keyId(stored.key), stored);
  }
}
