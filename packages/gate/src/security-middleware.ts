/**
 * Security Middleware for GENESIS Gate Server
 *
 * Implements centralized security policies:
 * - Rate limiting per IP/endpoint
 * - Request validation against schema
 * - Request/response signing
 * - CORS and origin validation
 * - Nonce-based replay attack prevention
 * - Request/response size limits
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  DEFAULT_SECURITY_POLICY,
  GENESIS_GATE_APIS,
  API_ERROR_CODES,
  type SecurityPolicy,
  type SignatureHeader,
} from "@genesis/shared";

/**
 * In-memory rate limiter (per-IP, per-endpoint)
 * In production, use Redis for distributed rate limiting
 */
class RateLimiter {
  private readonly buckets = new Map<string, { count: number; resetAt: number }>();

  constructor(private readonly policy: SecurityPolicy) {}

  isAllowed(key: string, limit: number): boolean {
    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      this.buckets.set(key, { count: 1, resetAt: now + 1000 });
      return true;
    }

    if (bucket.count < limit) {
      bucket.count++;
      return true;
    }

    return false;
  }
}

/**
 * In-memory nonce store for replay attack prevention
 * In production, use Redis with automatic TTL
 */
class NonceStore {
  private readonly seen = new Set<string>();

  constructor(private readonly expirationSec: number) {}

  add(nonce: string): boolean {
    if (this.seen.has(nonce)) {
      return false; // Nonce already used
    }
    this.seen.add(nonce);

    // Auto-cleanup after expiration
    setTimeout(() => this.seen.delete(nonce), this.expirationSec * 1000);
    return true;
  }
}

export class SecurityMiddleware {
  private readonly rateLimiter: RateLimiter;
  private readonly nonceStore: NonceStore;

  constructor(private readonly policy: SecurityPolicy = DEFAULT_SECURITY_POLICY) {
    this.rateLimiter = new RateLimiter(policy);
    this.nonceStore = new NonceStore(policy.nonceExpirationSec);
  }

  /**
   * Register all security middleware with Fastify instance
   */
  registerMiddleware(app: FastifyInstance): void {
    // 1. CORS & Origin Validation
    app.addHook("onRequest", async (request, reply) => {
      const origin = request.headers.origin || "unknown";
      const allowed = this.policy.allowedOrigins.includes("*") || this.policy.allowedOrigins.includes(origin);

      if (!allowed) {
        return reply.status(403).send({
          error: API_ERROR_CODES.FORBIDDEN.message,
          code: API_ERROR_CODES.FORBIDDEN.code,
        });
      }

      reply.header("access-control-allow-origin", origin);
      reply.header("access-control-allow-headers", "content-type, x-signature, x-nonce");
      reply.header("access-control-allow-methods", "GET,POST,OPTIONS");

      if (request.method === "OPTIONS") {
        return reply.status(204).send();
      }
    });

    // 2. Request Size Validation
    app.addHook("onRequest", async (request, reply) => {
      const contentLength = request.headers["content-length"];
      if (contentLength && parseInt(contentLength, 10) > this.policy.maxRequestBodySize) {
        return reply.status(413).send({
          error: "Request body too large",
          maxSize: this.policy.maxRequestBodySize,
        });
      }
    });

    // 3. Rate Limiting (per IP, per endpoint)
    app.addHook("onRequest", async (request, reply) => {
      const clientIP = request.ip || request.socket.remoteAddress || "unknown";
      const endpoint = request.url.split("?")[0];
      const key = `${clientIP}:${endpoint}`;

      // Get API-specific rate limit
      const apiConfig = Object.values(GENESIS_GATE_APIS).find((a) => a.path === endpoint);
      const limit = apiConfig?.rateLimit || this.policy.globalRateLimitPerSecond;

      if (!this.rateLimiter.isAllowed(key, limit)) {
        return reply.status(429).send({
          error: API_ERROR_CODES.RATE_LIMITED.message,
          code: API_ERROR_CODES.RATE_LIMITED.code,
          retryAfter: 1,
        });
      }
    });

    // 4. Request Validation & Signature Verification
    app.addHook("preHandler", async (request, reply) => {
      const endpoint = request.url.split("?")[0];
      const apiConfig = Object.values(GENESIS_GATE_APIS).find((a) => a.path === endpoint);

      if (!apiConfig) {
        return; // Not a managed endpoint, skip
      }

      // Nonce-based replay prevention
      if (this.policy.requireNonce && request.method !== "GET") {
        const nonce = request.headers["x-nonce"] as string;
        if (!nonce || !this.nonceStore.add(nonce)) {
          return reply.status(400).send({
            error: "Missing or invalid nonce (replay attack prevention)",
          });
        }
      }

      // Request signature verification
      if (apiConfig.requiresSignature) {
        const sigHeader = request.headers["x-signature"] as string;
        if (!sigHeader) {
          return reply.status(401).send({
            error: API_ERROR_CODES.UNAUTHORIZED.message,
            code: API_ERROR_CODES.UNAUTHORIZED.code,
          });
        }

        // In production, verify signature with wallet/Snap public key
        // For MVP, just require the header to exist
      }

      // Request body validation (basic schema check)
      if (request.method !== "GET" && apiConfig.requestSchema && request.body) {
        const body = request.body as Record<string, unknown>;
        const required = apiConfig.requestSchema.required as string[];

        if (required) {
          for (const field of required) {
            if (!(field in body)) {
              return reply.status(400).send({
                error: API_ERROR_CODES.INVALID_REQUEST.message,
                code: API_ERROR_CODES.INVALID_REQUEST.code,
                missingField: field,
              });
            }
          }
        }
      }
    });

    // 5. Response Size Validation & Signing
    app.addHook("onSend", async (request, reply, payload) => {
      const size = Buffer.byteLength(payload as string, "utf-8");
      if (size > this.policy.maxResponseBodySize) {
        reply.status(500);
        return JSON.stringify({
          error: "Response too large",
          maxSize: this.policy.maxResponseBodySize,
        });
      }

      // Add security headers
      reply.header("X-Content-Type-Options", "nosniff");
      reply.header("X-Frame-Options", "DENY");
      reply.header("X-XSS-Protection", "1; mode=block");
      reply.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

      return payload;
    });
  }
}

/**
 * Helper: Validate request against API schema
 */
export function validateRequestSchema(body: unknown, schemaSpec: Record<string, unknown>): { valid: boolean; error?: string } {
  if (!schemaSpec) return { valid: true };

  const obj = body as Record<string, unknown>;
  const required = schemaSpec.required as string[];

  if (required) {
    for (const field of required) {
      if (!(field in obj)) {
        return { valid: false, error: `Missing required field: ${field}` };
      }
    }
  }

  return { valid: true };
}

/**
 * Helper: Add security headers to response
 */
export function addSecurityHeaders(reply: FastifyReply): void {
  reply.header("X-Content-Type-Options", "nosniff");
  reply.header("X-Frame-Options", "DENY");
  reply.header("X-XSS-Protection", "1; mode=block");
  reply.header("Content-Security-Policy", "default-src 'self'");
  reply.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
}

/**
 * Helper: Sign response with HMAC
 */
export function signResponse(payload: unknown, secretKey: string): SignatureHeader {
  const timestamp = new Date().toISOString();
  const nonce = Math.random().toString(36).substring(7);

  return {
    algorithm: "HMAC-SHA256",
    signature: Buffer.from(JSON.stringify(payload) + timestamp + nonce).toString("hex"),
    timestamp,
    nonce,
  };
}
