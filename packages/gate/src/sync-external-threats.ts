/**
 * External Threat Intelligence Sync
 * Syncs threat data from curated seed + fallback to external APIs.
 * Runs on server startup or via scheduled job.
 */

import { ThreatIntelPostgres } from "./intel-postgres.js";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import type { Address, ThreatCategory } from "@genesis/shared";

const __dirname = dirname(fileURLToPath(import.meta.url));
const feedPath = join(__dirname, "..", "data", "threat-feeds.json");

interface ExternalThreat {
  address: string;
  category: ThreatCategory;
  source: string;
  title?: string;
}

/**
 * Load curated threat feed from local JSON file (primary source).
 * This is always available and contains vetted incidents.
 */
async function loadCuratedThreats(): Promise<ExternalThreat[]> {
  try {
    console.log("[sync] Loading curated threat feed...");
    const data = JSON.parse(await readFile(feedPath, "utf-8"));
    if (!Array.isArray(data.entries)) return [];

    return data.entries.map((e: any) => ({
      address: e.address.toLowerCase(),
      category: e.category,
      source: "curated",
      title: e.title,
    })) as ExternalThreat[];
  } catch (err) {
    console.error("[sync] Curated feed load failed:", err);
    return [];
  }
}

/**
 * Attempt to fetch additional threats from public APIs (best-effort).
 * Failures are non-fatal.
 */
async function fetchExternalThreats(): Promise<ExternalThreat[]> {
  const threats: ExternalThreat[] = [];

  // Try TokenSniffer API
  try {
    console.log("[sync] Attempting TokenSniffer API...");
    const res = await fetch("https://www.tokensniffer.com/api/v2/tokens?page=1&order=recent", {
      headers: { "User-Agent": "GENESIS-Gate/1.0" },
    });
    if (res.ok) {
      const data = (await res.json()) as any;
      if (data.tokens && Array.isArray(data.tokens)) {
        data.tokens
          .filter((t: any) => t.honeypot_score > 0.8 || t.rugpull_score > 0.8)
          .slice(0, 100)
          .forEach((t: any) => {
            threats.push({
              address: t.address.toLowerCase(),
              category: t.honeypot_score > 0.8 ? ("decoy-tripwire" as ThreatCategory) : ("drainer" as ThreatCategory),
              source: "tokensniffer",
              title: `${t.name} (TokenSniffer)`,
            });
          });
        console.log(`[sync] Got ${threats.length} threats from TokenSniffer`);
      }
    }
  } catch (err) {
    console.log("[sync] TokenSniffer unavailable (non-fatal)");
  }

  return threats;
}

/**
 * Main sync function: load curated data + attempt external sources.
 * Idempotent: safe to run multiple times.
 */
export async function syncExternalThreats(
  intel: ThreatIntelPostgres
): Promise<{ synced: number; errors: number }> {
  console.log("[sync] Starting threat intelligence sync...");
  const startTime = Date.now();
  let synced = 0;
  let errors = 0;

  try {
    // Primary: Load curated threats (always works)
    const curatedThreats = await loadCuratedThreats();

    // Secondary: Try external APIs (best-effort)
    const externalThreats = await fetchExternalThreats();

    const allThreats = [...curatedThreats, ...externalThreats];
    console.log(`[sync] Loaded ${allThreats.length} total threats`);

    // Deduplicate by address
    const uniqueThreats = new Map<string, ExternalThreat>();
    for (const threat of allThreats) {
      const key = threat.address.toLowerCase() as Address;
      if (!uniqueThreats.has(key)) {
        uniqueThreats.set(key, threat);
      }
    }

    // Insert into database
    for (const [address, threat] of uniqueThreats) {
      try {
        await intel.report({
          address: address as Address,
          category: threat.category,
          reporterId: `sync-${threat.source}`,
        });
        synced++;
      } catch (err) {
        console.error(`[sync] Failed to insert ${address}:`, (err as any)?.message || err);
        errors++;
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`[sync] ✅ Synced ${synced} threats (${errors} errors) in ${elapsed}ms`);

    return { synced, errors };
  } catch (err) {
    console.error("[sync] Fatal error during sync:", err);
    return { synced, errors };
  }
}

/**
 * Initialize sync service: run once on startup, then periodically.
 */
export async function initSyncService(
  intel: ThreatIntelPostgres,
  options?: {
    runOnStartup?: boolean;
    intervalHours?: number;
  }
): Promise<void> {
  const { runOnStartup = true, intervalHours = 6 } = options || {};

  if (runOnStartup) {
    await syncExternalThreats(intel);
  }

  // Run periodically
  if (intervalHours > 0) {
    setInterval(
      () => syncExternalThreats(intel).catch(console.error),
      intervalHours * 60 * 60 * 1000
    );
    console.log(`[sync] Scheduled to run every ${intervalHours} hours`);
  }
}
