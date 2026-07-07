import { describe, expect, it } from "vitest";
import * as fetcher from "./fetch-scorecard.mjs";

const EXPECTED_SHA256 = fetcher.EXPECTED_SHA256 as Record<string, string>;
const sha256 = fetcher.sha256 as (buffer: Buffer) => string;
const verifyChecksum = fetcher.verifyChecksum as (
  buffer: Buffer,
  tag: string,
  expected?: Record<string, string>,
) => string;

/**
 * §2 supply-chain: the fetched Scorecard binary is verified against a pinned SHA-256 before use.
 * A tampered/swapped artifact must fail the build; the happy path verifies and proceeds.
 */
describe("fetch-scorecard checksum verification (§2)", () => {
  const buf = Buffer.from("pretend this is a scorecard tarball");

  it("passes when the artifact matches its pinned checksum (happy path)", () => {
    const digest = sha256(buf);
    expect(() => verifyChecksum(buf, "test-tag", { "test-tag": digest })).not.toThrow();
    expect(verifyChecksum(buf, "test-tag", { "test-tag": digest })).toBe(digest);
  });

  it("throws on a tampered artifact (checksum mismatch)", () => {
    const wrong = "0".repeat(64);
    expect(() => verifyChecksum(buf, "test-tag", { "test-tag": wrong })).toThrow(
      /checksum mismatch/i,
    );
  });

  it("fails closed on an unpinned platform (no pin -> hard error, never skip)", () => {
    expect(() => verifyChecksum(buf, "unknown_os_arch", {})).toThrow(/no pinned sha-256/i);
  });

  it("sha256 is stable and lowercase-hex", () => {
    expect(sha256(Buffer.from(""))).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  it("ships a real pin for every platform the fetcher targets (darwin/linux × amd64/arm64)", () => {
    for (const tag of [
      "5.5.0_darwin_amd64",
      "5.5.0_darwin_arm64",
      "5.5.0_linux_amd64",
      "5.5.0_linux_arm64",
    ]) {
      expect(EXPECTED_SHA256[tag]).toMatch(/^[0-9a-f]{64}$/);
    }
  });
});
