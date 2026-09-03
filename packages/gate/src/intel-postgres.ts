import { Pool } from "pg";
import type { Address, ReportRequest, ThreatCategory, ThreatEntry } from "@genesis/shared";
import { DEFAULT_QUORUM } from "@genesis/shared";

/**
 * PostgreSQL-backed threat intel with Sybil-resistant quorum.
 * Scalable multi-instance deployment via Neon DB.
 * Implements same API as in-memory ThreatIntel for seamless swapping.
 */
export class ThreatIntelPostgres {
  pool: Pool; // Made public for ContributorsService access
  private initialized = false;

  constructor(
    databaseUrl: string,
    private readonly quorum: number = DEFAULT_QUORUM
  ) {
    this.pool = new Pool({ connectionString: databaseUrl, max: 10 });
  }

  /** Ensure schema exists; idempotent. Runs full migration from packages/gate/data/migrations/001-threat-intel.sql. */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS threat_intel (
          address CHAR(42) PRIMARY KEY,
          category TEXT NOT NULL CHECK (category IN ('drainer', 'malicious-contract', 'decoy-tripwire', 'sanctioned', 'phishing')),
          reporters TEXT[] NOT NULL DEFAULT '{}',
          trusted BOOLEAN DEFAULT false,
          first_seen TIMESTAMPTZ DEFAULT NOW(),
          last_seen TIMESTAMPTZ DEFAULT NOW(),
          metadata JSONB DEFAULT '{}'
        );
        CREATE INDEX IF NOT EXISTS idx_threat_intel_category ON threat_intel(category);
        CREATE INDEX IF NOT EXISTS idx_threat_intel_trusted ON threat_intel(trusted);
        CREATE INDEX IF NOT EXISTS idx_threat_intel_last_seen ON threat_intel(last_seen DESC);
      `);
      this.initialized = true;
      console.log("[threat-intel-postgres] Schema initialized (idempotent)");
    } catch (err) {
      console.error("[threat-intel-postgres] Initialize failed:", err);
      throw err;
    }
  }

  /** Load curated/known-bad entries (treated as immediately confirmed). */
  async seed(entries: Array<{ address: Address; category: ThreatCategory }>): Promise<void> {
    await this.initialize();
    for (const e of entries) {
      const key = e.address.toLowerCase() as Address;
      try {
        await this.pool.query(
          `INSERT INTO threat_intel (address, category, trusted, metadata)
           VALUES ($1, $2, true, jsonb_build_object('seeded', true))
           ON CONFLICT (address) DO UPDATE
           SET category = EXCLUDED.category, trusted = true, last_seen = NOW()`,
          [key, e.category]
        );
      } catch (err) {
        console.error(`[threat-intel-postgres] Seed ${key} failed:`, err);
      }
    }
  }

  /** Record a community report; counts distinct reporters toward quorum. */
  async report(req: ReportRequest): Promise<ThreatEntry> {
    await this.initialize();
    const key = req.address.toLowerCase() as Address;
    try {
      const result = await this.pool.query(
        `INSERT INTO threat_intel (address, category, reporters)
         VALUES ($1, $2, ARRAY[$3])
         ON CONFLICT (address) DO UPDATE
         SET reporters = ARRAY(SELECT DISTINCT * FROM UNNEST(threat_intel.reporters || ARRAY[$3])),
             category = COALESCE(EXCLUDED.category, threat_intel.category),
             last_seen = NOW()
         RETURNING address, category, reporters, trusted, first_seen, last_seen, metadata`,
        [key, req.category, req.reporterId]
      );
      return this.toEntry(result.rows[0]);
    } catch (err) {
      console.error(`[threat-intel-postgres] Report ${key} failed:`, err);
      throw err;
    }
  }

  /** Return the confirmed/unconfirmed threat entry for an address, if any. */
  async lookup(address: Address): Promise<ThreatEntry | undefined> {
    await this.initialize();
    const key = address.toLowerCase() as Address;
    try {
      const result = await this.pool.query(
        `SELECT address, category, reporters, trusted, first_seen, last_seen, metadata
         FROM threat_intel WHERE address = $1`,
        [key]
      );
      return result.rows.length > 0 ? this.toEntry(result.rows[0]) : undefined;
    } catch (err) {
      console.error(`[threat-intel-postgres] Lookup ${key} failed:`, err);
      return undefined;
    }
  }

  /**
   * Get recent threats for news/feed display.
   * Ordered by last_seen (most recent first), limited to specified count.
   * Only returns threats with activity in the last N hours (default 7 days).
   */
  async getRecentThreats(
    limit: number = 50,
    hoursBack: number = 24 * 7
  ): Promise<
    Array<{
      address: Address;
      category: string;
      reports: number;
      reporters: string[];
      firstSeen: number;
      lastSeen: number;
      trusted: boolean;
      metadata?: Record<string, any>;
    }>
  > {
    await this.initialize();
    try {
      const result = await this.pool.query(
        `SELECT 
          address, 
          category, 
          reporters, 
          trusted, 
          first_seen, 
          last_seen, 
          metadata
         FROM threat_intel 
         WHERE last_seen > NOW() - INTERVAL '1 hour' * $1
         ORDER BY last_seen DESC, array_length(reporters, 1) DESC
         LIMIT $2`,
        [hoursBack, Math.min(limit, 1000)]
      );

      return result.rows.map((row) => {
        const distinctReporters = [...new Set(row.reporters)] as string[];
        return {
          address: row.address as Address,
          category: row.category as string,
          reports: row.trusted ? Math.max(this.quorum, distinctReporters.length) : distinctReporters.length,
          reporters: distinctReporters,
          firstSeen: row.first_seen.getTime(),
          lastSeen: row.last_seen.getTime(),
          trusted: row.trusted as boolean,
          metadata: row.metadata,
        };
      });
    } catch (err) {
      console.error(`[threat-intel-postgres] getRecentThreats failed:`, err);
      return [];
    }
  }

  /** Sync version for tests (not recommended for production). */
  lookupSync(address: Address): ThreatEntry | undefined {
    throw new Error("PostgreSQL adapter is async-only. Use await lookup(address)");
  }

  /** Close the connection pool. */
  async close(): Promise<void> {
    await this.pool.end();
  }

  private toEntry(row: any): ThreatEntry {
    const reporters = Array.isArray(row.reporters) ? row.reporters : [];
    const distinctReporters = [...new Set(reporters)]; // Sybil resistance
    const reports = row.trusted ? Math.max(this.quorum, distinctReporters.length) : distinctReporters.length;
    return {
      address: row.address as Address,
      category: row.category,
      reports,
      quorumReached: row.trusted || distinctReporters.length >= this.quorum,
      firstSeen: row.first_seen.getTime(),
      lastSeen: row.last_seen.getTime(),
    };
  }
}
