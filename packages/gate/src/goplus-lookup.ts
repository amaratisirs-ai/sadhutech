import { createHash } from "crypto";

/**
 * GoPlus Security — Malicious Address API (free tier). Docs:
 * https://docs.gopluslabs.io/reference/addresscontractusingget_1
 *
 * Auth is a signed OAuth-style flow (confirmed from GoPlus's live OpenAPI spec):
 * app_key + app_secret -> sha1(app_key + time + app_secret) -> POST /api/v1/token
 * -> short-lived access_token -> Authorization: Bearer <access_token>.
 *
 * Gated behind GOPLUS_APP_KEY + GOPLUS_APP_SECRET so tests/dev stay offline by
 * default, matching the chainabuse-lookup.ts / fetchBlockaidThreats() convention.
 * Fails open (returns null) on any network error, timeout, or unexpected shape —
 * a GoPlus outage must never block or slow down the core analyze() path.
 */
const TOKEN_URL = "https://api.gopluslabs.io/api/v1/token";
const GOPLUS_TIMEOUT_MS = 2500;

export interface GoPlusHit {
  flagged: boolean;
  reasons: string[];
}

/** Boolean ("1"/"0") risk flags from GoPlus's Malicious Address API response schema. */
const MALICIOUS_FLAGS = [
  "blacklist_doubt",
  "blackmail_activities",
  "cybercrime",
  "darkweb_transactions",
  "fake_kyc",
  "fake_standard_interface",
  "fake_token",
  "financial_crime",
  "gas_abuse",
  "honeypot_related_address",
  "malicious_mining_activities",
  "mixer",
  "money_laundering",
  "phishing_activities",
  "reinit",
  "sanctioned",
  "stealing_attack",
] as const;

let cachedToken: { value: string; expiresAt: number } | null = null;

function sign(appKey: string, time: number, appSecret: string): string {
  return createHash("sha1").update(`${appKey}${time}${appSecret}`).digest("hex");
}

async function getAccessToken(): Promise<string | null> {
  const appKey = process.env.GOPLUS_APP_KEY;
  const appSecret = process.env.GOPLUS_APP_SECRET;
  if (!appKey || !appSecret) return null;

  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;

  try {
    const time = Math.floor(Date.now() / 1000);
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ app_key: appKey, sign: sign(appKey, time, appSecret), time }),
      signal: AbortSignal.timeout(GOPLUS_TIMEOUT_MS),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { code?: number; result?: { access_token?: string; expires_in?: number } };
    const token = data?.result?.access_token;
    if (!token) return null;

    const ttlMs = (data.result?.expires_in ?? 300) * 1000;
    cachedToken = { value: token, expiresAt: Date.now() + ttlMs - 30_000 }; // refresh 30s early
    return token;
  } catch {
    return null;
  }
}

export function goplusAvailable(): boolean {
  return !!(process.env.GOPLUS_APP_KEY && process.env.GOPLUS_APP_SECRET);
}

export async function lookupMaliciousAddress(
  address: string,
  chainId: number,
  onFailure?: (reason: string) => void
): Promise<GoPlusHit | null> {
  if (!goplusAvailable()) return null;

  try {
    const token = await getAccessToken();
    if (!token) {
      reportFailure("goplus-address", "could not obtain access token", onFailure);
      return null;
    }

    // GoPlus's access_token already includes the "Bearer " prefix in the string itself.
    const authHeader = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    const res = await fetch(
      `https://api.gopluslabs.io/api/v1/address_security/${address.toLowerCase()}?chain_id=${chainId}`,
      {
        headers: { "User-Agent": "GENESIS-Gate/1.0", Authorization: authHeader },
        signal: AbortSignal.timeout(GOPLUS_TIMEOUT_MS),
      }
    );
    if (!res.ok) {
      reportFailure("goplus-address", `HTTP ${res.status}`, onFailure);
      return null;
    }

    const data = (await res.json()) as { code?: number; result?: Record<string, unknown> };
    const result = data?.result;
    if (!result || typeof result !== "object") {
      reportFailure("goplus-address", "unexpected response shape", onFailure);
      return null;
    }

    const reasons = MALICIOUS_FLAGS.filter((flag) => result[flag] === "1");
    return { flagged: reasons.length > 0, reasons };
  } catch (err) {
    reportFailure("goplus-address", err instanceof Error ? err.message : String(err), onFailure);
    return null; // network error, timeout, or unexpected shape — fail open
  }
}

/**
 * GoPlus Security — Phishing Site Detection API. Docs:
 * https://docs.gopluslabs.io/reference/phishingsiteusingget
 * Same signed access_token auth as lookupMaliciousAddress().
 */
export async function lookupPhishingSite(url: string, onFailure?: (reason: string) => void): Promise<GoPlusHit | null> {
  if (!goplusAvailable()) return null;

  try {
    const token = await getAccessToken();
    if (!token) {
      reportFailure("goplus-phishing", "could not obtain access token", onFailure);
      return null;
    }

    const authHeader = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    const res = await fetch(
      `https://api.gopluslabs.io/api/v1/phishing_site?url=${encodeURIComponent(url)}`,
      {
        headers: { "User-Agent": "GENESIS-Gate/1.0", Authorization: authHeader },
        signal: AbortSignal.timeout(GOPLUS_TIMEOUT_MS),
      }
    );
    if (!res.ok) {
      reportFailure("goplus-phishing", `HTTP ${res.status}`, onFailure);
      return null;
    }

    const data = (await res.json()) as { code?: number; result?: { phishing_site?: number | string } };
    const flagged = String(data?.result?.phishing_site) === "1";
    return { flagged, reasons: flagged ? ["phishing_site"] : [] };
  } catch (err) {
    reportFailure("goplus-phishing", err instanceof Error ? err.message : String(err), onFailure);
    return null; // network error, timeout, or unexpected shape — fail open
  }
}

/** Logs a real integration failure to the console and, if provided, a durable audit sink. */
function reportFailure(integration: string, reason: string, onFailure?: (reason: string) => void): void {
  console.error(`[${integration}] failure: ${reason}`);
  onFailure?.(reason);
}

/** Test-only: reset the cached access token between test cases. */
export function __resetGoPlusTokenCache(): void {
  cachedToken = null;
}

