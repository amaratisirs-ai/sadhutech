import { Pool } from "pg";

/**
 * Audit trail for money-adjacent and security-relevant events that previously
 * had no durable record: credit consumption (only current balance was visible,
 * no history), GoPlus/ChainAbuse flags that influenced a verdict, and silent
 * failures of those external integrations (fail-open by design elsewhere, but
 * that made outages invisible). Postgres-only; a no-op in in-memory dev mode.
 */
export class AuditLogService {
  constructor(private pool: Pool) {}

  async initialize(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS credit_ledger (
        id SERIAL PRIMARY KEY,
        address TEXT NOT NULL,
        amount INTEGER NOT NULL,
        verdict TEXT,
        flagged BOOLEAN,
        source TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS security_events (
        id SERIAL PRIMARY KEY,
        event_type TEXT NOT NULL,
        subject TEXT,
        severity TEXT,
        details JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS integration_failures (
        id SERIAL PRIMARY KEY,
        integration TEXT NOT NULL,
        error TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
  }

  /** Records a single deep-check credit spend. Never throws — logging must not break a paid check. */
  async logCreditConsumption(
    address: string,
    amount: number,
    verdict: string,
    flagged: boolean,
    source?: string
  ): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO credit_ledger (address, amount, verdict, flagged, source) VALUES ($1, $2, $3, $4, $5)`,
        [address.toLowerCase(), amount, verdict, flagged, source ?? null]
      );
    } catch (err) {
      console.error("[audit-log] Failed to record credit consumption:", err instanceof Error ? err.message : String(err));
    }
  }

  /** Records a GoPlus/ChainAbuse flag that fed into a finding or verdict override. */
  async logSecurityEvent(eventType: string, subject: string | undefined, severity: string, details: unknown): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO security_events (event_type, subject, severity, details) VALUES ($1, $2, $3, $4)`,
        [eventType, subject ?? null, severity, JSON.stringify(details ?? {})]
      );
    } catch (err) {
      console.error("[audit-log] Failed to record security event:", err instanceof Error ? err.message : String(err));
    }
  }

  /** Records a real failure (timeout, non-2xx, unexpected shape) of an external integration — never a "not configured" skip. */
  async logIntegrationFailure(integration: string, error: string): Promise<void> {
    try {
      await this.pool.query(`INSERT INTO integration_failures (integration, error) VALUES ($1, $2)`, [integration, error]);
    } catch (err) {
      console.error("[audit-log] Failed to record integration failure:", err instanceof Error ? err.message : String(err));
    }
  }
}

export function createAuditLogService(pool: Pool): AuditLogService {
  return new AuditLogService(pool);
}
