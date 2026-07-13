import { FileReportStore } from "./file-store";
import { InMemoryReportStore } from "./memory-store";
import { NeonReportStore } from "./neon-store";
import type { ReportStore } from "./types";

export type { ReportKey, ReportStore, StoredReport } from "./types";
export { keyId } from "./types";
export { InMemoryReportStore } from "./memory-store";
export { FileReportStore } from "./file-store";
export { NeonReportStore } from "./neon-store";

const globalRef = globalThis as unknown as { __trustscopeStore?: ReportStore };

/**
 * The process-wide ReportStore singleton. Selected by REPORT_STORE:
 *   - "neon" | "postgres" → NeonReportStore (prod: cross-instance-durable, needs DATABASE_URL)
 *   - "memory"            → InMemoryReportStore (tests / single-instance dev)
 *   - "file" (default)    → FileReportStore (local dev persistence)
 *
 * Prod runs "neon" because Fluid Compute's per-instance filesystem makes the file store
 * cross-instance-invisible (the OG-card "Not assessed" bug this store fixes).
 */
export function getReportStore(): ReportStore {
  if (globalRef.__trustscopeStore) return globalRef.__trustscopeStore;
  const kind = process.env.REPORT_STORE ?? "file";
  globalRef.__trustscopeStore =
    kind === "neon" || kind === "postgres"
      ? new NeonReportStore(process.env.DATABASE_URL)
      : kind === "memory"
        ? new InMemoryReportStore()
        : new FileReportStore(process.env.REPORT_STORE_DIR ?? ".trustscope-cache");
  return globalRef.__trustscopeStore;
}
