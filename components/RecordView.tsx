"use client";

import { useEffect } from "react";
import { recordRecentRepo } from "@/lib/use-recent-repos";

/**
 * Records a successfully-viewed repo into the client-local recent list. Renders
 * nothing. Owner/repo MUST be the canonical identity from the resolved report
 * (report.repo.owner / report.repo.name), not the user-typed input — otherwise
 * case divergence (OSSF/Scorecard vs ossf/scorecard) creates duplicate recents.
 */
export function RecordView({ owner, repo }: { owner: string; repo: string }) {
  useEffect(() => {
    recordRecentRepo(owner, repo, new Date().toISOString());
  }, [owner, repo]);
  return null;
}
