#!/usr/bin/env node
/**
 * Manual threat sync CLI
 * Usage: pnpm --filter @genesis/gate sync
 * Useful for testing or forcing an immediate sync without waiting 6 hours
 */

import { ThreatIntelPostgres } from "./intel-postgres.js";
import { syncExternalThreats } from "./sync-external-threats.js";

async function main(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("[cli] ERROR: DATABASE_URL not set");
    process.exit(1);
  }

  try {
    console.log("[cli] Initializing threat intel...");
    const intel = new ThreatIntelPostgres(dbUrl);
    await intel.initialize();

    console.log("[cli] Starting manual sync...");
    const result = await syncExternalThreats(intel);

    console.log(`[cli] ✅ Sync complete: ${result.synced} threats added, ${result.errors} errors`);

    await intel.close();
    process.exit(0);
  } catch (err) {
    console.error("[cli] Fatal error:", err);
    process.exit(1);
  }
}

main();
