#!/usr/bin/env node
/**
 * Database migration CLI.
 * Applies every .sql file in data/migrations (in order) to DATABASE_URL.
 * Usage: DATABASE_URL=... pnpm --filter @genesis/gate migrate
 */

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Pool } from "pg";

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "migrations");

async function migrate(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("[migrate] ERROR: DATABASE_URL not set. Set it and retry.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: dbUrl, max: 10 });
  try {
    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    if (files.length === 0) {
      console.error(`[migrate] No .sql files found in ${MIGRATIONS_DIR}`);
      process.exit(1);
    }
    for (const file of files) {
      console.log(`[migrate] Applying ${file}...`);
      await pool.query(readFileSync(join(MIGRATIONS_DIR, file), "utf8"));
    }
    console.log(`[migrate] ✅ Applied ${files.length} migration(s) successfully`);
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("[migrate] ❌ Migration failed:", err);
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

migrate();
