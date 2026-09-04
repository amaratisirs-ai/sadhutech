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
      CREATE TABLE IF NOT EXISTS consent_log (
        id SERIAL PRIMARY KEY,
        address TEXT,
        type TEXT NOT NULL,
        version TEXT NOT NULL,
        context TEXT,
        ip_address TEXT,
        user_agent TEXT,
        country TEXT,
        region TEXT,
        city TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE consent_log ADD COLUMN IF NOT EXISTS ip_address TEXT;
      ALTER TABLE consent_log ADD COLUMN IF NOT EXISTS user_agent TEXT;
      ALTER TABLE consent_log ADD COLUMN IF NOT EXISTS country TEXT;
      ALTER TABLE consent_log ADD COLUMN IF NOT EXISTS region TEXT;
      ALTER TABLE consent_log ADD COLUMN IF NOT EXISTS city TEXT;
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

  /** Records acceptance of Terms/Privacy at a key touchpoint (wallet connect, Snap install, Snap authorization). */
  async logConsent(
    address: string | undefined,
    type: string,
    version: string,
    context?: string,
    meta?: { ipAddress?: string; userAgent?: string; country?: string; region?: string; city?: string }
  ): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO consent_log (address, type, version, context, ip_address, user_agent, country, region, city)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          address ? address.toLowerCase() : null,
          type,
          version,
          context ?? null,
          meta?.ipAddress ?? null,
          meta?.userAgent ?? null,
          meta?.country ?? null,
          meta?.region ?? null,
          meta?.city ?? null,
        ]
      );
    } catch (err) {
      console.error("[audit-log] Failed to record consent:", err instanceof Error ? err.message : String(err));
    }
  }
}

export function createAuditLogService(pool: Pool): AuditLogService {
  return new AuditLogService(pool);
}

const PRIVATE_IP_RE = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|localhost$|unknown$)/;

/** First hop of X-Forwarded-For (real client), falling back to the socket address. */
export function getClientIp(request: { headers: Record<string, unknown>; ip?: string }): string | undefined {
  const forwarded = request.headers["x-forwarded-for"];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.toString().split(",")[0]?.trim();
  return first || request.ip || undefined;
}

/** Best-effort coarse geolocation from IP. Never throws; returns null on any failure, private IP, or timeout. */
export async function lookupGeoIp(ip: string | undefined): Promise<{ country?: string; region?: string; city?: string } | null> {
  if (!ip || PRIVATE_IP_RE.test(ip)) return null;
  try {
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      signal: AbortSignal.timeout(2000),
      headers: { "User-Agent": "GENESIS-Gate/1.0" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { country_name?: string; region?: string; city?: string; error?: boolean };
    if (data.error) return null;
    return { country: data.country_name, region: data.region, city: data.city };
  } catch {
    return null; // Network error, timeout, or rate limit — consent is still logged without geo.
  }
}
