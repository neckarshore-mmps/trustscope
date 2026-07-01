import { FileReportStore } from "./file-store";
import { InMemoryReportStore } from "./memory-store";
import type { ReportStore } from "./types";

export type { ReportKey, ReportStore, StoredReport } from "./types";
export { keyId } from "./types";
export { InMemoryReportStore } from "./memory-store";
export { FileReportStore } from "./file-store";

const globalRef = globalThis as unknown as { __trustscopeStore?: ReportStore };

/**
 * The process-wide ReportStore singleton. Selected by REPORT_STORE ("file" default | "memory").
 * A Postgres impl (Neon / Vercel Postgres) plugs in here as a third case at deploy time (§3 #6).
 */
export function getReportStore(): ReportStore {
  if (globalRef.__trustscopeStore) return globalRef.__trustscopeStore;
  const kind = process.env.REPORT_STORE ?? "file";
  globalRef.__trustscopeStore =
    kind === "memory"
      ? new InMemoryReportStore()
      : new FileReportStore(process.env.REPORT_STORE_DIR ?? ".trustscope-cache");
  return globalRef.__trustscopeStore;
}
