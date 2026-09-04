/**
 * Core domain types for the GENESIS transaction firewall.
 * These are the contracts shared by the pre-sign gate, the community intel
 * service, and any client (MetaMask Snap, WalletConnect middleware, SDK).
 */

/** EIP-155 chain id. */
export type ChainId = number;

/** Lowercased 0x-prefixed hex address. */
export type Address = `0x${string}`;

/** A transaction the user is about to sign, as seen at the wallet boundary. */
export interface TxRequest {
  chainId: ChainId;
  from: Address;
  to: Address;
  /** Wei, decimal string. Absent/"0" for pure contract calls. */
  value?: string;
  /** Calldata, 0x-prefixed. "0x" for a plain native transfer. */
  data?: `0x${string}`;
}

export type Severity = "info" | "low" | "medium" | "high" | "critical";

/** Final gate decision. Enforcement of `block` depends on the autonomy level. */
export type Verdict = "allow" | "warn" | "block";

/** Graduated autonomy — how strictly the client should act on the verdict. */
export type Autonomy = "observe" | "warn" | "enforce";

export type ApprovalKind = "erc20" | "erc721-all" | "permit" | "permit2";

/** A spend authorization the tx would grant. The #1 drainer vector. */
export interface Approval {
  kind: ApprovalKind;
  token: Address;
  spender: Address;
  /** Decimal string; "unlimited" when max-uint or setApprovalForAll(true). */
  amount: string;
  unlimited: boolean;
}

export type AssetDirection = "in" | "out";

/** A net asset movement the tx is expected to cause for `from`. */
export interface AssetChange {
  direction: AssetDirection;
  token: Address | "native";
  amount: string;
  symbol?: string;
}

/** Output of the simulation/decoding layer. */
export interface SimulationResult {
  approvals: Approval[];
  assetChanges: AssetChange[];
  /** Decoded top-level method, e.g. "approve", "setApprovalForAll". */
  method?: string;
  /** Addresses this tx interacts with (spenders, recipients, target). */
  counterparties: Address[];
  /** True when simulation was heuristic (calldata-only, no fork). */
  heuristic: boolean;
}

/** A single risk observation with a stable id for testing/telemetry. */
export interface RiskFinding {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  /** Address that triggered the finding, when applicable. */
  subject?: Address;
}

export interface RiskAssessment {
  verdict: Verdict;
  /** 0 (safe) .. 100 (certainly malicious). */
  score: number;
  findings: RiskFinding[];
  simulation: SimulationResult;
  /** One-line human-readable net effect for the wallet UI. */
  summary: string;
  /** Non-technical, layman explanation of what signing would actually do. */
  plainEnglish: string;
}

export interface AnalyzeRequest {
  tx: TxRequest;
  autonomy?: Autonomy;
}

/** An off-chain signature request the wallet is about to sign, as seen at the wallet boundary. */
export interface SignatureRequest {
  chainId: ChainId;
  from: Address;
  method: "personal_sign" | "eth_signTypedData" | "eth_signTypedData_v3" | "eth_signTypedData_v4";
  /** Raw message for personal_sign; JSON-encoded EIP-712 typed data otherwise. */
  data: string;
  /** Origin of the site requesting the signature, when the wallet exposes it (e.g. Snap's signatureOrigin). */
  origin?: string;
}

export interface AnalyzeSignatureRequest {
  sig: SignatureRequest;
  autonomy?: Autonomy;
}

/** Categories of community-reported threats. */
export type ThreatCategory =
  | "drainer"
  | "phishing"
  | "malicious-contract"
  | "honeypot"
  | "sanctioned"
  | "decoy-tripwire";

/** An entry in the community threat feed. */
export interface ThreatEntry {
  address: Address;
  category: ThreatCategory;
  /** Distinct reporter count. */
  reports: number;
  /** True once `reports` crosses the quorum threshold. */
  quorumReached: boolean;
  firstSeen: number;
  lastSeen: number;
}

export interface ReportRequest {
  address: Address;
  category: ThreatCategory;
  /** Stable pseudonymous id of the reporter (device/agent), for quorum counting. */
  reporterId: string;
  /** Optional: detailed description of the threat. */
  description?: string;
  /** Optional: URL to evidence (screenshot, tweet, blockchain explorer). */
  evidenceUrl?: string;
  /** Optional: estimated number of victims affected. */
  victimCount?: number;
  /** Optional: chains this threat operates on (Ethereum, Polygon, Arbitrum, etc.). */
  impactedChains?: string[];
  /** Optional: reporter's email for follow-up on major incidents. */
  reporterEmail?: string;
  /** Optional: reporter's display name for leaderboard. */
  reporterName?: string;
}

export interface Contributor {
  reporterId: string;
  displayName: string | null;
  avatar: string;
  totalReports: number;
  reputationScore: number;
  badges: string[];
  status: "active" | "inactive" | "banned";
  lastReportAt: string | null;
  createdAt: string;
}

export interface LeaderboardEntry extends Contributor {
  rank: number;
}

/** Maps a severity to its contribution to the 0..100 risk score. */
export const SEVERITY_SCORE: Record<Severity, number> = {
  info: 0,
  low: 15,
  medium: 40,
  high: 70,
  critical: 100,
};

/** Number of distinct reporters required before a threat is treated as confirmed. */
export const DEFAULT_QUORUM = 3;

/** ERC-20/increaseAllowance amount at/above this is treated as "unlimited". */
export const UNLIMITED_THRESHOLD =
  BigInt(2) ** BigInt(255); // half of max-uint256; comfortably "infinite" in practice

// Re-export API configuration and security policies
export * from "./api-config.js";

// Re-export SDK client
export * from "./sdk-client.js";
