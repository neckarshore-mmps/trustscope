import { describe, expect, it } from "vitest";
import { parseRepoInput } from "./parse-repo-input";

describe("parseRepoInput", () => {
  const ok: Array<[string, string, string]> = [
    ["https://github.com/ossf/scorecard", "ossf", "scorecard"],
    ["http://github.com/ossf/scorecard", "ossf", "scorecard"],
    ["https://www.github.com/ossf/scorecard", "ossf", "scorecard"],
    ["github.com/ossf/scorecard", "ossf", "scorecard"],
    ["ossf/scorecard", "ossf", "scorecard"],
    ["ossf/scorecard.git", "ossf", "scorecard"],
    ["https://github.com/ossf/scorecard/", "ossf", "scorecard"],
    ["https://github.com/ossf/scorecard/tree/main/docs", "ossf", "scorecard"],
    ["git@github.com:ossf/scorecard.git", "ossf", "scorecard"],
    ["  ossf/scorecard  ", "ossf", "scorecard"],
    ["neckarshore-mmps/snakeoil-check", "neckarshore-mmps", "snakeoil-check"],
  ];

  it.each(ok)("parses %s", (input, owner, repo) => {
    expect(parseRepoInput(input)).toEqual({ owner, repo });
  });

  const bad = [
    "",
    "   ",
    "notarepo",
    "https://github.com/ossf",
    "/",
    "ossf/",
    "/scorecard",
    "https://gitlab.com/group/project", // non-GitHub host -> owner 'gitlab.com' has a dot -> rejected
  ];
  it.each(bad)("rejects %j", (input) => {
    expect(parseRepoInput(input)).toBeNull();
  });
});
