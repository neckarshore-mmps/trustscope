import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Fixture-sanitization guard (work-order Tier-0 B4).
 *
 * The `fixtures/*.json` files are GitHub-API captures used by the report-core unit
 * suite. A raw capture of a PRIVATE repo once leaked its name/description,
 * `"private": true`, and a live `temp_clone_token` into this public repo — the worst
 * possible leak on a trust product. This test fails the build if any fixture carries
 * a real secret, a private-repo marker, or a real (non-synthetic) org/repo identity,
 * so a raw capture can never silently land again.
 *
 * Fixtures must be synthetic: `fixture-org/fixture-repo` (mirrors the e2e fixtures),
 * `"private": false`, `"visibility": "public"`, and no clone/access token of any kind.
 */

const FIXTURES_DIR = join(process.cwd(), "fixtures");

const fixtureFiles = readdirSync(FIXTURES_DIR).filter((f) => f.endsWith(".json"));

// Substrings that must never appear in a committed fixture. Case-insensitive.
const FORBIDDEN: Array<{ pattern: RegExp; why: string }> = [
  // Real org/repo identities the fixtures were captured from — must be synthetic.
  { pattern: /neckarshore-mmps/i, why: "real org slug (use fixture-org)" },
  { pattern: /snakeoil-check/i, why: "real private-repo name (use fixture-repo)" },
  // Private-repo markers — a public fixture must not reveal a private repo exists.
  { pattern: /"private"\s*:\s*true/i, why: "private-repo marker" },
  { pattern: /"visibility"\s*:\s*"private"/i, why: "private visibility marker" },
  // Any clone/access token, even empty or expired — no token key belongs in a fixture.
  { pattern: /temp_clone_token/i, why: "clone-token key (drop it entirely)" },
  { pattern: /\bghp_[A-Za-z0-9]{20,}/, why: "GitHub personal access token" },
  { pattern: /\bgithub_pat_[A-Za-z0-9_]{20,}/, why: "GitHub fine-grained PAT" },
  { pattern: /\bgho_[A-Za-z0-9]{20,}/, why: "GitHub OAuth token" },
];

describe("fixtures are sanitized (no secrets, no private-repo identity)", () => {
  it("discovers the fixture files", () => {
    expect(fixtureFiles.length).toBeGreaterThan(0);
  });

  it.each(fixtureFiles)("%s carries no forbidden marker", (file) => {
    const raw = readFileSync(join(FIXTURES_DIR, file), "utf8");
    const hits = FORBIDDEN.filter(({ pattern }) => pattern.test(raw)).map(
      ({ why }) => why,
    );
    expect(hits, `${file} leaks: ${hits.join(", ")}`).toEqual([]);
  });

  it.each(fixtureFiles)("%s is parseable JSON", (file) => {
    expect(() =>
      JSON.parse(readFileSync(join(FIXTURES_DIR, file), "utf8")),
    ).not.toThrow();
  });
});
