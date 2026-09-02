#!/usr/bin/env node
/**
 * Database migration CLI.
 * Standalone tool to initialize schema without running server.
 * Usage: pnpm --filter @genesis/gate migrate
 */

import { ThreatIntelPostgres } from "./intel-postgres.js";

async function migrate(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("[migrate] ERROR: DATABASE_URL not set. Set it and retry.");
    process.exit(1);
  }

  try {
    console.log("[migrate] Initializing schema...");
    const intel = new ThreatIntelPostgres(dbUrl);
    await intel.initialize();
    console.log("[migrate] ✅ Schema initialized successfully");
    process.exit(0);
  } catch (err) {
    console.error("[migrate] ❌ Migration failed:", err);
    process.exit(1);
  }
}

migrate();
