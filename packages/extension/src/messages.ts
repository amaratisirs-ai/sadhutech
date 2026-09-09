// Shared message shapes between inject.ts (MAIN world) <-> content-script.ts (isolated) <-> background.ts.

export const GENESIS_REQUEST_EVENT = "genesis:analyze-request";
export const GENESIS_RESPONSE_EVENT = "genesis:analyze-response";
// One-time handshake so inject.ts can verify responses really came from content-script.ts
// and not a forged CustomEvent from the page itself - see signResponse/verifyResponse below.
export const GENESIS_HANDSHAKE_EVENT = "genesis:handshake";

export type InterceptedMethod = "eth_sendTransaction" | "personal_sign" | "eth_signTypedData_v3" | "eth_signTypedData_v4" | "eth_sign";

export interface AnalyzeRequestMessage {
  type: typeof GENESIS_REQUEST_EVENT;
  id: string;
  method: InterceptedMethod;
  params: unknown[];
  origin: string;
}

export type Verdict = "allow" | "warn" | "block";

export interface AnalyzeResponseMessage {
  type: typeof GENESIS_RESPONSE_EVENT;
  id: string;
  verdict: Verdict;
  plainEnglish: string;
  /** Final decision after any user interaction (e.g. clicking through a warning). Only sent once resolved. */
  proceed: boolean;
  error?: string;
  /** Present when a Deep Check credit was spent on this request. */
  creditsLeft?: number;
  /** HMAC over the fields above, keyed with the per-page-load handshake secret. See verifyResponse(). */
  sig?: string;
}

export interface HandshakeMessage {
  type: typeof GENESIS_HANDSHAKE_EVENT;
  secret: string;
}

/**
 * inject.ts (MAIN world) and content-script.ts (isolated world) can only talk to each other
 * via CustomEvents on the shared page `window` - but that means ANY script the page itself
 * loads can also listen for and forge those events. Without this, a malicious dapp could
 * fire a fake "allow, proceed: true" response before the real analysis finishes, bypassing
 * protection entirely. Both sides derive a shared secret from a one-time handshake dispatched
 * the instant content-script.ts loads (before any page script has had a chance to run, since
 * Chrome guarantees "document_start" content scripts execute first) and use it to sign/verify
 * every response. Fails soft (no signing) on non-secure contexts where Web Crypto is unavailable
 * (rare, HTTP-only pages) rather than crashing - matches this codebase's fail-open philosophy.
 */
export function canUseWebCrypto(): boolean {
  return typeof crypto !== "undefined" && !!crypto.subtle && typeof crypto.randomUUID === "function";
}

export function generateChannelSecret(): string {
  return canUseWebCrypto() ? `${crypto.randomUUID()}${crypto.randomUUID()}` : "";
}

function responsePayload(m: Pick<AnalyzeResponseMessage, "id" | "verdict" | "proceed" | "error">): string {
  return `${m.id}|${m.verdict}|${m.proceed}|${m.error ?? ""}`;
}

async function hmacHex(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const buf = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time-ish comparison - avoids short-circuiting on the first differing byte. */
function hexEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Called by content-script.ts before dispatching a genuine response. */
export async function signResponse(secret: string, m: Omit<AnalyzeResponseMessage, "sig">): Promise<string | undefined> {
  if (!secret || !canUseWebCrypto()) return undefined;
  return hmacHex(secret, responsePayload(m));
}

/** Called by inject.ts before trusting a response event. */
export async function verifyResponse(secret: string, m: AnalyzeResponseMessage): Promise<boolean> {
  if (!secret || !canUseWebCrypto()) return true; // can't verify - fail open, not fail closed (see module doc)
  if (!m.sig) return false;
  const expected = await hmacHex(secret, responsePayload(m));
  return hexEqual(expected, m.sig);
}


// Deep Check authorization: connecting happens on a real sadhutech.com tab (reusing the
// site's own wallet-connect + signing flow), which hands the signed credential to the
// extension via chrome.runtime.onMessageExternal (see background.ts + manifest.json's
// "externally_connectable"). Not done from the toolbar popup - Chrome closes popups when a
// wallet's own approval dialog steals focus, and the popup has no access to whatever wallet
// is on the active tab, so a relay-through-the-page approach was unreliable and offered no
// way to pick between multiple installed wallets. Cached in chrome.storage.local under
// "genesisProAuth" and reused across checks.
export interface ProAuth {
  address: string;
  message: string;
  signature: string;
  ts: number;
}

