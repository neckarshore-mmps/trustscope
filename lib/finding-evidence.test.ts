import { describe, expect, it } from "vitest";
import type { Finding } from "./report-core/types";
import { findingHasEvidence } from "./finding-evidence";

const base: Finding = {
  check: "Branch-Protection",
  label: "Branch protection",
  status: "warn",
  score: 2,
  reason: "branch protection not enabled on the default branch",
  source: "scorecard",
};

describe("findingHasEvidence", () => {
  it("is false with no details and no docUrl", () => {
    expect(findingHasEvidence(base)).toBe(false);
  });
  it("is false for an empty details array", () => {
    expect(findingHasEvidence({ ...base, details: [] })).toBe(false);
  });
  it("is true when details are present", () => {
    expect(findingHasEvidence({ ...base, details: ["Warn: no branch protection"] })).toBe(true);
  });
  it("is true when a docUrl is present", () => {
    expect(
      findingHasEvidence({
        ...base,
        docUrl: "https://ossf.github.io/scorecard/checks#branch-protection",
      }),
    ).toBe(true);
  });
});
