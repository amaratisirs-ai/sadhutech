// Isolated-world bridge: listens for intercepted requests from inject.ts (MAIN world),
// asks background.ts to analyze them via the GENESIS gate, shows a warning overlay for
// anything risky, then reports the final proceed/block decision back to inject.ts.
import {
  GENESIS_REQUEST_EVENT,
  GENESIS_RESPONSE_EVENT,
  GENESIS_AUTH_REQUEST_EVENT,
  GENESIS_AUTH_RESPONSE_EVENT,
  type AnalyzeRequestMessage,
  type AnalyzeResponseMessage,
  type AuthResponseMessage,
} from "./messages.js";
import { showOverlay, showChecking, showCreditNotice } from "./overlay.js";

window.addEventListener(GENESIS_REQUEST_EVENT, async (event) => {
  const request = (event as CustomEvent<AnalyzeRequestMessage>).detail;
  if (!request) return;

  const settings = await chrome.storage.local.get("genesisEnabled");
  if (settings.genesisEnabled === false) {
    respond({ type: GENESIS_RESPONSE_EVENT, id: request.id, verdict: "allow", plainEnglish: "", proceed: true });
    return;
  }

  const dismissChecking = showChecking();

  let analysis: { verdict: AnalyzeResponseMessage["verdict"]; plainEnglish: string; error?: string; creditsLeft?: number };
  try {
    analysis = await chrome.runtime.sendMessage(request);
  } catch (err) {
    // Fail open: never block a signature because our own analysis pipeline had an error.
    dismissChecking();
    respond({ type: GENESIS_RESPONSE_EVENT, id: request.id, verdict: "allow", plainEnglish: "", proceed: true });
    return;
  }

  if (analysis.verdict === "allow") {
    dismissChecking();
    if (typeof analysis.creditsLeft === "number") showCreditNotice(analysis.creditsLeft);
    respond({
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
  respond({ type: GENESIS_RESPONSE_EVENT, id: request.id, verdict: analysis.verdict, plainEnglish, proceed, creditsLeft: analysis.creditsLeft });
});

function respond(message: AnalyzeResponseMessage): void {
  window.dispatchEvent(new CustomEvent(GENESIS_RESPONSE_EVENT, { detail: message }));
}

// Relays the popup's "authorize wallet" request into inject.ts's MAIN world (where
// window.ethereum lives) and reports the signed credential (or error) back to the popup.
chrome.runtime.onMessage.addListener((message: { type: string }, _sender, sendResponse) => {
  if (message?.type !== "genesis-authorize") return;

  const id = `genesis-auth-${Date.now()}`;
  const onResponse = (event: Event) => {
    const detail = (event as CustomEvent<AuthResponseMessage>).detail;
    if (detail?.id !== id) return;
    window.removeEventListener(GENESIS_AUTH_RESPONSE_EVENT, onResponse);
    sendResponse(detail);
  };
  window.addEventListener(GENESIS_AUTH_RESPONSE_EVENT, onResponse);
  window.dispatchEvent(new CustomEvent(GENESIS_AUTH_REQUEST_EVENT, { detail: { id } }));
  return true; // keep the message channel open for the async sendResponse
});
