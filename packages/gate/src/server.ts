import Fastify from "fastify";
import { isAddress } from "viem";
import type { AnalyzeRequest, ReportRequest } from "@genesis/shared";
import { analyze } from "./analyze.js";
import { createIntelAsync } from "./index.js";
import { TESTER_HTML } from "./ui.js";
import { initSyncService } from "./sync-external-threats.js";
import type { ThreatIntelPostgres } from "./intel-postgres.js";
import {
  loadApiKeys,
  createApiKeyMiddleware,
  createRateLimitMiddleware,
  createSecurityHeadersMiddleware,
  SimpleRateLimiter,
  validateAnalyzeRequest,
  validateReportRequest,
} from "./security.js";

const app = Fastify({ logger: true });

// Load API keys from environment
const authorizedApiKeys = loadApiKeys();

// Initialize rate limiter: 100 requests per 15 minutes per IP
const rateLimiter = new SimpleRateLimiter(100, 15 * 60 * 1000);

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

// 1. Add security headers to all responses
app.addHook("onRequest", createSecurityHeadersMiddleware());

// 2. Handle CORS (restricted origin, not "*")
app.addHook("onRequest", async (req, reply) => {
  const origin = req.headers.origin;

  // Allow specific origins only (localhost for dev, production domains)
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:8787",
    "https://sadhutech-site.vercel.app",
    "https://genesis-gate.onrender.com",
  ];

  if (allowedOrigins.includes(origin ?? "")) {
    reply.header("access-control-allow-origin", origin);
  } else if (!origin) {
    // No origin = same-site request, allow it
    reply.header("access-control-allow-origin", "*");
  }
  // Otherwise: deny by not setting header (browser enforces SOP)

  reply.header("access-control-allow-headers", "content-type, x-api-key");
  reply.header("access-control-allow-methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") reply.status(204).send();
});

app.get("/", async (_req, reply) => {
  reply.header("content-type", "text/html; charset=utf-8");
  return TESTER_HTML;
});

app.get("/health", async () => ({ status: "ok", service: "genesis-gate" }));

// ============================================================================
// POST /v1/analyze - Analyze transaction before signing
// ============================================================================
app.post<{ Body: AnalyzeRequest }>("/v1/analyze", 
  { 
    onRequest: createRateLimitMiddleware(rateLimiter),
  }, 
  async (request, reply) => {
    // Validate input
    const validationErrors = validateAnalyzeRequest(request.body);
    if (validationErrors.length > 0) {
      return reply.status(400).send({
        error: "Invalid request",
        details: validationErrors,
      });
    }

    const intel = await createIntelAsync();
    const body = request.body;
    const tx = body.tx!; // TypeScript safe now after validation

    try {
      return await analyze(body, intel);
    } catch (err) {
      request.log.error(err);
      return reply.status(400).send({
        error: "Could not analyze transaction",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }
);

// ============================================================================
// POST /v1/report - Submit threat report (requires API key)
// ============================================================================
app.post<{ Body: ReportRequest }>("/v1/report", 
  { 
    onRequest: [
      createRateLimitMiddleware(rateLimiter),
      createApiKeyMiddleware(authorizedApiKeys),
    ],
  }, 
  async (request, reply) => {
    // Validate input
    const validationErrors = validateReportRequest(request.body);
    if (validationErrors.length > 0) {
      return reply.status(400).send({
        error: "Invalid request",
        details: validationErrors,
      });
    }

    const intel = await createIntelAsync();
    const body = request.body as ReportRequest;

    try {
      const result = await intel.report(body);
      
      // Log who reported
      const user = (request as any).user;
      request.log.info({
        action: "threat_reported",
        address: body.address,
        category: body.category,
        reporterId: body.reporterId,
        apiKey: user?.apiKey?.substring(0, 8) + "...", // Redact most of key
      });

      return result;
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({
        error: "Failed to record report",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }
);

// Async startup with proper initialization.
async function start(): Promise<void> {
  try {
    // Pre-warm threat feeds/intel before listening.
    const intel = await createIntelAsync();

    // If using PostgreSQL, sync external threats in background
    if (intel instanceof (await import("./intel-postgres.js")).ThreatIntelPostgres) {
      const postgresIntel = intel as ThreatIntelPostgres;
      // Start sync service: run now, then every 6 hours
      initSyncService(postgresIntel, { runOnStartup: true, intervalHours: 6 }).catch((err) => {
        console.error("[startup] Sync service failed:", err);
        // Don't crash, just log - firewall can still work with stale data
      });
    }

    const port = Number(process.env.PORT ?? 8787);
    await app.listen({ port, host: "0.0.0.0" });
    app.log.info(`GENESIS gate listening on :${port} with loaded threat intel`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
