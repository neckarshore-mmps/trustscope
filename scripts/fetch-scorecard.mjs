#!/usr/bin/env node
/**
 * Fetch the OpenSSF `scorecard` Go binary for the current platform into ./bin/scorecard.
 * This is the Vercel-native on-demand runner (§7 #4): the binary runs in a Fluid-Compute
 * function — no Docker. Runs as a `prebuild` step so Vercel's linux build fetches linux_amd64;
 * idempotent (skips if the pinned version is already present). Local dev doesn't need it (Docker).
 *
 * §2 supply-chain hardening: GitHub release assets are MUTABLE (a tag can be re-pushed). We pin the
 * expected SHA-256 per platform asset and verify the download before extracting — a tampered or
 * swapped artifact fails the build instead of shipping an unverified executable. Bump the pins
 * deliberately at each version bump, same discipline as a lockfile hash.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import { chmod, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import process from "node:process";

const run = promisify(execFile);

const VERSION = "5.5.0"; // pinned; bump deliberately

/**
 * Pinned SHA-256 of each platform asset for VERSION, keyed by `${VERSION}_${OS}_${ARCH}`.
 * Source of truth: the release's `scorecard_checksums.txt`, cross-checked against the actual
 * downloaded asset. Re-pin on every VERSION bump.
 */
export const EXPECTED_SHA256 = {
  "5.5.0_darwin_amd64": "979487ca20e726f6a4d2bd63a0a4c544184f589724b3d12d2ba8d0ea80889063",
  "5.5.0_darwin_arm64": "bac6371a4f810d6bdd0b65d63c3311906bdfe3ba0d76a5ea743ce24ced170fcf",
  "5.5.0_linux_amd64": "83b90a05c1540ef1390db1cd5711e5fd04be9c1d8537fb84d39d02092d6a8dff",
  "5.5.0_linux_arm64": "3ce59d20c1d53e540c4a14e0da1e0d96b3b294e8ddc96a3c5a7b8a637b32991e",
};

const BIN_DIR = join(process.cwd(), "bin");
const BIN_PATH = join(BIN_DIR, "scorecard");
const STAMP = join(BIN_DIR, ".scorecard-version");

const OS = process.platform === "darwin" ? "darwin" : "linux";
const ARCH = process.arch === "arm64" ? "arm64" : "amd64";
// Platform-tagged so a darwin binary uploaded from a dev machine never satisfies a linux build
// (otherwise "cannot execute binary file" at runtime on Vercel).
const TAG = `${VERSION}_${OS}_${ARCH}`;

function assetName() {
  return `scorecard_${TAG}.tar.gz`;
}

/** Lowercase hex SHA-256 of a buffer. */
export function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

/**
 * Verify a downloaded artifact against its pinned checksum. Fail-closed: an unknown tag (no pin) is
 * a hard error, not a skip — we never run an unverified executable. Returns the verified digest.
 */
export function verifyChecksum(buffer, tag, expected = EXPECTED_SHA256) {
  const want = expected[tag];
  if (!want) {
    throw new Error(
      `No pinned SHA-256 for "${tag}". Refusing to use an unverified Scorecard binary — ` +
        `add the checksum to EXPECTED_SHA256 (from the release scorecard_checksums.txt).`,
    );
  }
  const got = sha256(buffer);
  if (got !== want) {
    throw new Error(
      `Scorecard checksum mismatch for ${tag}:\n  expected ${want}\n  got      ${got}\n` +
        `The release asset may have been re-pushed or tampered with. Build aborted.`,
    );
  }
  return got;
}

export async function main() {
  if (existsSync(BIN_PATH) && existsSync(STAMP)) {
    const have = await readFile(STAMP, "utf8").catch(() => "");
    if (have.trim() === TAG) {
      console.log(`scorecard ${TAG} already present at ${BIN_PATH}`);
      return;
    }
  }

  const name = assetName();
  const url = `https://github.com/ossf/scorecard/releases/download/v${VERSION}/${name}`;
  console.log(`Fetching ${url} ...`);

  await mkdir(BIN_DIR, { recursive: true });
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());

  // §2: verify BEFORE writing/extracting — a bad artifact never touches the build output.
  verifyChecksum(buf, TAG);
  console.log(`checksum OK (sha256 ${EXPECTED_SHA256[TAG]})`);

  const tgz = join(BIN_DIR, name);
  await writeFile(tgz, buf);

  // Extract just the `scorecard` binary (tar is present on macOS + Vercel's linux builders).
  await run("tar", ["-xzf", tgz, "-C", BIN_DIR, "scorecard"]);
  await rm(tgz, { force: true });
  await chmod(BIN_PATH, 0o755);
  await writeFile(STAMP, TAG);
  console.log(`scorecard ${TAG} ready at ${BIN_PATH}`);
}

// Only run when executed directly (`node scripts/fetch-scorecard.mjs`), not when imported by a test.
const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main().catch((err) => {
    console.error("fetch-scorecard failed:", err.message);
    process.exit(1);
  });
}
