/**
 * Security Middleware for GENESIS Gate
 * 
 * Implements:
 * - API key authentication for sensitive endpoints
 * - Input validation for all request bodies
 * - Rate limiting to prevent DoS
 * - Security headers for HTTPS, CSP, etc.
 */

import crypto from "crypto";
import { isAddress } from "viem";

// ============================================================================
// 1. API KEY MANAGEMENT
// ============================================================================

/**
 * Load authorized API keys from environment variable.
 * Format: GENESIS_API_KEYS=key1,key2,key3
 * 
 * For public beta, generate keys with:
 *   node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
 */
export function loadApiKeys(): Set<string> {
  const keysStr = process.env.GENESIS_API_KEYS || "";
  if (!keysStr.trim()) {
    console.warn("[security] WARNING: GENESIS_API_KEYS not set. /v1/report will reject all requests.");
    return new Set();
  }

  const keys = keysStr
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 0);

  console.log(`[security] Loaded ${keys.length} API keys`);
  return new Set(keys);
}

/**
 * Generate a new API key for a user.
 * Should be called during user signup.
 */
export function generateApiKey(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Validate an API key against the authorized set.
 */
export function isValidApiKey(key: string, authorizedKeys: Set<string>): boolean {
  return authorizedKeys.has(key);
}

// ============================================================================
// 2. INPUT VALIDATION
// ============================================================================

export interface ValidationError {
  field: string;
  error: string;
}

/**
 * Validate Ethereum address format.
 */
export function isValidEthAddress(addr: unknown): addr is string {
  if (typeof addr !== "string") return false;
  return /^0x[a-f0-9]{40}$/i.test(addr);
}

/**
 * Validate transaction category.
 */
export function isValidCategory(cat: unknown): cat is string {
  if (typeof cat !== "string") return false;
  const valid = ["phishing", "drainer", "malicious-contract", "decoy-tripwire"];
  return valid.includes(cat.toLowerCase());
}

/**
 * Validate chain ID.
 */
export function isValidChainId(id: unknown): id is number {
  return typeof id === "number" && id > 0 && Number.isInteger(id);
}

/**
 * Validate hex string (0x-prefixed).
 */
export function isValidHex(hex: unknown): hex is string {
  if (typeof hex !== "string") return false;
  return /^0x[0-9a-fA-F]*$/.test(hex);
}

/**
 * Validate reporter ID.
 * Requirements: Non-empty, max 100 chars, alphanumeric + common separators.
 */
export function isValidReporterId(id: unknown): id is string {
  if (typeof id !== "string") return false;
  if (id.length < 1 || id.length > 100) return false;
  // Allow: alphanumeric, hyphens, underscores, dots
  return /^[a-zA-Z0-9._-]+$/.test(id);
}

/**
 * Validate transaction request body.
 */
export function validateAnalyzeRequest(body: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!body || typeof body !== "object") {
    errors.push({ field: "body", error: "Request body must be a JSON object" });
    return errors;
  }

  const req = body as any;

  // Validate tx object exists
  if (!req.tx || typeof req.tx !== "object") {
    errors.push({ field: "tx", error: "tx field is required and must be an object" });
    return errors;
  }

  const tx = req.tx;

  // Validate chainId
  if (!isValidChainId(tx.chainId)) {
    errors.push({ field: "tx.chainId", error: "chainId must be a positive integer" });
  }

  // Validate from address (required)
  if (!isValidEthAddress(tx.from)) {
    errors.push({
      field: "tx.from",
      error: `Invalid 'from' address: must be 0x-prefixed 40 hex chars. Got: ${tx.from ?? "(missing)"}`,
    });
  }

  // Validate to address (optional, but if present must be valid)
  if (tx.to !== undefined && tx.to !== null && !isValidEthAddress(tx.to)) {
    errors.push({
      field: "tx.to",
      error: `Invalid 'to' address: must be 0x-prefixed 40 hex chars or null. Got: ${tx.to}`,
    });
  }

  // Validate value (optional; defaults to 0 when omitted, but if present must be a string or number)
  if (tx.value !== undefined && tx.value !== null) {
    if (typeof tx.value !== "string" && typeof tx.value !== "number") {
      errors.push({
        field: "tx.value",
        error: `Invalid 'value': must be a string or number. Got: ${typeof tx.value}`,
      });
    } else if (typeof tx.value === "string" && !isValidHex(tx.value) && isNaN(Number(tx.value))) {
      errors.push({
        field: "tx.value",
        error: `Invalid 'value': must be hex (0x...) or decimal number. Got: ${tx.value}`,
      });
    }
  }

  // Validate data (optional, but if present must be hex)
  if (tx.data !== undefined && tx.data !== null && !isValidHex(tx.data)) {
    errors.push({
      field: "tx.data",
      error: `Invalid 'data': must be 0x-prefixed hex string. Got: ${tx.data}`,
    });
  }

  return errors;
}

/**
 * Validate threat report body.
 */
export function validateReportRequest(body: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!body || typeof body !== "object") {
    errors.push({ field: "body", error: "Request body must be a JSON object" });
    return errors;
  }

  const req = body as any;

  // Validate address
  if (!isValidEthAddress(req.address)) {
    errors.push({
      field: "address",
      error: `Invalid address: must be 0x-prefixed 40 hex chars. Got: ${req.address ?? "(missing)"}`,
    });
  }

  // Validate category
  if (!isValidCategory(req.category)) {
    errors.push({
      field: "category",
      error: `Invalid category: must be one of phishing, drainer, malicious-contract, decoy-tripwire. Got: ${
        req.category ?? "(missing)"
      }`,
    });
  }

  // Validate reporterId
  if (!isValidReporterId(req.reporterId)) {
    errors.push({
      field: "reporterId",
      error: `Invalid reporterId: must be alphanumeric + "-_.". Got: ${req.reporterId ?? "(missing)"}`,
    });
  }

  // Validate optional description
  if (req.description !== undefined && req.description !== null) {
    if (typeof req.description !== "string") {
      errors.push({
        field: "description",
        error: `Invalid description: must be a string. Got: ${typeof req.description}`,
      });
    } else if (req.description.length > 1000) {
      errors.push({
        field: "description",
        error: `description too long: max 1000 chars. Got: ${req.description.length}`,
      });
    }
  }

  // Validate optional evidenceUrl
  if (req.evidenceUrl !== undefined && req.evidenceUrl !== null) {
    if (typeof req.evidenceUrl !== "string") {
      errors.push({
        field: "evidenceUrl",
        error: `Invalid evidenceUrl: must be a string`,
      });
    } else if (!req.evidenceUrl.startsWith("http://") && !req.evidenceUrl.startsWith("https://")) {
      errors.push({
        field: "evidenceUrl",
        error: `Invalid evidenceUrl: must start with http:// or https://`,
      });
    }
  }

  // Validate optional victimCount
  if (req.victimCount !== undefined && req.victimCount !== null) {
    if (!Number.isInteger(req.victimCount) || req.victimCount < 0) {
      errors.push({
        field: "victimCount",
        error: `Invalid victimCount: must be a non-negative integer`,
      });
    }
  }

  // Validate optional impactedChains
  if (req.impactedChains !== undefined && req.impactedChains !== null) {
    if (!Array.isArray(req.impactedChains)) {
      errors.push({
        field: "impactedChains",
        error: `Invalid impactedChains: must be an array of strings`,
      });
    } else {
      for (let i = 0; i < req.impactedChains.length; i++) {
        if (typeof req.impactedChains[i] !== "string") {
          errors.push({
            field: `impactedChains[${i}]`,
            error: `must be a string`,
          });
        }
      }
    }
  }

  // Validate optional reporterEmail
  if (req.reporterEmail !== undefined && req.reporterEmail !== null) {
    if (typeof req.reporterEmail !== "string") {
      errors.push({
        field: "reporterEmail",
        error: `Invalid reporterEmail: must be a string`,
      });
    } else if (!req.reporterEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.push({
        field: "reporterEmail",
        error: `Invalid reporterEmail: must be a valid email address`,
      });
    }
  }

  // Validate optional reporterName
  if (req.reporterName !== undefined && req.reporterName !== null) {
    if (typeof req.reporterName !== "string") {
      errors.push({
        field: "reporterName",
        error: `Invalid reporterName: must be a string`,
      });
    } else if (req.reporterName.length > 100) {
      errors.push({
        field: "reporterName",
        error: `reporterName too long: max 100 chars`,
      });
    }
  }

  return errors;
}

// ============================================================================
// 3. RATE LIMITING (Simple, in-memory)
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class SimpleRateLimiter {
  private limiters = new Map<string, RateLimitEntry>();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if request is within rate limit.
   * Returns: { allowed: boolean, remaining: number, resetAt: number }
   */
  check(key: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = this.limiters.get(key);

    if (!entry || now >= entry.resetAt) {
      // New window
      this.limiters.set(key, { count: 1, resetAt: now + this.windowMs });
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetAt: now + this.windowMs,
      };
    }

    if (entry.count < this.maxRequests) {
      entry.count++;
      return {
        allowed: true,
        remaining: this.maxRequests - entry.count,
        resetAt: entry.resetAt,
      };
    }

    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limiters.entries()) {
      if (now >= entry.resetAt) {
        this.limiters.delete(key);
      }
    }
  }
}

// ============================================================================
// 4. MIDDLEWARE FACTORIES
// ============================================================================

/**
 * Create Fastify middleware for API key validation.
 * 
 * Usage:
 *   const apiKeyMiddleware = createApiKeyMiddleware(apiKeys);
 *   app.post("/v1/report", { onRequest: apiKeyMiddleware }, handler);
 */
export function createApiKeyMiddleware(authorizedKeys: Set<string>) {
  return async (request: any, reply: any) => {
    const apiKey = request.headers["x-api-key"];

    if (!apiKey) {
      return reply.status(401).send({
        error: "Unauthorized: Missing X-API-Key header",
      });
    }

    if (!isValidApiKey(apiKey as string, authorizedKeys)) {
      return reply.status(401).send({
        error: "Unauthorized: Invalid API key",
      });
    }

    // Attach to request for logging
    (request as any).user = { apiKey };
  };
}

/**
 * Create Fastify middleware for rate limiting.
 * 
 * Usage:
 *   const limiter = new SimpleRateLimiter(100, 15 * 60 * 1000);
 *   const rateLimitMiddleware = createRateLimitMiddleware(limiter);
 *   app.post("/v1/report", { onRequest: rateLimitMiddleware }, handler);
 */
export function createRateLimitMiddleware(limiter: SimpleRateLimiter, keyExtractor?: (req: any) => string) {
  return async (request: any, reply: any) => {
    // Use IP address by default, or custom key
    const key = keyExtractor
      ? keyExtractor(request)
      : request.headers["x-forwarded-for"] || request.ip || "unknown";

    const result = limiter.check(key);

    // Always set headers
    reply.header("X-RateLimit-Limit", String(100)); // Max requests
    reply.header("X-RateLimit-Remaining", String(result.remaining));
    reply.header("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));

    if (!result.allowed) {
      return reply.status(429).send({
        error: "Too many requests",
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
      });
    }
  };
}

// ============================================================================
// 5. SECURITY HEADERS
// ============================================================================

export const SECURITY_HEADERS = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), document-domain=(), encrypted-media=(), execution-while-not-rendered=(), execution-while-out-of-viewport=(), fullscreen=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), navigation-override=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), sync-xhr=(), usb=(), xr-spatial-tracking=(), geolocation=()",
};

/**
 * Create Fastify middleware to add security headers.
 */
export function createSecurityHeadersMiddleware() {
  return async (_request: any, reply: any) => {
    Object.entries(SECURITY_HEADERS).forEach(([header, value]) => {
      reply.header(header, value);
    });
  };
}
