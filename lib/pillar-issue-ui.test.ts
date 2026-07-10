import { describe, expect, it } from "vitest";
import { pillarIssueUi } from "./pillar-issue-ui";

describe("pillarIssueUi — OAuth configured (one-click, direct to repo)", () => {
  const ui = pillarIssueUi(true);
  const hint = ui.hint.join("\n");

  it("is the direct mode with the neutral issue-dot icon", () => {
    expect(ui.mode).toBe("direct");
    expect(ui.iconKind).toBe("issue-dot");
  });

  it("keeps the shared labels", () => {
    expect(ui.label).toBe("File issue");
    expect(ui.copyLabel).toBe("Copy issue");
  });

  it("explains the one-click path as the user's own action", () => {
    expect(hint).toMatch(/one click/i);
    expect(hint).toMatch(/as yourself/i);
  });

  it("guards the doctrine — attribution + never a bot", () => {
    expect(hint).toMatch(/via TrustScope/);
    expect(hint).toMatch(/never a .*bot/i);
  });
});

describe("pillarIssueUi — OAuth absent (pre-filled fallback)", () => {
  const ui = pillarIssueUi(false);
  const hint = ui.hint.join("\n");

  it("is the pre-fill mode with the person icon", () => {
    expect(ui.mode).toBe("prefill");
    expect(ui.iconKind).toBe("person");
  });

  it("keeps the shared labels", () => {
    expect(ui.label).toBe("File issue");
    expect(ui.copyLabel).toBe("Copy issue");
  });

  it("explains submitting via GitHub's own form, as yourself", () => {
    expect(hint).toMatch(/form/i);
    expect(hint).toMatch(/as yourself/i);
  });

  it("guards the doctrine — attribution + never a bot", () => {
    expect(hint).toMatch(/via TrustScope/);
    expect(hint).toMatch(/never a .*bot/i);
  });
});
