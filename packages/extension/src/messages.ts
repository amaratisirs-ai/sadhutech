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
}
