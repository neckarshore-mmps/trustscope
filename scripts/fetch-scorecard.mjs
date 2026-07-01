#!/usr/bin/env node
/**
 * Fetch the OpenSSF `scorecard` Go binary for the current platform into ./bin/scorecard.
 * This is the Vercel-native on-demand runner (§7 #4): the binary runs in a Fluid-Compute
 * function — no Docker. Runs as a `prebuild` step so Vercel's linux build fetches linux_amd64;
 * idempotent (skips if the pinned version is already present). Local dev doesn't need it (Docker).
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { chmod, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const run = promisify(execFile);

const VERSION = "5.5.0"; // pinned; bump deliberately
const BIN_DIR = join(process.cwd(), "bin");
const BIN_PATH = join(BIN_DIR, "scorecard");
const STAMP = join(BIN_DIR, ".scorecard-version");

function assetName() {
  const os = process.platform === "darwin" ? "darwin" : "linux";
  const arch = process.arch === "arm64" ? "arm64" : "amd64";
  return `scorecard_${VERSION}_${os}_${arch}.tar.gz`;
}

async function main() {
  if (existsSync(BIN_PATH) && existsSync(STAMP)) {
    const have = await readFile(STAMP, "utf8").catch(() => "");
    if (have.trim() === VERSION) {
      console.log(`scorecard ${VERSION} already present at ${BIN_PATH}`);
      return;
    }
  }

  const name = assetName();
  const url = `https://github.com/ossf/scorecard/releases/download/v${VERSION}/${name}`;
  console.log(`Fetching ${url} ...`);

  await mkdir(BIN_DIR, { recursive: true });
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status} for ${url}`);
  const tgz = join(BIN_DIR, name);
  await writeFile(tgz, Buffer.from(await res.arrayBuffer()));

  // Extract just the `scorecard` binary (tar is present on macOS + Vercel's linux builders).
  await run("tar", ["-xzf", tgz, "-C", BIN_DIR, "scorecard"]);
  await rm(tgz, { force: true });
  await chmod(BIN_PATH, 0o755);
  await writeFile(STAMP, VERSION);
  console.log(`scorecard ${VERSION} ready at ${BIN_PATH}`);
}

main().catch((err) => {
  console.error("fetch-scorecard failed:", err.message);
  process.exit(1);
});
