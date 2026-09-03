/**
 * External Threat Intelligence Sync (Enterprise + Community Hybrid)
 * 
 * THREAT SOURCES (loaded in parallel, deduplicated by address):
 * 
 * PRIMARY SOURCES:
 * 1. Blockaid.io Threat Intelligence (PAID) - 10,000+ real-time drainers, scams, exploits
 *    → Requires: BLOCKAID_API_KEY environment variable
 *    → Updated: Hourly from network monitoring
 *    → Chains: Ethereum, Polygon, Arbitrum, Optimism, Base, Blast, more
 * 
 * FALLBACK SOURCES (free, community-driven):
 * 2. Scam Sniffer (GitHub) - Phishing contracts, scam addresses (1,000+)
 *    → Source: https://github.com/scamsniffer/scam-database (public blacklist)
 *    → Updated: Daily with 7-day delay
 *    → Used by: Phantom, Rabby, Binance, OpenSea
 * 
 * 3. Rugdoc - Rug pull tokens and rug pull incidents
 * 4. SlowMist - Security alerts and high-risk contracts
 * 5. Curated seed - Verified historical exploits (21 addresses, always available)
 * 6. Community reports - User-submitted threats via POST /v1/report
 * 
 * BEHAVIOR:
 * ✅ Without BLOCKAID_API_KEY: Uses Scam Sniffer + Rugdoc + SlowMist + 21 curated (still viable)
 * ✅ With BLOCKAID_API_KEY: Blockaid + all other sources (enterprise-scale)
 * ✅ Non-blocking: If any source fails, sync continues with others
 * ✅ Runs on startup + every 6 hours
 * ✅ Deduplicates by address, keeps first source in case of conflicts
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
 * Fetch phishing/scam addresses from Scam Sniffer GitHub (free community source).
 * Pulls from their open-source blacklist: https://github.com/scamsniffer/scam-database
 * 
 * DATA PROVIDED:
 * - Phishing domains blacklist (updated every 24 hours with 7-day delay)
 * - Phishing addresses blacklist (scammer wallets and contracts)
 * - Used by Phantom, Rabby, Binance, OpenSea
 * 
 * Note: Uses GitHub-hosted JSON for reliability (API can have rate limits).
 */
async function fetchScamSnifferThreats(): Promise<ExternalThreat[]> {
  try {
    console.log("[sync] Fetching Scam Sniffer database from GitHub...");
    
    // Use GitHub raw content for reliability (no rate limiting like API)
    // Scam Sniffer database: https://github.com/scamsniffer/scam-database/blob/main/blacklist/address.json
    const res = await fetch(
      "https://raw.githubusercontent.com/scamsniffer/scam-database/main/blacklist/address.json",
      { headers: { "User-Agent": "GENESIS-Gate/1.0" } }
    );

    if (!res.ok) {
      console.log(`[sync] Scam Sniffer (GitHub) unavailable (${res.status}) (non-fatal)`);
      return [];
    }

    // Scam Sniffer returns array of hex addresses
    const addresses = (await res.json()) as any;
    if (!Array.isArray(addresses)) return [];

    const threats = addresses
      .slice(0, 1000) // Limit to prevent overload
      .map((addr: string) => ({
        address: (addr || "").toString().toLowerCase().trim(),
        category: "phishing" as ThreatCategory,
        source: "scam-sniffer",
        title: "Scam Sniffer: Phishing/Scam Address",
      }))
      .filter((t: ExternalThreat) => t.address && /^0x[a-f0-9]{40}$/.test(t.address)) as ExternalThreat[];

    console.log(`[sync] ✅ Scam Sniffer loaded ${threats.length} phishing addresses`);
    return threats;
  } catch (err) {
    console.log(`[sync] Scam Sniffer fetch error: ${err instanceof Error ? err.message : String(err)} (non-fatal)`);
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
      console.log(`[sync] Rugdoc unavailable (${res.status}) (non-fatal)`);
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
    console.log(`[sync] Rugdoc fetch error: ${err instanceof Error ? err.message : String(err)}`);
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
      console.log(`[sync] SlowMist unavailable (${res.status}) (non-fatal)`);
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
    console.log(`[sync] SlowMist fetch error: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

/**
 * Fetch malicious addresses from Blockaid Threat Intelligence (PAID API - Enterprise).
 * Requires BLOCKAID_API_KEY environment variable.
 * 
 * DATA PULLED FROM BLOCKAID:
 * - Real-time malicious addresses (10,000+ active threats)
 * - Wallet drainers (active daily exploits)
 * - Phishing contracts & scam tokens
 * - MEV extractors & sandwich attackers
 * - Rug pull contracts
 * - Honeypots (tokens that lock funds)
 * - Governance takeover contracts
 * - Cross-chain bridges that failed
 * 
 * Updated hourly from their monitoring network.
 */
async function fetchBlockaidThreats(): Promise<ExternalThreat[]> {
  const apiKey = process.env.BLOCKAID_API_KEY;
  
  if (!apiKey) {
    console.log("[sync] Blockaid API key not set (BLOCKAID_API_KEY env var). Skipping.");
    return [];
  }

  try {
    console.log("[sync] Fetching Blockaid threat intelligence (real-time drainers, scams, exploits)...");
    
    // Blockaid Threat Intelligence API endpoint
    // Returns real-time malicious addresses with risk scoring
    const res = await fetch("https://api.blockaid.io/v1/threat-intelligence/addresses", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "User-Agent": "GENESIS-Gate/1.0",
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.log(`[sync] Blockaid returned ${res.status}: ${res.statusText} (non-fatal)`);
      if (res.status === 401) {
        console.error("[sync] ⚠️  Blockaid API key invalid. Visit https://blockaid.io/threat-intelligence");
      }
      return [];
    }

    const data = (await res.json()) as any;
    
    // Blockaid returns list of threat objects with: address, risk_level, threat_type, label, chain, last_updated
    const threatList = data?.addresses || data?.threats || data?.data || [];
    if (!Array.isArray(threatList)) {
      console.log("[sync] Blockaid: unexpected response structure, expected array of threats");
      return [];
    }

    const threats = threatList
      .slice(0, 5000) // Limit to prevent overload (Blockaid can return 10,000+)
      .map((threat: any) => {
        const addr = (threat.address || threat.contract || threat.wallet || "").toString().toLowerCase().trim();
        
        // Blockaid threat types: drainer, phishing, scam, honeypot, exploit, mev_bot, bridge_exploit, governance_attack
        const blockaidType = (threat.threat_type || threat.type || "").toLowerCase();
        const category = mapBlockaidThreatType(blockaidType, threat.risk_level);
        
        return {
          address: addr,
          category: category as ThreatCategory,
          source: "blockaid",
          title: threat.label || threat.name || `${blockaidType} - Risk: ${threat.risk_level || "unknown"}`,
        };
      })
      .filter((t: ExternalThreat) => t.address && /^0x[a-f0-9]{40}$/.test(t.address)) as ExternalThreat[];

    console.log(`[sync] ✅ Blockaid loaded ${threats.length} real-time threats (drainers, scams, exploits)`);
    return threats;
  } catch (err) {
    console.error(`[sync] Blockaid fetch error: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

/**
 * Map Blockaid threat types to GENESIS categories.
 * Blockaid types: drainer, phishing, scam, honeypot, exploit, mev_bot, bridge_exploit, governance_attack
 */
function mapBlockaidThreatType(blockaidType: string, riskLevel: string): ThreatCategory {
  if (blockaidType === "drainer" || blockaidType === "mev_bot" || blockaidType === "bridge_exploit") {
    return "drainer";
  }
  if (blockaidType === "phishing" || blockaidType === "scam") {
    return "phishing";
  }
  if (blockaidType === "honeypot" || blockaidType === "governance_attack") {
    return "decoy-tripwire";
  }
  if (blockaidType === "exploit") {
    return (riskLevel === "critical" || riskLevel === "high") ? "drainer" : "malicious-contract";
  }
  return "malicious-contract"; // default fallback
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
    // Load all threat sources in parallel (Blockaid first if available)
    const [blockaid, curated, scamSniffer, rugdoc, slowmist] = await Promise.all([
      fetchBlockaidThreats(),
      loadCuratedThreats(),
      fetchScamSnifferThreats(),
      fetchRugdocThreats(),
      fetchSlowMistThreats(),
    ]);

    const allThreats = [...blockaid, ...curated, ...scamSniffer, ...rugdoc, ...slowmist];
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
