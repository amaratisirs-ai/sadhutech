/**
 * Email template definitions for Resend's native Templates feature
 * (https://resend.com/docs/dashboard/templates/introduction). These are the
 * source of truth used both to publish templates to Resend (see
 * sync-email-templates.ts, an idempotent one-time/CLI script) and to send
 * them (see newsletter.ts, which references each template by its stable
 * `alias`).
 *
 * After a template is published, further copy edits can be made directly in
 * the Resend dashboard without a code deploy — re-running the sync script
 * only creates templates that don't exist yet, it never overwrites one
 * (use `--update` to explicitly push code changes to already-published
 * templates, e.g. after a design tweak here).
 *
 * `UNSUB_URL` is intentionally not named `UNSUBSCRIBE_URL` — that name (along
 * with FIRST_NAME/LAST_NAME/EMAIL/contact/this) is reserved by Resend.
 *
 * HTML below is deliberately table-based with inline styles only (no <style>
 * blocks, no external CSS) — that's the one layout approach that renders
 * consistently across Outlook, Gmail, and Apple Mail.
 */

export interface EmailTemplateVariable {
  key: string;
  type: "string" | "number";
  fallbackValue?: string | number;
}

export interface EmailTemplateDef {
  /** Stable identifier used both as the Resend template alias and our journey step's templateId. */
  alias: string;
  name: string;
  subject: string;
  /** Resend template HTML, using {{{VAR}}} syntax for variables. */
  html: string;
  variables: EmailTemplateVariable[];
}

const UNSUB_VAR: EmailTemplateVariable = { key: "UNSUB_URL", type: "string", fallbackValue: "https://sadhutech.com/unsubscribe" };

const TEAL = "#0d9488";
const INK = "#0f172a";

/** A styled CTA link, rendered to look like a button (real <button> isn't reliable in email clients). */
function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${TEAL};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:8px;margin-top:8px;">${label}</a>`;
}

/** Wraps inner body HTML in the shared GENESIS email shell: dark header, white card, footer with unsubscribe. */
function wrapEmail(bodyHtml: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e2e8f0;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
      <tr><td style="background:${INK};padding:20px 32px;">
        <span style="color:${TEAL};font-size:20px;font-weight:800;letter-spacing:0.5px;">GENESIS</span>
      </td></tr>
      <tr><td style="padding:32px;color:#334155;font-size:15px;line-height:1.6;">
        ${bodyHtml}
      </td></tr>
      <tr><td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;">GENESIS by sadhutech &middot; <a href="https://sadhutech.com" style="color:${TEAL};text-decoration:none;">sadhutech.com</a></p>
        <p style="margin:6px 0 0;color:#94a3b8;font-size:12px;"><a href="{{{UNSUB_URL}}}" style="color:#94a3b8;">Unsubscribe</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>`;
}

export const EMAIL_TEMPLATES: Record<string, EmailTemplateDef> = {
  welcome: {
    alias: "genesis-welcome",
    name: "GENESIS: Welcome",
    subject: "Welcome to GENESIS — you're protected",
    html: wrapEmail(
      `<h1 style="margin:0 0 12px;font-size:20px;color:${INK};">You're protected</h1>
      <p style="margin:0 0 20px;">Thanks for connecting. <strong>GENESIS</strong> checks transactions before you sign, free forever &mdash; no wallet required to check.</p>
      ${button("https://sadhutech.com/check", "Try a check &rarr;")}`
    ),
    variables: [UNSUB_VAR],
  },
  "getting-started-tips": {
    alias: "genesis-getting-started-tips",
    name: "GENESIS: Getting started tips",
    subject: "3 ways to get more from GENESIS",
    html: wrapEmail(
      `<h1 style="margin:0 0 12px;font-size:20px;color:${INK};">3 ways to get more from GENESIS</h1>
      <ul style="margin:0 0 20px;padding-left:20px;">
        <li style="margin-bottom:10px;">Install the <a href="https://sadhutech.com/snap-install" style="color:${TEAL};">MetaMask Snap</a> for in-wallet verdicts</li>
        <li style="margin-bottom:10px;"><a href="https://sadhutech.com/report" style="color:${TEAL};">Report scams</a> to strengthen the community feed</li>
        <li><a href="https://sadhutech.com/pro" style="color:${TEAL};">Buy Pro credits</a> for deeper ChainAbuse checks</li>
      </ul>
      ${button("https://sadhutech.com/check", "Check a transaction &rarr;")}`
    ),
    variables: [UNSUB_VAR],
  },
  "first-month-recap": {
    alias: "genesis-first-month-recap",
    name: "GENESIS: First month recap",
    subject: "Your first month with GENESIS",
    html: wrapEmail(
      `<h1 style="margin:0 0 12px;font-size:20px;color:${INK};">Your first month with GENESIS</h1>
      <p style="margin:0 0 20px;">It's been a few weeks. See what's new on News &amp; Articles, or read where we're headed on the roadmap.</p>
      ${button("https://sadhutech.com/news", "See what's new &rarr;")}
      &nbsp;&nbsp;
      ${button("https://sadhutech.com/whitepaper", "Read the roadmap &rarr;")}`
    ),
    variables: [UNSUB_VAR],
  },
  "monthly-newsletter": {
    alias: "genesis-monthly-newsletter",
    name: "GENESIS: Monthly newsletter",
    subject: "GENESIS monthly: threats, updates, and what's next",
    html: wrapEmail(
      `<h1 style="margin:0 0 12px;font-size:20px;color:${INK};">This month at GENESIS</h1>
      <p style="margin:0 0 20px;">Threat feed highlights and product updates are on the News &amp; Articles page.</p>
      ${button("https://sadhutech.com/news", "Read this month's update &rarr;")}`
    ),
    variables: [UNSUB_VAR],
  },
};
