import type { Finding } from "@/lib/report-core/types";

/** True when a finding carries raw evidence worth exposing (Scorecard details or a doc link). */
export function findingHasEvidence(finding: Finding): boolean {
  return (finding.details?.length ?? 0) > 0 || Boolean(finding.docUrl);
}
