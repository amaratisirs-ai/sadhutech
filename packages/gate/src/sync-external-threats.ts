/**
 * External Threat Intelligence Sync
 * Pulls real threat data from free public APIs and syncs to Neon Postgres.
 * Runs on server startup or via scheduled job.
 *
 * Sources:
 * - Etherscan Scam Database (free, verified scams)
 * - Honeypot.is API (free, honeypot tokens)
 * - Community curated lists
 */

import { ThreatIntelPostgres } from "./intel-postgres.js";
import type { Address, ThreatCategory } from "@genesis/shared";

interface ExternalThreat {
  address: string;
  category: ThreatCategory;
  source: string;
  title?: string;
  incident?: string;
}

/**
 * Fetch verified scams from Etherscan (free, no auth required).
 * Returns list of known scam addresses.
 */
async function fetchEtherscanScams(): Promise<ExternalThreat[]> {
  try {
    console.log("[sync] Fetching Etherscan scam database...");
    // Etherscan maintains a public list of verified scams
    // This is a sample - in production, you'd paginate through results
    const res = await fetch("https://api.etherscan.io/api?module=account&action=getscamlist", {
      headers: { "User-Agent": "GENESIS-Gate/1.0" },
    });

    if (!res.ok) {
      console.warn("[sync] Etherscan API failed:", res.status);
      return [];
    }

    const data = (await res.json()) as any;
    if (data.status !== "1" || !Array.isArray(data.result)) {
      console.warn("[sync] Etherscan returned no results");
      return [];
    }

    return data.result.map((entry: any) => ({
      address: entry.address.toLowerCase(),
      category: categorizeScam(entry),
      source: "etherscan",
      title: entry.name,
      incident: entry.description,
    })) as ExternalThreat[];
  } catch (err) {
    console.error("[sync] Etherscan fetch failed:", err);
    return [];
  }
}

/**
 * Fetch honeypot tokens from honeypot.is (free API).
 * These are tokens that trap deposits and prevent withdrawals.
 */
async function fetchHoneypots(): Promise<ExternalThreat[]> {
  try {
    console.log("[sync] Fetching honeypot.is database...");
    // Honeypot.is provides a free API for checking honeypot contracts
    // Sample: check top honeypots
    const res = await fetch("https://api.honeypot.is/v2/list", {
      headers: { "User-Agent": "GENESIS-Gate/1.0" },
    });

    if (!res.ok) {
      console.warn("[sync] Honeypot.is API failed:", res.status);
      return [];
    }

    const data = (await res.json()) as any;
    if (!Array.isArray(data)) {
      console.warn("[sync] Honeypot.is returned unexpected format");
      return [];
    }

    return data.slice(0, 1000).map((entry: any) => ({
      address: entry.address.toLowerCase(),
      category: "decoy-tripwire" as ThreatCategory,
      source: "honeypot.is",
      title: `Honeypot: ${entry.token}`,
      incident: `Prevents selling/transfers`,
    })) as ExternalThreat[];
  } catch (err) {
    console.error("[sync] Honeypot.is fetch failed:", err);
    return [];
  }
}

/**
 * Fetch MEV extractors and sandwich attackers from known lists.
 * Uses community curated datasets (Github, OpenData).
 */
async function fetchMEVExtractors(): Promise<ExternalThreat[]> {
  try {
    console.log("[sync] Fetching MEV extractor list...");
    // Community-curated list of known MEV bots
    // Example: https://raw.githubusercontent.com/...
    const res = await fetch(
      "https://raw.githubusercontent.com/eigenspacing/mev-inspect-db/main/data/searcher_addresses.json",
      { headers: { "User-Agent": "GENESIS-Gate/1.0" } }
    );

    if (!res.ok) {
      console.warn("[sync] MEV list fetch failed:", res.status);
      return [];
    }

    const data = (await res.json()) as any;
    if (!Array.isArray(data)) return [];

    return data
      .filter((entry: any) => entry.is_bot || entry.is_extractor)
      .slice(0, 500)
      .map((entry: any) => ({
        address: entry.address.toLowerCase(),
        category: "malicious-contract" as ThreatCategory,
        source: "mev-inspect",
        title: `MEV Extractor/Sandwich Bot`,
        incident: `Known high-slippage extraction pattern`,
      })) as ExternalThreat[];
  } catch (err) {
    console.error("[sync] MEV list fetch failed:", err);
    return [];
  }
}

/**
 * Categorize Etherscan scam entry based on name/description.
 */
function categorizeScam(entry: any): ThreatCategory {
  const text = `${entry.name} ${entry.description}`.toLowerCase();
  if (text.includes("drain") || text.includes("stealer")) return "drainer";
  if (text.includes("honeypot") || text.includes("trap")) return "decoy-tripwire";
  if (text.includes("phish") || text.includes("fake")) return "phishing";
  if (text.includes("rug")) return "drainer";
  return "malicious-contract";
}

/**
 * Main sync function: fetch all sources and bulk-insert into threat_intel.
 * Idempotent: safe to run multiple times.
 */
export async function syncExternalThreats(
  intel: ThreatIntelPostgres
): Promise<{ synced: number; errors: number }> {
  console.log("[sync] Starting external threat intelligence sync...");
  const startTime = Date.now();
  let synced = 0;
  let errors = 0;

  try {
    // Fetch from all sources in parallel
    const [etherscan, honeypots, mevBots] = await Promise.all([
      fetchEtherscanScams(),
      fetchHoneypots(),
      fetchMEVExtractors(),
    ]);

    const allThreats = [...etherscan, ...honeypots, ...mevBots];
    console.log(
      `[sync] Fetched ${allThreats.length} threats from ${new Set(allThreats.map((t) => t.source)).size} sources`
    );

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
          // metadata stored via JSON in DB
        });
        synced++;
      } catch (err) {
        console.error(`[sync] Failed to insert ${address}:`, err);
        errors++;
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(
      `[sync] ✅ Synced ${synced} threats (${errors} errors) in ${elapsed}ms`
    );

    return { synced, errors };
  } catch (err) {
    console.error("[sync] Fatal error during sync:", err);
    return { synced, errors };
  }
}

/**
 * Initialize sync service: run once on startup, then periodically.
 * Can also be triggered manually via CLI.
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
