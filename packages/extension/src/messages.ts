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

// Deep Check authorization: popup.ts asks the active tab's page (via content-script.ts,
// which relays into inject.ts's MAIN-world window.ethereum) to sign a one-time proof-of-
// wallet-ownership message, cached in chrome.storage.local and reused across checks.
export const GENESIS_AUTH_REQUEST_EVENT = "genesis:auth-request";
export const GENESIS_AUTH_RESPONSE_EVENT = "genesis:auth-response";

export interface AuthRequestMessage {
  type: typeof GENESIS_AUTH_REQUEST_EVENT;
  id: string;
}

export interface AuthResponseMessage {
  type: typeof GENESIS_AUTH_RESPONSE_EVENT;
  id: string;
  address?: string;
  message?: string;
  signature?: string;
  error?: string;
}

/** Cached Deep Check credential, persisted in chrome.storage.local under "genesisProAuth". */
export interface ProAuth {
  address: string;
  message: string;
  signature: string;
  ts: number;
}

