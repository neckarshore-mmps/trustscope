#!/usr/bin/env node
// Apply the SQL migrations in sql/ against DATABASE_URL, in filename order.
// Idempotent (each file uses IF NOT EXISTS) — safe to re-run. Reproducible from the repo (C3 DoD).
//
//   DATABASE_URL="postgres://..." node scripts/db-migrate.mjs
//
// The Neon HTTP driver runs ONE statement per call, so we split each file on ';'.

import { neon } from "@neondatabase/serverless";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required (the pooled Neon connection string).");
  process.exit(1);
}

const sqlDir = join(dirname(fileURLToPath(import.meta.url)), "..", "sql");
const sql = neon(url);

const files = (await readdir(sqlDir)).filter((f) => f.endsWith(".sql")).sort();
if (files.length === 0) {
  console.error(`No .sql files found in ${sqlDir}`);
  process.exit(1);
}

for (const file of files) {
  const raw = await readFile(join(sqlDir, file), "utf8");
  const statements = raw
    .split(";")
    .map((s) => s.replace(/--[^\n]*/g, "").trim()) // strip line comments, trim
    .filter((s) => s.length > 0);
  for (const stmt of statements) {
    await sql.query(stmt);
  }
  console.log(`✓ applied ${file} (${statements.length} statement(s))`);
}

console.log("Migration complete.");
