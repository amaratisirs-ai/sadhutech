// Service worker - the only context allowed to make cross-origin fetch() calls to the gate.
// Receives intercepted wallet requests from content-script.ts and returns a verdict.
import type { AnalyzeRequestMessage, AnalyzeResponseMessage, ProAuth } from "./messages.js";

const GATE_URL = "https://genesis-gate.onrender.com";
// Matches the site's own safety margin under the gate's 24h signature-freshness window
// (server.ts) - reused well before expiry so a cached signature is never rejected as stale.
const PRO_AUTH_TTL_MS = 23 * 60 * 60 * 1000;

function parseChainId(hex: unknown): number {
  if (typeof hex !== "string") return 1;
  const n = Number.parseInt(hex, 16);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** Reads the cached Deep Check credential, if the feature is on and the signature is still fresh. */
async function getActiveProAuth(): Promise<ProAuth | null> {
  const stored = await chrome.storage.local.get(["deepCheckEnabled", "genesisProAuth"]);
  if (!stored.deepCheckEnabled) return null;
  const auth = stored.genesisProAuth as ProAuth | undefined;
  if (!auth || Date.now() - auth.ts >= PRO_AUTH_TTL_MS) return null;
  return auth;
}

async function analyze(request: AnalyzeRequestMessage): Promise<Omit<AnalyzeResponseMessage, "id" | "type" | "proceed">> {
  try {
    if (request.method === "eth_sendTransaction") {
      const tx = request.params[0] as Record<string, unknown> | undefined;
      if (!tx?.to || !tx?.from) throw new Error("Malformed transaction request");
      const proAuth = await getActiveProAuth();
      const res = await fetch(`${GATE_URL}/v1/analyze`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tx: {
            chainId: parseChainId(tx.chainId),
            from: tx.from,
            to: tx.to,
            value: typeof tx.value === "string" ? tx.value : "0",
            data: tx.data ?? "0x",
          },
          ...(proAuth && {
            pro: { wallet: proAuth.address, message: proAuth.message, signature: proAuth.signature, source: "extension" },
          }),
        }),
      });
      if (!res.ok) throw new Error(`Gate returned ${res.status}`);
      const data = await res.json();
      return {
        verdict: data.verdict,
        plainEnglish: data.plainEnglish ?? data.summary ?? "",
        creditsLeft: typeof data.creditsLeft === "number" ? data.creditsLeft : undefined,
      };
    }

    // personal_sign: params = [message, address]. eth_signTypedData_v4: params = [address, typedData].
    const isTyped = request.method === "eth_signTypedData_v4";
    const from = (isTyped ? request.params[0] : request.params[1]) as string | undefined;
    const data = (isTyped ? request.params[1] : request.params[0]) as string | undefined;
    if (!from || !data) throw new Error("Malformed signature request");

    const res = await fetch(`${GATE_URL}/v1/analyze-signature`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sig: { chainId: 1, from, method: request.method, data, origin: request.origin },
      }),
    });
    if (!res.ok) throw new Error(`Gate returned ${res.status}`);
    const result = await res.json();
    return { verdict: result.verdict, plainEnglish: result.plainEnglish ?? result.summary ?? "" };
  } catch (err) {
    // Fail open - a gate/network error must never itself become a block.
    return { verdict: "allow", plainEnglish: "", error: err instanceof Error ? err.message : String(err) };
  }
}

chrome.runtime.onMessage.addListener((request: AnalyzeRequestMessage, _sender, sendResponse) => {
  analyze(request).then(sendResponse);
  return true; // keep the message channel open for the async sendResponse
});

// Deep Check enrollment: sadhutech.com's /extension-connect page (real tab, proper wallet
// picker, correct signing origin - see manifest.json's "externally_connectable" and
// packages/extension/README.md) hands the signed credential to the extension this way,
// rather than trying to sign from within the transient toolbar popup.
const ALLOWED_CONNECT_ORIGINS = ["https://sadhutech.com", "https://sadhutech-site.vercel.app", "http://localhost:3000"];
chrome.runtime.onMessageExternal.addListener((message: Record<string, unknown>, sender, sendResponse) => {
  if (message?.type !== "genesis-connect-result" || !ALLOWED_CONNECT_ORIGINS.includes(sender.origin ?? "")) return;
  const { address, authMessage, signature } = message as { address?: string; authMessage?: string; signature?: string };
  if (!address || !authMessage || !signature) {
    sendResponse({ ok: false, error: "Missing address, message, or signature." });
    return;
  }
  chrome.storage.local
    .set({ deepCheckEnabled: true, genesisProAuth: { address, message: authMessage, signature, ts: Date.now() } })
    .then(() => sendResponse({ ok: true }));
  return true; // keep the message channel open for the async sendResponse
});
