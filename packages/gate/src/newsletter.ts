import { Pool } from "pg";
import crypto from "node:crypto";
import { computeDueSteps } from "./journeys.js";
import { EMAIL_TEMPLATES } from "./email-templates.js";

const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.RESENT_API_KEY || "";
const FROM = process.env.NEWSLETTER_FROM_EMAIL || "GENESIS <noreply@sadhutech.com>";
const SITE_URL = process.env.SITE_URL || "https://sadhutech.com";

export interface SubscribeResult {
  ok: boolean;
  alreadySubscribed?: boolean;
  unsubscribeToken?: string;
}

/**
 * Newsletter + email-journey framework: stores consenting subscribers and runs
 * the timed sequence of templated emails (see journeys.ts) via Resend. A
 * subscriber's identity is just an email — wallet_address/source/consent_version
 * are optional context captured at signup time (footer form, connect-wallet
 * consent, etc.).
 */
export class NewsletterService {
  constructor(private pool: Pool) {}

  async initialize(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS email_subscribers (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        wallet_address TEXT,
        consent_version TEXT,
        source TEXT,
        unsubscribe_token TEXT UNIQUE NOT NULL,
        subscribed_at TIMESTAMPTZ DEFAULT NOW(),
        unsubscribed_at TIMESTAMPTZ
      );
      CREATE TABLE IF NOT EXISTS email_sends (
        id SERIAL PRIMARY KEY,
        subscriber_id INTEGER NOT NULL REFERENCES email_subscribers(id) ON DELETE CASCADE,
        step_id TEXT NOT NULL,
        sent_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
  }

  /** Adds (or re-activates) a subscriber. Idempotent, never throws — must not break the caller's flow. */
  async subscribe(
    email: string,
    opts: { walletAddress?: string; consentVersion?: string; source?: string } = {}
  ): Promise<SubscribeResult> {
    const normalized = email.trim().toLowerCase();
    try {
      const existing = await this.pool.query(
        "SELECT unsubscribe_token, unsubscribed_at FROM email_subscribers WHERE email = $1",
        [normalized]
      );
      if (existing.rows[0]) {
        if (existing.rows[0].unsubscribed_at) {
          await this.pool.query(
            "UPDATE email_subscribers SET unsubscribed_at = NULL, subscribed_at = NOW() WHERE email = $1",
            [normalized]
          );
        }
        return { ok: true, alreadySubscribed: true, unsubscribeToken: existing.rows[0].unsubscribe_token };
      }
      const token = crypto.randomBytes(24).toString("hex");
      await this.pool.query(
        `INSERT INTO email_subscribers (email, wallet_address, consent_version, source, unsubscribe_token)
         VALUES ($1, $2, $3, $4, $5)`,
        [normalized, opts.walletAddress?.toLowerCase() ?? null, opts.consentVersion ?? null, opts.source ?? null, token]
      );
      return { ok: true, unsubscribeToken: token };
    } catch (err) {
      console.error("[newsletter] Failed to subscribe:", err instanceof Error ? err.message : String(err));
      return { ok: false };
    }
  }

  /** Marks a subscriber unsubscribed by their unique token. Returns false if the token is unknown or already unsubscribed. */
  async unsubscribe(token: string): Promise<boolean> {
    try {
      const r = await this.pool.query(
        "UPDATE email_subscribers SET unsubscribed_at = NOW() WHERE unsubscribe_token = $1 AND unsubscribed_at IS NULL RETURNING id",
        [token]
      );
      return (r.rowCount ?? 0) > 0;
    } catch (err) {
      console.error("[newsletter] Failed to unsubscribe:", err instanceof Error ? err.message : String(err));
      return false;
    }
  }

  private async sendEmail(to: string, templateId: string, unsubscribeToken: string): Promise<boolean> {
    const template = EMAIL_TEMPLATES[templateId];
    if (!template || !RESEND_API_KEY) return false;
    const unsubscribeUrl = `${SITE_URL}/unsubscribe?token=${unsubscribeToken}`;
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify({
          from: FROM,
          to,
          subject: template.subject,
          template: { id: template.alias, variables: { UNSUB_URL: unsubscribeUrl } },
        }),
      });
      if (!res.ok) {
        console.error(`[newsletter] Resend rejected "${templateId}" for ${to}: HTTP ${res.status} ${await res.text().catch(() => "")}`);
      }
      return res.ok;
    } catch (err) {
      console.error(`[newsletter] Failed to send "${templateId}" to ${to}:`, err instanceof Error ? err.message : String(err));
      return false;
    }
  }

  /**
   * Sends any due journey emails to all active (non-unsubscribed) subscribers.
   * Safe to call repeatedly/concurrently on a schedule — each step is recorded
   * in email_sends right after a successful send, so it won't be resent.
   */
  async sendDueEmails(now: Date = new Date()): Promise<{ sent: number; subscribers: number }> {
    if (!RESEND_API_KEY) return { sent: 0, subscribers: 0 };
    let sent = 0;
    const subs = await this.pool.query(
      "SELECT id, email, subscribed_at, unsubscribe_token FROM email_subscribers WHERE unsubscribed_at IS NULL"
    );
    for (const sub of subs.rows) {
      const sendRows = await this.pool.query(
        "SELECT step_id, MAX(sent_at) as last_sent FROM email_sends WHERE subscriber_id = $1 GROUP BY step_id",
        [sub.id]
      );
      const sentSteps: Record<string, Date> = {};
      for (const row of sendRows.rows) sentSteps[row.step_id] = new Date(row.last_sent);

      const due = computeDueSteps(new Date(sub.subscribed_at), sentSteps, now);
      for (const step of due) {
        const ok = await this.sendEmail(sub.email, step.templateId, sub.unsubscribe_token);
        if (ok) {
          await this.pool.query("INSERT INTO email_sends (subscriber_id, step_id) VALUES ($1, $2)", [sub.id, step.id]);
          sent++;
        }
      }
    }
    return { sent, subscribers: subs.rows.length };
  }
}

/**
 * Runs sendDueEmails on startup, then on a fixed interval — mirrors
 * initSyncService's pattern. In-process timers are a best-effort fallback
 * only (Render free-tier instances sleep when idle); pair with an external
 * cron hitting POST /v1/newsletter/run for reliable delivery in production.
 */
export function initNewsletterService(service: NewsletterService, options?: { runOnStartup?: boolean; intervalHours?: number }): void {
  const { runOnStartup = true, intervalHours = 1 } = options || {};
  if (runOnStartup) {
    service.sendDueEmails().catch((err) => console.error("[newsletter] Startup send failed:", err));
  }
  if (intervalHours > 0) {
    setInterval(() => service.sendDueEmails().catch((err) => console.error("[newsletter] Scheduled send failed:", err)), intervalHours * 60 * 60 * 1000);
  }
}
