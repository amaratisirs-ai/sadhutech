export { analyze } from "./analyze.js";
export { decodeTransaction } from "./decode.js";
export { evaluate } from "./rules.js";
export { ThreatIntel } from "./intel.js";
export { ThreatIntelPostgres } from "./intel-postgres.js";

import type { Address } from "@genesis/shared";
import { ThreatIntel } from "./intel.js";
import { ThreatIntelPostgres } from "./intel-postgres.js";
import { readFileSync } from "fs";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const feedPath = join(__dirname, "..", "data", "threat-feeds.json");

let cachedIntel: ThreatIntel | ThreatIntelPostgres | null = null;
let intelType: "memory" | "postgres" = "memory";

function loadThreatFeedsSync(): ThreatIntel {
  const intel = new ThreatIntel();
  try {
    const data = JSON.parse(readFileSync(feedPath, "utf-8"));
    const entries = data.entries.map(
      (e: { address: string; category: "drainer" | "malicious-contract" | "decoy-tripwire" | "sanctioned" | "phishing" }) => ({
        address: e.address.toLowerCase() as Address,
        category: e.category,
      })
    );
    intel.seed(entries);
  } catch (err) {
    console.error("[threat-intel] Failed to load feeds (sync), using fallback:", err);
    intel.seed([{ address: "0x000000000000000000000000000000000000dead" as Address, category: "drainer" }]);
  }
  return intel;
}

async function loadThreatFeedsAsync(): Promise<ThreatIntel> {
  const intel = new ThreatIntel();
  try {
    const data = JSON.parse(await readFile(feedPath, "utf-8"));
    const entries = data.entries.map(
      (e: { address: string; category: "drainer" | "malicious-contract" | "decoy-tripwire" | "sanctioned" | "phishing" }) => ({
        address: e.address.toLowerCase() as Address,
        category: e.category,
      })
    );
    intel.seed(entries);
  } catch (err) {
    console.error("[threat-intel] Failed to load feeds (async), using fallback:", err);
    intel.seed([{ address: "0x000000000000000000000000000000000000dead" as Address, category: "drainer" }]);
  }
  return intel;
}

/**
 * Async-first: creates or returns cached ThreatIntel (in-memory or Postgres).
 * Respects DATABASE_URL env var: if set, uses Postgres; otherwise in-memory.
 * Recommended for new code (server startup, etc.).
 */
export async function createIntelAsync(): Promise<ThreatIntel | ThreatIntelPostgres> {
  if (cachedIntel) return cachedIntel;

  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    // PostgreSQL mode
    const intel = new ThreatIntelPostgres(dbUrl);
    await intel.initialize();
    await intel.seed(
      [
        { address: "0x000000000000000000000000000000000000dead" as Address, category: "drainer" },
        { address: "0x00000000000000000000000000000000dec0de00" as Address, category: "decoy-tripwire" },
      ]
    );
    cachedIntel = intel;
    intelType = "postgres";
    console.log("[threat-intel] Using PostgreSQL mode (DATABASE_URL found)");
    return intel;
  } else {
    // In-memory mode
    const intel = await loadThreatFeedsAsync();
    cachedIntel = intel;
    intelType = "memory";
    console.log("[threat-intel] Using in-memory mode (DATABASE_URL not set)");
    return intel;
  }
}

/**
 * Sync fallback for tests and CLI tools that require blocking initialization.
 * Uses in-memory store only (PostgreSQL is async).
 */
export function createIntel(): ThreatIntel {
  if (cachedIntel && intelType === "memory") {
    return cachedIntel as ThreatIntel;
  }
  if (!cachedIntel) {
    cachedIntel = loadThreatFeedsSync();
    intelType = "memory";
  }
  return cachedIntel as ThreatIntel;
}

/**
 * Get the cached instance without creating a new one. Used by server.
 */
export function getCachedIntel(): (ThreatIntel | ThreatIntelPostgres) | null {
  return cachedIntel;
}
