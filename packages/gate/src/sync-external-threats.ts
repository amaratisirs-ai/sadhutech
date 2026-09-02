/**
 * External Threat Intelligence Sync
 * Pulls threat data from curated seed + free community sources.
 * Sources: Scam Sniffer, Rugdoc, SlowMist, Certik, plus local seed data.
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
 * Fetch phishing/scam database from Scam Sniffer (free community source).
 * Returns known phishing contract addresses.
 */
async function fetchScamSnifferThreats(): Promise<ExternalThreat[]> {
  try {
    console.log("[sync] Fetching Scam Sniffer database...");
    // Scam Sniffer provides free API for phishing scams
    const res = await fetch("https://api.scamsniffer.io/api/v2/scams", {
      headers: { "User-Agent": "GENESIS-Gate/1.0" },
    });

    if (!res.ok) {
      console.log("[sync] Scam Sniffer unavailable (non-fatal)");
      return [];
    }

    const data = (await res.json()) as any;
    if (!Array.isArray(data?.data)) return [];

    return data.data
      .slice(0, 500) // Limit to prevent overload
      .map((scam: any) => ({
        address: scam.address?.toLowerCase() || scam.contract?.toLowerCase(),
        category: "phishing" as ThreatCategory,
        source: "scam-sniffer",
        title: scam.name,
      }))
      .filter((t: ExternalThreat) => t.address && /^0x[a-f0-9]{40}$/.test(t.address)) as ExternalThreat[];
  } catch (err) {
    console.log("[sync] Scam Sniffer fetch failed (non-fatal)");
    return [];
  }
}

/**
 * Fetch rug pull database from Rugdoc (free community source).
 * Returns known rug pull token contracts.
 */
async function fetchRugdocThreats(): Promise<ExternalThreat[]> {
  try {
    console.log("[sync] Fetching Rugdoc rug pull database...");
    // Rugdoc maintains public list of confirmed rug pulls
    const res = await fetch("https://api.rugdoc.io/all", {
      headers: { "User-Agent": "GENESIS-Gate/1.0" },
    });

    if (!res.ok) {
      console.log("[sync] Rugdoc unavailable (non-fatal)");
      return [];
    }

    const data = (await res.json()) as any;
    if (!Array.isArray(data?.rugs)) return [];

    return data.rugs
      .slice(0, 300)
      .map((rug: any) => ({
        address: rug.address?.toLowerCase() || rug.token?.toLowerCase(),
        category: "drainer" as ThreatCategory,
        source: "rugdoc",
        title: `Rug Pull: ${rug.name}`,
      }))
      .filter((t: ExternalThreat) => t.address && /^0x[a-f0-9]{40}$/.test(t.address)) as ExternalThreat[];
  } catch (err) {
    console.log("[sync] Rugdoc fetch failed (non-fatal)");
    return [];
  }
}

/**
 * Fetch SlowMist security alerts (free community intelligence).
 * Returns flagged contracts and suspicious addresses.
 */
async function fetchSlowMistThreats(): Promise<ExternalThreat[]> {
  try {
    console.log("[sync] Fetching SlowMist security alerts...");
    // SlowMist provides public alerts API
    const res = await fetch("https://api.slowmist.com/service/risks", {
      headers: { "User-Agent": "GENESIS-Gate/1.0" },
    });

    if (!res.ok) {
      console.log("[sync] SlowMist unavailable (non-fatal)");
      return [];
    }

    const data = (await res.json()) as any;
    if (!Array.isArray(data?.risks)) return [];

    return data.risks
      .slice(0, 200)
      .map((risk: any) => ({
        address: risk.address?.toLowerCase(),
        category: (risk.type as ThreatCategory) || ("malicious-contract" as ThreatCategory),
        source: "slowmist",
        title: risk.description,
      }))
      .filter((t: ExternalThreat) => t.address && /^0x[a-f0-9]{40}$/.test(t.address)) as ExternalThreat[];
  } catch (err) {
    console.log("[sync] SlowMist fetch failed (non-fatal)");
    return [];
  }
}

/**
 * Main sync function: load curated data + fetch from community sources.
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
    // Load all threat sources in parallel
    const [curated, scamSniffer, rugdoc, slowmist] = await Promise.all([
      loadCuratedThreats(),
      fetchScamSnifferThreats(),
      fetchRugdocThreats(),
      fetchSlowMistThreats(),
    ]);

    const allThreats = [...curated, ...scamSniffer, ...rugdoc, ...slowmist];
    const sources = new Set(allThreats.map((t) => t.source));
    console.log(`[sync] Loaded ${allThreats.length} total threats from ${sources.size} sources`);

    // Deduplicate by address (keep first occurrence)
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
    console.log(`[sync] ✅ Synced ${synced} threats (${errors} errors) from ${sources.size} sources in ${elapsed}ms`);

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
