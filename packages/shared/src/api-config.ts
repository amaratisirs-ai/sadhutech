/**
 * Centralized API Configuration & Security Policy
 *
 * This file defines:
 * 1. All internal GENESIS APIs (gate service, community reports)
 * 2. All external threat feed integrations (Amber, 0xScope, etc)
 * 3. Security controls: auth, rate limiting, request validation, encryption
 * 4. Request/response signing and verification
 * 5. API versioning and backward compatibility
 */

import type { AnalyzeRequest, ReportRequest, RiskAssessment, ThreatEntry } from "./index.js";

/* ─────────────────────────────────────────────────────────────────────────
   PART 1: INTERNAL GENESIS GATE APIs
   ───────────────────────────────────────────────────────────────────────── */

export interface GatAPIConfig {
  name: string;
  description: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  version: string;
  /** Authentication required */
  requiresAuth: boolean;
  /** Auth type: "none", "api-key", "jwt", "snap-signature" */
  authType: "none" | "api-key" | "jwt" | "snap-signature";
  /** Rate limit: requests per second */
  rateLimit: number;
  /** Request payload validation rules */
  requestSchema: Record<string, unknown>;
  /** Response payload type */
  responseType: string;
  /** Whether to sign/verify requests with HMAC or ECC */
  requiresSignature: boolean;
  /** Whether response should be encrypted */
  encryptResponse: boolean;
  /** Timeout in milliseconds */
  timeoutMs: number;
}

export const GENESIS_GATE_APIS: Record<string, GatAPIConfig> = {
  ANALYZE: {
    name: "Transaction Analysis",
    description: "Pre-sign risk assessment of a transaction",
    method: "POST",
    path: "/v1/analyze",
    version: "1.0",
    requiresAuth: false,
    authType: "none",
    rateLimit: 10, // 10 requests/sec per IP
    requestSchema: {
      tx: {
        type: "object",
        required: ["chainId", "from", "to"],
        properties: {
          chainId: { type: "number" },
          from: { type: "string", pattern: "^0x[0-9a-fA-F]{40}$" },
          to: { type: "string", pattern: "^0x[0-9a-fA-F]{40}$" },
          value: { type: "string" },
          data: { type: "string", pattern: "^0x[0-9a-fA-F]*$" },
        },
      },
      autonomy: { type: "string", enum: ["observe", "warn", "enforce"] },
    },
    responseType: "RiskAssessment",
    requiresSignature: false,
    encryptResponse: false,
    timeoutMs: 5000,
  },

  REPORT: {
    name: "Submit Threat Report",
    description: "Community member reports a malicious address",
    method: "POST",
    path: "/v1/report",
    version: "1.0",
    requiresAuth: false,
    authType: "snap-signature",
    rateLimit: 1, // 1 report/sec per reporter
    requestSchema: {
      address: { type: "string", pattern: "^0x[0-9a-fA-F]{40}$" },
      category: {
        type: "string",
        enum: ["drainer", "phishing", "malicious-contract", "honeypot", "sanctioned", "decoy-tripwire"],
      },
      reporterId: { type: "string", minLength: 10 },
    },
    responseType: "ThreatEntry",
    requiresSignature: true, // Must be signed by reporter's Snap
    encryptResponse: false,
    timeoutMs: 2000,
  },

  HEALTH: {
    name: "Health Check",
    description: "Service availability and status",
    method: "GET",
    path: "/health",
    version: "1.0",
    requiresAuth: false,
    authType: "none",
    rateLimit: 100,
    requestSchema: {},
    responseType: "{ status: string; service: string }",
    requiresSignature: false,
    encryptResponse: false,
    timeoutMs: 1000,
  },

  ANALYZE_SIGNATURE: {
    name: "Signature Analysis",
    description: "Pre-sign risk assessment of an off-chain signature request (personal_sign / eth_signTypedData*)",
    method: "POST",
    path: "/v1/analyze-signature",
    version: "1.0",
    requiresAuth: false,
    authType: "none",
    rateLimit: 10,
    requestSchema: {
      sig: {
        type: "object",
        required: ["chainId", "from", "method", "data"],
        properties: {
          chainId: { type: "number" },
          from: { type: "string", pattern: "^0x[0-9a-fA-F]{40}$" },
          method: { type: "string", enum: ["personal_sign", "eth_signTypedData", "eth_signTypedData_v3", "eth_signTypedData_v4"] },
          data: { type: "string" },
          origin: { type: "string" },
        },
      },
    },
    responseType: "RiskAssessment",
    requiresSignature: false,
    encryptResponse: false,
    timeoutMs: 5000,
  },

  PRO_STATUS: {
    name: "Pro Credit Status",
    description: "Look up a wallet's deep-check credit balance",
    method: "GET",
    path: "/v1/pro/status/:address",
    version: "1.0",
    requiresAuth: false,
    authType: "none",
    rateLimit: 20,
    requestSchema: {},
    responseType: "{ credits: number; premium: boolean }",
    requiresSignature: false,
    encryptResponse: false,
    timeoutMs: 3000,
  },

  PRO_VERIFY: {
    name: "Pro Payment Verify",
    description: "Confirm a USDC-on-Base payment and credit the paying wallet",
    method: "POST",
    path: "/v1/pro/verify",
    version: "1.0",
    requiresAuth: false,
    authType: "none",
    rateLimit: 5,
    requestSchema: {
      address: { type: "string", pattern: "^0x[0-9a-fA-F]{40}$" },
    },
    responseType: "VerifyResult",
    requiresSignature: false,
    encryptResponse: false,
    timeoutMs: 10000,
  },

  THREATS_LATEST: {
    name: "Recent Threats Feed",
    description: "Paginated recent threat-intel entries for the /threats and /news pages",
    method: "GET",
    path: "/v1/threats/latest",
    version: "1.0",
    requiresAuth: false,
    authType: "none",
    rateLimit: 20,
    requestSchema: {
      limit: { type: "number" },
      offset: { type: "number" },
      hours: { type: "number" },
    },
    responseType: "ThreatEntry[]",
    requiresSignature: false,
    encryptResponse: false,
    timeoutMs: 5000,
  },
};

/* ─────────────────────────────────────────────────────────────────────────
   PART 2: EXTERNAL THREAT FEED INTEGRATIONS
   ───────────────────────────────────────────────────────────────────────── */

export interface ThreatFeedConfig {
  name: string;
  description: string;
  baseUrl: string;
  /** API endpoint path */
  endpoint: string;
  /** HTTP method */
  method: "GET" | "POST";
  /** Authentication type: "none", "api-key", "oauth2", "basic" */
  authType: "none" | "api-key" | "oauth2" | "basic";
  /** API key env var name */
  apiKeyEnv?: string;
  /** Rate limit: requests per minute */
  rateLimitPerMin: number;
  /** Query parameter names */
  queryParams: Record<string, string>;
  /** Response format: "json", "csv", "ndjson" */
  responseFormat: "json" | "csv" | "ndjson";
  /** How to extract threat addresses from response */
  addressField: string;
  /** How to extract threat category from response */
  categoryField: string;
  /** Update frequency: how often to sync (hours) */
  syncIntervalHours: number;
  /** Priority: used in quorum weighting (0-100) */
  trustScore: number;
  /** Whether feed is currently enabled */
  enabled: boolean;
}

export const THREAT_FEEDS: Record<string, ThreatFeedConfig> = {
  AMBER_ALERTS: {
    name: "Amber Alerts (Scam Sniffer)",
    description: "Real-time community-sourced scam and drainer alerts",
    baseUrl: "https://api.scamsniffer.io",
    endpoint: "/api/v1/alerts",
    method: "GET",
    authType: "api-key",
    apiKeyEnv: "SCAMSNIFFER_API_KEY",
    rateLimitPerMin: 60,
    queryParams: {
      type: "drainer,phishing",
      limit: "1000",
      sortBy: "timestamp_desc",
    },
    responseFormat: "json",
    addressField: "contractAddress",
    categoryField: "type",
    syncIntervalHours: 1,
    trustScore: 85,
    enabled: true,
  },

  REKT_DATABASE: {
    name: "Rekt Database",
    description: "Comprehensive rug-pull and exploit database",
    baseUrl: "https://rekt.news/api",
    endpoint: "/v1/exploits",
    method: "GET",
    authType: "none",
    rateLimitPerMin: 30,
    queryParams: {
      format: "json",
      limit: "500",
    },
    responseFormat: "json",
    addressField: "address",
    categoryField: "exploitType",
    syncIntervalHours: 6,
    trustScore: 90,
    enabled: true,
  },

  OXSCOPE_MEV: {
    name: "0xScope (MEV Trackers)",
    description: "MEV extractors, sandwich attackers, and exploiters",
    baseUrl: "https://api.0xscope.io",
    endpoint: "/v1/attackers",
    method: "GET",
    authType: "api-key",
    apiKeyEnv: "OXSCOPE_API_KEY",
    rateLimitPerMin: 60,
    queryParams: {
      type: "mev,sandwich,flashbot",
      minSamples: "50",
    },
    responseFormat: "json",
    addressField: "address",
    categoryField: "attackType",
    syncIntervalHours: 2,
    trustScore: 75,
    enabled: true,
  },

  CHAINALYSIS: {
    name: "Chainalysis Public Reports",
    description: "Institutional-grade threat intelligence (optional paid tier)",
    baseUrl: "https://api.chainalysis.com",
    endpoint: "/v1/threats",
    method: "GET",
    authType: "api-key",
    apiKeyEnv: "CHAINALYSIS_API_KEY",
    rateLimitPerMin: 30,
    queryParams: {
      category: "ransomware,stolen_funds,sanctions",
    },
    responseFormat: "json",
    addressField: "address",
    categoryField: "category",
    syncIntervalHours: 12,
    trustScore: 95,
    enabled: false, // Disabled by default (paid); enable with API key
  },

  ETHERSCAN_VERIFIED_SCAMS: {
    name: "Etherscan Verified Scams",
    description: "Etherscan's community-maintained scam address list",
    baseUrl: "https://api.etherscan.io",
    endpoint: "/api",
    method: "GET",
    authType: "api-key",
    apiKeyEnv: "ETHERSCAN_API_KEY",
    rateLimitPerMin: 5,
    queryParams: {
      module: "account",
      action: "getminedblocks",
    },
    responseFormat: "json",
    addressField: "scamAddress",
    categoryField: "scamType",
    syncIntervalHours: 24,
    trustScore: 70,
    enabled: true,
  },

  CHAIN_ABUSE: {
    name: "Abuse.ch Chain Abuse",
    description: "Malware and abuse tracker (blockchain bridges, contracts)",
    baseUrl: "https://api.abuse.ch",
    endpoint: "/v1/ethereum/scams",
    method: "GET",
    authType: "none",
    rateLimitPerMin: 20,
    queryParams: {},
    responseFormat: "json",
    addressField: "address",
    categoryField: "type",
    syncIntervalHours: 6,
    trustScore: 80,
    enabled: true,
  },
};

/* ─────────────────────────────────────────────────────────────────────────
   PART 3: SECURITY POLICIES & REQUEST/RESPONSE SIGNING
   ───────────────────────────────────────────────────────────────────────── */

export interface SecurityPolicy {
  /** Global rate limit: requests per second per IP */
  globalRateLimitPerSecond: number;
  /** Maximum request body size in bytes */
  maxRequestBodySize: number;
  /** Maximum response body size in bytes */
  maxResponseBodySize: number;
  /** Require HTTPS (in production) */
  requireHttps: boolean;
  /** Require request signature (HMAC-SHA256) */
  requireRequestSignature: boolean;
  /** Require response signature */
  requireResponseSignature: boolean;
  /** Encrypt sensitive fields in response (AES-256-GCM) */
  encryptSensitiveFields: boolean;
  /** Allowed CORS origins */
  allowedOrigins: string[];
  /** Require nonce to prevent replay attacks */
  requireNonce: boolean;
  /** Nonce expiration time in seconds */
  nonceExpirationSec: number;
}

export const DEFAULT_SECURITY_POLICY: SecurityPolicy = {
  globalRateLimitPerSecond: 100,
  maxRequestBodySize: 10 * 1024, // 10 KB
  maxResponseBodySize: 100 * 1024, // 100 KB
  requireHttps: true, // In production
  requireRequestSignature: false, // Optional for /v1/analyze
  requireResponseSignature: false,
  encryptSensitiveFields: false,
  allowedOrigins: ["*"], // Permissive for MVP; tighten in production
  requireNonce: true,
  nonceExpirationSec: 300, // 5 minutes
};

/* ─────────────────────────────────────────────────────────────────────────
   PART 4: REQUEST/RESPONSE SIGNING (HMAC & ECC)
   ───────────────────────────────────────────────────────────────────────── */

export interface SignatureHeader {
  /** Signature algorithm: "HMAC-SHA256", "ECC-P256", "ECC-Secp256k1" */
  algorithm: "HMAC-SHA256" | "ECC-P256" | "ECC-Secp256k1";
  /** Signature hex string */
  signature: string;
  /** Public key (for ECC verification) */
  publicKey?: string;
  /** Request timestamp (ISO 8601) */
  timestamp: string;
  /** Nonce for replay attack prevention */
  nonce?: string;
}

/**
 * Signs a request body with HMAC-SHA256
 * Usage: X-Signature: <signature>
 */
export function signRequest(
  payload: unknown,
  secretKey: string,
  algorithm: "HMAC-SHA256" = "HMAC-SHA256"
): SignatureHeader {
  const timestamp = new Date().toISOString();
  const nonce = Math.random().toString(36).substring(7);
  const message = JSON.stringify({
    payload,
    timestamp,
    nonce,
  });

  // In production, use crypto.createHmac("sha256", secretKey)
  const signature = Buffer.from(message).toString("hex"); // Placeholder

  return {
    algorithm,
    signature,
    timestamp,
    nonce,
  };
}

/**
 * Verifies request signature
 */
export function verifyRequestSignature(
  payload: unknown,
  signature: SignatureHeader,
  secretKey: string
): boolean {
  const message = JSON.stringify({
    payload,
    timestamp: signature.timestamp,
    nonce: signature.nonce,
  });

  // In production, use crypto.createHmac("sha256", secretKey)
  const expectedSignature = Buffer.from(message).toString("hex");
  return signature.signature === expectedSignature;
}

/* ─────────────────────────────────────────────────────────────────────────
   PART 5: CLIENT SDK CONFIGURATION
   ───────────────────────────────────────────────────────────────────────── */

export interface ClientSDKConfig {
  /** GENESIS Gate service base URL */
  gateUrl: string;
  /** Timeout for gate requests (ms) */
  gateTimeoutMs: number;
  /** Whether to cache threat intel locally */
  cacheThreatsLocally: boolean;
  /** Threat cache TTL in minutes */
  cacheTTLMinutes: number;
  /** Whether to sign requests with wallet */
  signRequests: boolean;
  /** Autonomy level: "observe" (log only), "warn" (notify), "enforce" (block) */
  autonomy: "observe" | "warn" | "enforce";
  /** Retry policy: number of retries */
  maxRetries: number;
  /** Backoff strategy: "exponential" or "linear" */
  retryBackoffMs: number;
}

export const DEFAULT_CLIENT_SDK_CONFIG: ClientSDKConfig = {
  gateUrl: process.env.GENESIS_GATE_URL || "http://localhost:8787",
  gateTimeoutMs: 5000,
  cacheThreatsLocally: true,
  cacheTTLMinutes: 60,
  signRequests: false,
  autonomy: "observe",
  maxRetries: 3,
  retryBackoffMs: 100,
};

/* ─────────────────────────────────────────────────────────────────────────
   PART 6: ERROR CODES & HTTP STATUS MAPPING
   ───────────────────────────────────────────────────────────────────────── */

export const API_ERROR_CODES = {
  INVALID_REQUEST: {
    code: "INVALID_REQUEST",
    status: 400,
    message: "Request validation failed",
  },
  RATE_LIMITED: {
    code: "RATE_LIMITED",
    status: 429,
    message: "Too many requests",
  },
  UNAUTHORIZED: {
    code: "UNAUTHORIZED",
    status: 401,
    message: "Authentication required",
  },
  FORBIDDEN: {
    code: "FORBIDDEN",
    status: 403,
    message: "Access denied",
  },
  NOT_FOUND: {
    code: "NOT_FOUND",
    status: 404,
    message: "Resource not found",
  },
  TIMEOUT: {
    code: "TIMEOUT",
    status: 504,
    message: "Request timeout",
  },
  INTERNAL_ERROR: {
    code: "INTERNAL_ERROR",
    status: 500,
    message: "Internal server error",
  },
  SERVICE_UNAVAILABLE: {
    code: "SERVICE_UNAVAILABLE",
    status: 503,
    message: "Service temporarily unavailable",
  },
};

/* ─────────────────────────────────────────────────────────────────────────
   PART 7: MONITORING & TELEMETRY
   ───────────────────────────────────────────────────────────────────────── */

export interface APIMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  requestSize: number;
  responseSize: number;
  timestamp: string;
  clientIP?: string;
  userId?: string;
  error?: string;
}

export const METRICS_COLLECTION = {
  enabled: true,
  endpoint: process.env.METRICS_ENDPOINT || "http://localhost:3001/metrics",
  flushIntervalMs: 10000,
  batchSize: 100,
};
