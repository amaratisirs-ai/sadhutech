// Isolated-world bridge: listens for intercepted requests from inject.ts (MAIN world),
// asks background.ts to analyze them via the GENESIS gate, shows a warning overlay for
// anything risky, then reports the final proceed/block decision back to inject.ts.
import {
  GENESIS_REQUEST_EVENT,
  GENESIS_RESPONSE_EVENT,
  type AnalyzeRequestMessage,
  type AnalyzeResponseMessage,
} from "./messages.js";
import { showOverlay, showChecking } from "./overlay.js";

window.addEventListener(GENESIS_REQUEST_EVENT, async (event) => {
  const request = (event as CustomEvent<AnalyzeRequestMessage>).detail;
  if (!request) return;

  const settings = await chrome.storage.local.get("genesisEnabled");
  if (settings.genesisEnabled === false) {
    respond({ type: GENESIS_RESPONSE_EVENT, id: request.id, verdict: "allow", plainEnglish: "", proceed: true });
    return;
  }

  const dismissChecking = showChecking();

  let analysis: { verdict: AnalyzeResponseMessage["verdict"]; plainEnglish: string; error?: string };
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
    respond({ type: GENESIS_RESPONSE_EVENT, id: request.id, verdict: "allow", plainEnglish: analysis.plainEnglish, proceed: true });
    return;
  }

  dismissChecking();
  const proceed = await showOverlay(analysis.verdict, analysis.plainEnglish);
  respond({ type: GENESIS_RESPONSE_EVENT, id: request.id, verdict: analysis.verdict, plainEnglish: analysis.plainEnglish, proceed });
});

function respond(message: AnalyzeResponseMessage): void {
  window.dispatchEvent(new CustomEvent(GENESIS_RESPONSE_EVENT, { detail: message }));
}
