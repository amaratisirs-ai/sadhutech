import { NextRequest, NextResponse } from "next/server";
import { createHmac, createHash, timingSafeEqual } from "node:crypto";

// Step 2 of reporting: validate the emailed token, then record the report to the gate.
const GATE_URL = process.env.GATE_URL || process.env.NEXT_PUBLIC_GATE_URL || "https://genesis-gate.onrender.com";
const API_KEY = (process.env.GENESIS_REPORT_API_KEY || process.env.GENESIS_API_KEYS || "").split(",")[0].trim();
const SIGNING_SECRET =
  process.env.REPORT_SIGNING_SECRET ||
  process.env.GENESIS_REPORT_API_KEY ||
  (process.env.GENESIS_API_KEYS || "").split(",")[0].trim();

function verifyToken(token: string): any | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", SIGNING_SECRET).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const { token } = await req.json().catch(() => ({}));
  if (typeof token !== "string") {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "This confirmation link is invalid or has expired." }, { status: 400 });
  }
  if (!API_KEY) {
    return NextResponse.json({ error: "Reporting isn't configured yet." }, { status: 503 });
  }

  const reporterId = "e:" + createHash("sha256").update(payload.email).digest("hex").slice(0, 24);
  const gatePayload = {
    address: payload.address,
    category: payload.category,
    description: payload.description || undefined,
    reporterId,
    reporterName: payload.reporterName || undefined,
    reporterEmail: payload.email,
  };

  try {
    const res = await fetch(`${GATE_URL}/v1/report`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": API_KEY },
      body: JSON.stringify(gatePayload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ error: data.error || "Report failed." }, { status: res.status });
    }
    return NextResponse.json({ ok: true, address: payload.address, result: data });
  } catch {
    return NextResponse.json({ error: "Could not reach the threat service." }, { status: 502 });
  }
}
