import { Pool } from "pg";

/**
 * 360° usage telemetry for the admin dashboard: logins, page views, transaction
 * checks (verdict + time), client-reported errors/"stuck" flows, plus rollups
 * from the existing Pro tables (credits held, credits purchased). Postgres-only;
 * a no-op in in-memory dev mode. Never throws — telemetry must not break a user flow.
 */
export type AnalyticsEventType = "page_view" | "login" | "analyze" | "error" | "stuck";

export interface LogEventInput {
  wallet?: string | null;
  page?: string | null;
  chainId?: number | null;
  verdict?: string | null;
  meta?: unknown;
}

export interface AdminAnalyticsSummary {
  hours: number;
  loginsByHour: { bucket: string; count: string }[];
  loginsByDay: { bucket: string; count: string }[];
  pageViews: { page: string; count: string }[];
  transactionsByHour: { bucket: string; count: string }[];
  transactionsByVerdict: { verdict: string | null; count: string }[];
  errorCount: number;
  stuckCount: number;
  uniqueWallets: number;
  pro: { walletsWithCredits: number; totalCredits: number; avgCredits: number };
  creditsBought: { purchases: number; totalUsdc: number };
  recentEvents: {
    event_type: string;
    wallet: string | null;
    page: string | null;
    chain_id: number | null;
    verdict: string | null;
    meta: unknown;
    created_at: string;
  }[];
}

export class AnalyticsService {
  constructor(private pool: Pool) {}

  async initialize(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id SERIAL PRIMARY KEY,
        event_type TEXT NOT NULL,
        wallet TEXT,
        page TEXT,
        chain_id INTEGER,
        verdict TEXT,
        meta JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS analytics_events_type_created_idx ON analytics_events (event_type, created_at);
      CREATE INDEX IF NOT EXISTS analytics_events_wallet_idx ON analytics_events (wallet);
    `);
  }

  /** Records one dashboard-relevant event. Never throws. */
  async logEvent(eventType: AnalyticsEventType, input: LogEventInput = {}): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO analytics_events (event_type, wallet, page, chain_id, verdict, meta) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          eventType,
          input.wallet ? input.wallet.toLowerCase() : null,
          input.page ?? null,
          input.chainId ?? null,
          input.verdict ?? null,
          JSON.stringify(input.meta ?? {}),
        ]
      );
    } catch (err) {
      console.error("[analytics] Failed to record event:", err instanceof Error ? err.message : String(err));
    }
  }

  /** Aggregated view for the admin dashboard, covering the last `hours`. */
  async getSummary(hours = 24 * 7): Promise<AdminAnalyticsSummary> {
    const [loginsByHour, loginsByDay, pageViews, txByHour, txByVerdict, errors, stuck, uniqueWallets, proStats, creditsBought, recentEvents] =
      await Promise.all([
        this.pool.query(
          `SELECT date_trunc('hour', created_at) AS bucket, COUNT(*) AS count
           FROM analytics_events WHERE event_type = 'login' AND created_at > NOW() - INTERVAL '1 hour' * $1::int
           GROUP BY bucket ORDER BY bucket ASC`,
          [hours]
        ),
        this.pool.query(
          `SELECT date_trunc('day', created_at) AS bucket, COUNT(*) AS count
           FROM analytics_events WHERE event_type = 'login' AND created_at > NOW() - INTERVAL '30 days'
           GROUP BY bucket ORDER BY bucket ASC`
        ),
        this.pool.query(
          `SELECT page, COUNT(*) AS count FROM analytics_events
           WHERE event_type = 'page_view' AND page IS NOT NULL AND created_at > NOW() - INTERVAL '1 hour' * $1::int
           GROUP BY page ORDER BY count DESC LIMIT 25`,
          [hours]
        ),
        this.pool.query(
          `SELECT date_trunc('hour', created_at) AS bucket, COUNT(*) AS count
           FROM analytics_events WHERE event_type = 'analyze' AND created_at > NOW() - INTERVAL '1 hour' * $1::int
           GROUP BY bucket ORDER BY bucket ASC`,
          [hours]
        ),
        this.pool.query(
          `SELECT verdict, COUNT(*) AS count FROM analytics_events
           WHERE event_type = 'analyze' AND created_at > NOW() - INTERVAL '1 hour' * $1::int
           GROUP BY verdict ORDER BY count DESC`,
          [hours]
        ),
        this.pool.query(
          `SELECT COUNT(*) AS count FROM analytics_events WHERE event_type = 'error' AND created_at > NOW() - INTERVAL '1 hour' * $1::int`,
          [hours]
        ),
        this.pool.query(
          `SELECT COUNT(*) AS count FROM analytics_events WHERE event_type = 'stuck' AND created_at > NOW() - INTERVAL '1 hour' * $1::int`,
          [hours]
        ),
        this.pool.query(
          `SELECT COUNT(DISTINCT wallet) AS count FROM analytics_events WHERE wallet IS NOT NULL AND created_at > NOW() - INTERVAL '1 hour' * $1::int`,
          [hours]
        ),
        this.pool.query(
          `SELECT COUNT(*) AS wallets_with_credits, COALESCE(SUM(credits), 0) AS total_credits, COALESCE(AVG(credits), 0) AS avg_credits
           FROM pro_credits WHERE credits > 0`
        ),
        this.pool.query(
          `SELECT COUNT(*) AS purchases, COALESCE(SUM(amount::numeric), 0) / 1000000.0 AS total_usdc
           FROM pro_payments WHERE created_at > NOW() - INTERVAL '1 hour' * $1::int`,
          [hours]
        ),
        this.pool.query(
          `SELECT event_type, wallet, page, chain_id, verdict, meta, created_at FROM analytics_events
           ORDER BY created_at DESC LIMIT 50`
        ),
      ]);

    return {
      hours,
      loginsByHour: loginsByHour.rows,
      loginsByDay: loginsByDay.rows,
      pageViews: pageViews.rows,
      transactionsByHour: txByHour.rows,
      transactionsByVerdict: txByVerdict.rows,
      errorCount: Number(errors.rows[0]?.count ?? 0),
      stuckCount: Number(stuck.rows[0]?.count ?? 0),
      uniqueWallets: Number(uniqueWallets.rows[0]?.count ?? 0),
      pro: {
        walletsWithCredits: Number(proStats.rows[0]?.wallets_with_credits ?? 0),
        totalCredits: Number(proStats.rows[0]?.total_credits ?? 0),
        avgCredits: Number(proStats.rows[0]?.avg_credits ?? 0),
      },
      creditsBought: {
        purchases: Number(creditsBought.rows[0]?.purchases ?? 0),
        totalUsdc: Number(creditsBought.rows[0]?.total_usdc ?? 0),
      },
      recentEvents: recentEvents.rows,
    };
  }
}

export function createAnalyticsService(pool: Pool): AnalyticsService {
  return new AnalyticsService(pool);
}
