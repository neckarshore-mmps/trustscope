#!/usr/bin/env node
// JSX whitespace guard — fails if a prerendered page glues two words into one.
//
// THE BUG (root cause, established by build-bisect 2026-07-14, NOT by theory):
// when a JSX text node contains an HTML entity (`&amp;`, `&apos;`, …), the SWC/Next 16
// JSX transform DROPS the leading space of the text run that follows an expression
// container. So this source — space present, all on one line —
//
//     trade-off you actually care about. {PRODUCT_NAME} grew out of a Product Trust
//     &amp; Quality Framework: …
//
// renders as "TrustScopegrew". The identical line WITHOUT the entity renders correctly.
// Proven with a 4-variant build matrix (entity × line-wrap): the entity is the trigger,
// the line-wrap is not. It shipped to prod once and was caught 4× in a single session
// (/about "grew", /vs "runs" ×2, "keeps"). The fix is always an explicit {" "}.
//
// WHY THIS SCANS THE BUILD OUTPUT, NOT THE .tsx SOURCE:
// the obvious source-level grep (`{VAR} word`) fires on ~30 legitimate lines in this
// repo (className={LINK} href=…, metadata template strings, ordinary same-line prose)
// while the real defect depends on an entity elsewhere in the same text run — a
// condition a line-oriented grep cannot see. The rendered output, by contrast, shows
// the defect unambiguously: React separates two adjacent text nodes with an empty
// `<!-- -->` comment, so a glued word is literally `TrustScope<!-- -->grew` — a word
// character on both sides of the marker and no space anywhere. That is a precise,
// zero-false-positive signal, and it stays correct even if the upstream cause changes
// or is fixed. Guard the symptom you can see, not the cause you have to infer.
//
// If a glue is ever DELIBERATE (two expressions intentionally rendered without a space,
// e.g. `{prefix}{suffix}`), add an exception here with a one-line reason — same
// convention as scripts/three-pillar-guard.sh.
//
// Usage: node scripts/jsx-whitespace-guard.mjs [buildOutputDir]   (default .next/server/app)
//        Requires a prior `npm run build` — it reads that build's output.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// A word character on BOTH sides of React's text-node separator, with no space:
// `TrustScope<!-- -->grew`. A lowercase letter after the marker means a word was cut
// in half; punctuation (`<!-- -->.`) or an uppercase letter (a new sentence) is normal
// React output and must not fire. \p{Ll}/\p{L} keep this correct for German copy
// (überträgt) without depending on the shell locale — the reason this is Node, not grep.
const GLUE_RE = /[\p{L}\p{N}]{2,}<!-- -->\p{Ll}[\p{L}]*/gu;

/** Return every glued word pair in a prerendered HTML string. */
export function findGluedWords(html) {
  return html.match(GLUE_RE) ?? [];
}

/** Recursively collect every prerendered .html file under dir. */
export function collectHtmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return collectHtmlFiles(path);
    return entry.isFile() && entry.name.endsWith(".html") ? [path] : [];
  });
}

function main() {
  const dir = process.argv[2] ?? ".next/server/app";

  try {
    if (!statSync(dir).isDirectory()) throw new Error("not a directory");
  } catch {
    console.log(`❌ JSX whitespace guard: build output '${dir}' is missing or unreadable.`);
    console.log("   Run `npm run build` first. Failing closed rather than reporting a clean tree.");
    process.exit(1);
  }

  const files = collectHtmlFiles(dir);

  // An empty tree must never read as a clean tree — that is exactly how a guard
  // silently stops guarding (the build step moves, the output lands elsewhere,
  // and the green check keeps saying "passed" forever).
  if (files.length === 0) {
    console.log(`❌ JSX whitespace guard: no prerendered .html found under '${dir}'.`);
    console.log("   Expected a completed `npm run build`. Failing closed.");
    process.exit(1);
  }

  const hits = files
    .map((file) => ({ file, glued: findGluedWords(readFileSync(file, "utf8")) }))
    .filter(({ glued }) => glued.length > 0);

  if (hits.length > 0) {
    console.log("❌ JSX whitespace guard failed — glued word(s) in the rendered output:");
    console.log("");
    for (const { file, glued } of hits) {
      for (const glue of [...new Set(glued)]) console.log(`   ${file}: ${glue}`);
    }
    console.log("");
    console.log("A JSX text node with an HTML entity (&amp;, &apos;, …) drops the leading");
    console.log('space after an expression. Fix the source with an explicit {" "}:');
    console.log('   {PRODUCT_NAME} grew   ->   {PRODUCT_NAME}{" "}grew');
    process.exit(1);
  }

  console.log(`✅ JSX whitespace guard passed — no glued words in ${files.length} prerendered pages.`);
}

// Only run the CLI when invoked directly, so the test can import the matcher.
if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) main();
