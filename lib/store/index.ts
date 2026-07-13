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
 * Construct a ReportStore for the given REPORT_STORE kind. Pure (no singleton) so it is directly
 * testable. "neon" is the prod cross-instance impl (§3 #6) and fails LOUD if DATABASE_URL is
 * absent — a silent file fallback would resurrect the per-instance "Not assessed" bug this fixes.
 */
export function createReportStore(kind: string | undefined): ReportStore {
  switch (kind) {
    case "memory":
      return new InMemoryReportStore();
    case "neon": {
      const url = process.env.DATABASE_URL;
      if (!url) throw new Error("REPORT_STORE=neon requires DATABASE_URL to be set");
      return new NeonReportStore(url);
    }
    default:
      return new FileReportStore(process.env.REPORT_STORE_DIR ?? ".trustscope-cache");
  }
}

/**
 * The process-wide ReportStore singleton. Selected by REPORT_STORE ("file" default | "memory" | "neon").
 */
export function getReportStore(): ReportStore {
  if (globalRef.__trustscopeStore) return globalRef.__trustscopeStore;
  globalRef.__trustscopeStore = createReportStore(process.env.REPORT_STORE);
  return globalRef.__trustscopeStore;
}
