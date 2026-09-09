// Isolated-world bridge: listens for intercepted requests from inject.ts (MAIN world),
// asks background.ts to analyze them via the GENESIS gate, shows a warning overlay for
// anything risky, then reports the final proceed/block decision back to inject.ts.
import {
  GENESIS_REQUEST_EVENT,
  GENESIS_RESPONSE_EVENT,
  GENESIS_HANDSHAKE_EVENT,
  generateChannelSecret,
  signResponse,
  type AnalyzeRequestMessage,
  type AnalyzeResponseMessage,
  type HandshakeMessage,
} from "./messages.js";
import { showOverlay, showChecking, showCreditNotice, showSkippedCheckNotice } from "./overlay.js";

// Generated and broadcast the instant this script loads - before any page script has had a
// chance to run (Chrome guarantees "document_start" content scripts execute first) - so
// inject.ts can verify every response really came from here, not a forged page script.
// See messages.ts for why this is needed.
const channelSecret = generateChannelSecret();
window.dispatchEvent(
  new CustomEvent<HandshakeMessage>(GENESIS_HANDSHAKE_EVENT, { detail: { type: GENESIS_HANDSHAKE_EVENT, secret: channelSecret } })
);

window.addEventListener(GENESIS_REQUEST_EVENT, async (event) => {
  const request = (event as CustomEvent<AnalyzeRequestMessage>).detail;
  if (!request) return;

  const settings = await chrome.storage.local.get("genesisEnabled");
  if (settings.genesisEnabled === false) {
    await respond({ type: GENESIS_RESPONSE_EVENT, id: request.id, verdict: "allow", plainEnglish: "", proceed: true });
    return;
  }

  const dismissChecking = showChecking();

  let analysis: { verdict: AnalyzeResponseMessage["verdict"]; plainEnglish: string; error?: string; creditsLeft?: number };
  try {
    analysis = await chrome.runtime.sendMessage(request);
  } catch (err) {
    // Fail open: never block a signature because our own analysis pipeline had an error.
    dismissChecking();
    showSkippedCheckNotice();
    await respond({ type: GENESIS_RESPONSE_EVENT, id: request.id, verdict: "allow", plainEnglish: "", proceed: true });
    return;
  }

  if (analysis.verdict === "allow") {
    dismissChecking();
    if (analysis.error) showSkippedCheckNotice();
    else if (typeof analysis.creditsLeft === "number") showCreditNotice(analysis.creditsLeft);
    await respond({
      type: GENESIS_RESPONSE_EVENT,
      id: request.id,
      verdict: "allow",
      plainEnglish: analysis.plainEnglish,
      proceed: true,
      creditsLeft: analysis.creditsLeft,
    });
    return;
  }

  dismissChecking();
  const plainEnglish =
    typeof analysis.creditsLeft === "number"
      ? `${analysis.plainEnglish}\n\n(1 Deep Check credit used, ${analysis.creditsLeft} remaining.)`
      : analysis.plainEnglish;
  const proceed = await showOverlay(analysis.verdict, plainEnglish);
  await respond({ type: GENESIS_RESPONSE_EVENT, id: request.id, verdict: analysis.verdict, plainEnglish, proceed, creditsLeft: analysis.creditsLeft });
});

async function respond(message: Omit<AnalyzeResponseMessage, "sig">): Promise<void> {
  const sig = await signResponse(channelSecret, message);
  window.dispatchEvent(new CustomEvent(GENESIS_RESPONSE_EVENT, { detail: { ...message, sig } }));
}

