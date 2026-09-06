// Shared message shapes between inject.ts (MAIN world) <-> content-script.ts (isolated) <-> background.ts.

export const GENESIS_REQUEST_EVENT = "genesis:analyze-request";
export const GENESIS_RESPONSE_EVENT = "genesis:analyze-response";

export type InterceptedMethod = "eth_sendTransaction" | "personal_sign" | "eth_signTypedData_v4";

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

