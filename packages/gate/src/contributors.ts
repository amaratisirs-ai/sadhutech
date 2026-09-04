/**
 * Community Contributors Service
 * Tracks reporter reputation, badges, and leaderboard stats.
 * Gamifies threat reporting to encourage community participation.
 */

import type { Pool } from "pg";
import type { Address, Contributor, LeaderboardEntry } from "@genesis/shared";

const BADGE_REQUIREMENTS = {
  scout: 1,        // First report
  guardian: 10,    // 10 reports
  sentinel: 50,    // 50 reports
  champion: 100,   // 100 reports
  verified: null,  // Manually awarded by admin
};

const BADGE_EMOJI = {
  scout: "🔍",
  guardian: "🛡️",
  sentinel: "⚔️",
  champion: "👑",
  verified: "✓",
};

/**
 * Manages contributor reputation and leaderboard.
 */
export class ContributorsService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /** Create contributor tables/indexes if missing. Idempotent; requires threat_intel to exist first. */
  async initialize(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS contributors (
        reporter_id TEXT PRIMARY KEY,
        display_name TEXT DEFAULT NULL,
        avatar TEXT DEFAULT '🛡️',
        total_reports INT NOT NULL DEFAULT 0,
        reputation_score INT DEFAULT 50,
        badges TEXT[] DEFAULT '{}',
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
        email TEXT DEFAULT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_report_at TIMESTAMPTZ DEFAULT NULL,
        metadata JSONB DEFAULT '{}'
      );
      CREATE TABLE IF NOT EXISTS threat_reports_ledger (
        id BIGSERIAL PRIMARY KEY,
        address CHAR(42) NOT NULL,
        reporter_id TEXT NOT NULL REFERENCES contributors(reporter_id) ON DELETE CASCADE,
        category TEXT NOT NULL CHECK (category IN ('drainer', 'malicious-contract', 'decoy-tripwire', 'sanctioned', 'phishing')),
        description TEXT DEFAULT NULL,
        evidence_url TEXT DEFAULT NULL,
        victim_count INT DEFAULT NULL,
        impacted_chains TEXT[] DEFAULT '{}',
        reporter_email TEXT DEFAULT NULL,
        self_assessed_severity TEXT DEFAULT 'medium' CHECK (self_assessed_severity IN ('low', 'medium', 'high', 'critical')),
        community_upvotes INT DEFAULT 0,
        community_downvotes INT DEFAULT 0,
        admin_verified BOOLEAN DEFAULT NULL,
        reported_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_contributors_reputation ON contributors(reputation_score DESC, total_reports DESC);
      CREATE INDEX IF NOT EXISTS idx_contributors_last_report ON contributors(last_report_at DESC);
      CREATE INDEX IF NOT EXISTS idx_threat_reports_ledger_address ON threat_reports_ledger(address);
      CREATE INDEX IF NOT EXISTS idx_threat_reports_ledger_reporter ON threat_reports_ledger(reporter_id);
    `);
  }

  /**
   * Record a new threat report and update contributor stats.
   */
  async recordReport(
    reporterId: string,
    reporterName: string | undefined,
    address: Address,
    category: string,
    description: string | undefined,
    evidenceUrl: string | undefined,
    victimCount: number | undefined,
    impactedChains: string[] | undefined,
    reporterEmail: string | undefined
  ): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      // Create or update contributor profile
      const upsertQuery = `
        INSERT INTO contributors (
          reporter_id, display_name, avatar, total_reports, last_report_at, status
        )
        VALUES ($1, $2, '🛡️', 1, NOW(), 'active')
        ON CONFLICT (reporter_id) DO UPDATE SET
          total_reports = total_reports + 1,
          last_report_at = NOW(),
          display_name = COALESCE($2, contributors.display_name)
        RETURNING *;
      `;

      const contributorResult = await client.query(upsertQuery, [
        reporterId,
        reporterName,
      ]);

      const contributor = contributorResult.rows[0];

      // Insert into threat_reports_ledger
      const ledgerQuery = `
        INSERT INTO threat_reports_ledger (
          address, reporter_id, category, description, evidence_url,
          victim_count, impacted_chains, reporter_email
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `;

      await client.query(ledgerQuery, [
        address,
        reporterId,
        category,
        description || null,
        evidenceUrl || null,
        victimCount || null,
        impactedChains?.length ? impactedChains : null,
        reporterEmail || null,
      ]);

      // Calculate and update badges based on total_reports
      const newBadges = this.calculateBadges(contributor.total_reports);
      if (newBadges.length > 0) {
        const badgeQuery = `
          UPDATE contributors
          SET badges = array_distinct(array_cat(badges, $2))
          WHERE reporter_id = $1;
        `;

        await client.query(badgeQuery, [reporterId, newBadges]);
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get top contributors leaderboard.
   */
  async getLeaderboard(limit: number = 50, offset: number = 0): Promise<LeaderboardEntry[]> {
    const query = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY reputation_score DESC, total_reports DESC) as rank,
        reporter_id as "reporterId",
        display_name as "displayName",
        avatar,
        total_reports as "totalReports",
        reputation_score as "reputationScore",
        badges,
        last_report_at as "lastReportAt",
        created_at as "createdAt",
        status
      FROM contributors
      WHERE status = 'active'
      ORDER BY reputation_score DESC, total_reports DESC
      LIMIT $1 OFFSET $2;
    `;

    const result = await this.pool.query(query, [limit, offset]);
    return result.rows;
  }

  /**
   * Get total count of active contributors.
   */
  async getContributorCount(): Promise<number> {
    const result = await this.pool.query(
      "SELECT COUNT(*) as count FROM contributors WHERE status = 'active';"
    );
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Get a specific contributor's profile.
   */
  async getContributor(reporterId: string): Promise<Contributor | null> {
    const query = `
      SELECT 
        reporter_id as "reporterId",
        display_name as "displayName",
        avatar,
        total_reports as "totalReports",
        reputation_score as "reputationScore",
        badges,
        status,
        last_report_at as "lastReportAt",
        created_at as "createdAt"
      FROM contributors
      WHERE reporter_id = $1;
    `;

    const result = await this.pool.query(query, [reporterId]);
    return result.rows[0] || null;
  }

  /**
   * Get contributor's recent reports.
   */
  async getContributorReports(reporterId: string, limit: number = 20) {
    const query = `
      SELECT 
        id,
        address,
        category,
        description,
        evidence_url as "evidenceUrl",
        victim_count as "victimCount",
        impacted_chains as "impactedChains",
        self_assessed_severity as "selfAssessedSeverity",
        community_upvotes as "communityUpvotes",
        community_downvotes as "communityDownvotes",
        admin_verified as "adminVerified",
        reported_at as "reportedAt"
      FROM threat_reports_ledger
      WHERE reporter_id = $1
      ORDER BY reported_at DESC
      LIMIT $2;
    `;

    const result = await this.pool.query(query, [reporterId, limit]);
    return result.rows;
  }

  /**
   * Get threat reports with contributor info (for /v1/report response).
   */
  async getThreatsWithContributors(addresses: Address[]): Promise<any[]> {
    if (addresses.length === 0) return [];

    const placeholders = addresses.map((_, i) => `$${i + 1}`).join(",");
    const query = `
      SELECT 
        t.address,
        t.category,
        t.reporters,
        t.trusted,
        t.first_seen as "firstSeen",
        t.last_seen as "lastSeen",
        t.metadata,
        COUNT(DISTINCT r.reporter_id) as "totalReports",
        array_agg(DISTINCT c.display_name) FILTER (WHERE c.display_name IS NOT NULL) as "topReporters"
      FROM threat_intel t
      LEFT JOIN threat_reports_ledger r ON t.address = r.address
      LEFT JOIN contributors c ON r.reporter_id = c.reporter_id
      WHERE t.address IN (${placeholders})
      GROUP BY t.address, t.category, t.reporters, t.trusted, t.first_seen, t.last_seen, t.metadata;
    `;

    const result = await this.pool.query(query, addresses);
    return result.rows;
  }

  /**
   * Award or update badge for a contributor (admin only).
   */
  async awardBadge(reporterId: string, badge: string): Promise<void> {
    const query = `
      UPDATE contributors
      SET badges = array_distinct(array_append(badges, $2))
      WHERE reporter_id = $1;
    `;

    await this.pool.query(query, [reporterId, badge]);
  }

  /**
   * Update contributor reputation score (admin or system).
   */
  async updateReputation(reporterId: string, score: number): Promise<void> {
    const clamped = Math.max(0, Math.min(100, score));
    const query = `
      UPDATE contributors
      SET reputation_score = $2
      WHERE reporter_id = $1;
    `;

    await this.pool.query(query, [reporterId, clamped]);
  }

  /**
   * Ban a contributor (remove from leaderboard, mark as spammer).
   */
  async banContributor(reporterId: string, reason: string): Promise<void> {
    const query = `
      UPDATE contributors
      SET status = 'banned', metadata = jsonb_set(metadata, '{ban_reason}', to_jsonb($2))
      WHERE reporter_id = $1;
    `;

    await this.pool.query(query, [reporterId, reason]);
  }

  /**
   * Calculate badges based on report count.
   */
  private calculateBadges(totalReports: number): string[] {
    const badges: string[] = [];

    for (const [badge, requirement] of Object.entries(BADGE_REQUIREMENTS)) {
      if (requirement !== null && totalReports >= requirement && badge !== "verified") {
        badges.push(badge);
      }
    }

    return badges;
  }

  /**
   * Get contributor stats summary.
   */
  async getStats() {
    const query = `
      SELECT 
        COUNT(*) as "totalContributors",
        SUM(total_reports) as "totalReports",
        AVG(reputation_score) as "avgReputation",
        MAX(total_reports) as "topReportCount"
      FROM contributors
      WHERE status = 'active';
    `;

    const result = await this.pool.query(query);
    return result.rows[0];
  }
}

/**
 * Create a singleton instance (used by server).
 */
export function createContributorsService(pool: Pool): ContributorsService {
  return new ContributorsService(pool);
}
