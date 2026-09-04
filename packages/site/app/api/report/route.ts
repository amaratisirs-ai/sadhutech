import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";

// Step 1 of reporting: rate-limit + bot-check + validate, then email a signed confirmation link.
// The report is only recorded after the user clicks the link (see /api/verify),
// which proves they own the email  -  Sybil resistance with no extra storage.
const RESEND_KEY = process.env.RESEND_API_KEY || process.env.RESENT_API_KEY || "";
const FROM = process.env.REPORT_FROM_EMAIL || "GENESIS <noreply@sadhutech.com>";
// Dedicated secret only — never fall back to the shared gate API key or an empty
// string, since either would let anyone forge a "confirmed" report token.
const SIGNING_SECRET = process.env.REPORT_SIGNING_SECRET || "";
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET || "";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const CATEGORIES = ["phishing", "drainer", "malicious-contract", "decoy-tripwire", "sanctioned"];

// Best-effort in-memory limiter (per serverless instance). For strict global limits, back with Vercel KV/Upstash.
const ipHits = new Map<string, { count: number; resetAt: number }>();
const emailHits = new Map<string, { count: number; resetAt: number }>();

function allow(map: Map<string, { count: number; resetAt: number }>, key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const e = map.get(key);
  if (!e || now > e.resetAt) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (e.count >= max) return false;
  e.count++;
  return true;
}

function clientIp(req: NextRequest): string {
  return (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  if (!TURNSTILE_SECRET) return true; // Not configured (e.g. local dev)  -  skip.
  const form = new URLSearchParams({ secret: TURNSTILE_SECRET, response: token });
  if (ip && ip !== "unknown") form.set("remoteip", ip);
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
    const d = await r.json().catch(() => ({}));
    return !!d.success;
  } catch {
    return false;
  }
}

function signToken(payload: object): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", SIGNING_SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export async function POST(req: NextRequest) {
  if (!SIGNING_SECRET) {
    return NextResponse.json({ error: "Reporting isn't configured yet. Please try again later." }, { status: 503 });
  }

  const ip = clientIp(req);
  if (!allow(ipHits, ip, 8, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many reports from this network. Please wait a few minutes." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const address = typeof body.address === "string" ? body.address.trim().toLowerCase() : "";
  const category = typeof body.category === "string" ? body.category : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const description = typeof body.description === "string" ? body.description.slice(0, 1000) : "";
  const reporterName = typeof body.reporterName === "string" ? body.reporterName.trim().slice(0, 80) : "";
  const turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken : "";

  if (!ADDRESS_RE.test(address)) {
    return NextResponse.json({ error: "Enter a valid 0x address (40 hex characters)." }, { status: 400 });
  }
  if (!CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Choose a valid threat type." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "A valid email is required to confirm your report." }, { status: 400 });
  }
  if (!allow(emailHits, email, 3, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "This email has requested too many confirmations. Try again later." }, { status: 429 });
  }
  if (!(await verifyTurnstile(turnstileToken, ip))) {
    return NextResponse.json({ error: "Bot check failed. Please retry the challenge." }, { status: 403 });
  }
  if (!RESEND_KEY) {
    return NextResponse.json({ error: "Email confirmation isn't configured yet." }, { status: 503 });
  }

  const token = signToken({ address, category, description, email, reporterName, exp: Date.now() + 24 * 60 * 60 * 1000 });
  const link = `${req.nextUrl.origin}/verify?token=${encodeURIComponent(token)}`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: email,
        subject: "Confirm your GENESIS threat report",
        html: `<div style="font-family:system-ui,sans-serif;max-width:480px">
          <h2>Confirm your report</h2>
          <p>Thanks for helping protect the community. Click below to confirm your report of:</p>
          <p><code>${address}</code>  -  ${category}</p>
          <p><a href="${link}" style="display:inline-block;background:#0d9488;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Confirm my report</a></p>
          <p style="color:#64748b;font-size:13px">This link expires in 24 hours. If you didn't submit this, you can ignore this email.</p>
        </div>`,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return NextResponse.json({ error: `Couldn't send the confirmation email. ${t.slice(0, 160)}` }, { status: 502 });
    }
    return NextResponse.json({ pending: true });
  } catch {
    return NextResponse.json({ error: "Couldn't send the confirmation email." }, { status: 502 });
  }
}
