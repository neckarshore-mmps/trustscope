#!/usr/bin/env node
// Apply the TrustScope report-store migration against DATABASE_URL (Neon).
// Idempotent: every statement in sql/001_create_reports.sql is CREATE ... IF NOT EXISTS, so
// re-running is safe. Reproducible from the repo — the migration is versioned, not ad-hoc.
//
//   DATABASE_URL=postgres://... npm run db:migrate
//
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required (the pooled Neon connection string).");
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const file = join(here, "..", "sql", "001_create_reports.sql");
const raw = readFileSync(file, "utf8");

// Strip line comments, then split into individual statements (the HTTP driver runs one per call).
const statements = raw
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

const sql = neon(url);
console.log(`Applying ${statements.length} statement(s) from sql/001_create_reports.sql ...`);
for (const statement of statements) {
  await sql.query(statement);
  console.log(`  ok: ${statement.split("\n")[0].slice(0, 72)}`);
}
console.log("Migration complete.");
