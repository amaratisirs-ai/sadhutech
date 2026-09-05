// Service worker - the only context allowed to make cross-origin fetch() calls to the gate.
// Receives intercepted wallet requests from content-script.ts and returns a verdict.
import type { AnalyzeRequestMessage, AnalyzeResponseMessage } from "./messages.js";

const GATE_URL = "https://genesis-gate.onrender.com";

function parseChainId(hex: unknown): number {
  if (typeof hex !== "string") return 1;
  const n = Number.parseInt(hex, 16);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

async function analyze(request: AnalyzeRequestMessage): Promise<Omit<AnalyzeResponseMessage, "id" | "type" | "proceed">> {
  try {
    if (request.method === "eth_sendTransaction") {
      const tx = request.params[0] as Record<string, unknown> | undefined;
      if (!tx?.to || !tx?.from) throw new Error("Malformed transaction request");
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
        }),
      });
      if (!res.ok) throw new Error(`Gate returned ${res.status}`);
      const data = await res.json();
      return { verdict: data.verdict, plainEnglish: data.plainEnglish ?? data.summary ?? "" };
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
