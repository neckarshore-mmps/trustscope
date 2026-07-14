import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findGluedWords } from "./jsx-whitespace-guard.mjs";

// Every fixture here is a snippet of what Next ACTUALLY emits: React separates two
// adjacent text nodes with an empty `<!-- -->` comment. A glued word therefore looks
// like `TrustScope<!-- -->grew` — no space either side of the marker. The guard reads
// the prerendered output rather than the .tsx source on purpose; see the .mjs header.

const GUARD = "scripts/jsx-whitespace-guard.mjs";

function runCli(dir: string) {
  return spawnSync("node", [GUARD, dir], { encoding: "utf8" });
}

describe("findGluedWords", () => {
  it("finds a word glued to the next word across a text-node boundary", () => {
    expect(findGluedWords("<p>care about. TrustScope<!-- -->grew out of</p>")).toEqual([
      "TrustScope<!-- -->grew",
    ]);
  });

  it("finds a glued German word (umlaut after the boundary)", () => {
    expect(findGluedWords("<p>TrustScope<!-- -->überträgt keine</p>")).toEqual([
      "TrustScope<!-- -->überträgt",
    ]);
  });

  it("finds every occurrence on a page, not just the first", () => {
    const html = "<p>TrustScope<!-- -->runs it</p><p>TrustScope<!-- -->keeps it</p>";
    expect(findGluedWords(html)).toEqual(["TrustScope<!-- -->runs", "TrustScope<!-- -->keeps"]);
  });

  it("accepts an explicit space node — the {\" \"} fix", () => {
    expect(findGluedWords("<p>TrustScope<!-- --> <!-- -->grew out</p>")).toEqual([]);
  });

  it("accepts a boundary followed by punctuation — normal React output", () => {
    expect(findGluedWords("<p>built by TrustScope<!-- -->. Next question.</p>")).toEqual([]);
  });

  it("accepts a boundary followed by an uppercase word — a new sentence, not a glue", () => {
    expect(findGluedWords("<p>TrustScope<!-- -->Berlin</p>")).toEqual([]);
  });
});

describe("jsx-whitespace-guard CLI", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "ws-guard-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("exits 1 and names the offending file when a page has a glued word", () => {
    writeFileSync(join(dir, "about.html"), "<p>care about. TrustScope<!-- -->grew out</p>");

    const res = runCli(dir);

    expect(res.status).toBe(1);
    expect(res.stdout).toContain("TrustScope<!-- -->grew");
    expect(res.stdout).toContain("about.html");
  });

  it("scans nested route directories, not just the top level", () => {
    mkdirSync(join(dir, "vs"));
    writeFileSync(join(dir, "vs", "openssf-scorecard.html"), "<p>TrustScope<!-- -->runs the</p>");

    expect(runCli(dir).status).toBe(1);
  });

  it("exits 0 on a clean prerendered tree", () => {
    writeFileSync(join(dir, "index.html"), "<p>TrustScope<!-- --> <!-- -->grew out</p>");
    writeFileSync(join(dir, "faq.html"), "<p>built by TrustScope<!-- -->. Next.</p>");

    const res = runCli(dir);

    expect(res.status).toBe(0);
    expect(res.stdout).toContain("✅");
  });

  it("fails closed when the build output directory is missing", () => {
    const res = runCli(join(dir, "does-not-exist"));

    expect(res.status).toBe(1);
    expect(res.stdout).toContain("missing");
  });

  it("fails closed when the build output holds no prerendered HTML", () => {
    // An empty tree must not read as a clean tree — that is how a guard silently
    // stops guarding (e.g. the build step moved and nobody noticed).
    const res = runCli(dir);

    expect(res.status).toBe(1);
    expect(res.stdout).toContain("no prerendered");
  });
});
