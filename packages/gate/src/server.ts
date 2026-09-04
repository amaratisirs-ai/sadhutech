import Fastify from "fastify";
import { isAddress } from "viem";
import type { AnalyzeRequest, ReportRequest } from "@genesis/shared";
import { analyze } from "./analyze.js";
import { createIntelAsync } from "./index.js";
import { TESTER_HTML } from "./ui.js";
import { initSyncService } from "./sync-external-threats.js";
import type { ThreatIntelPostgres } from "./intel-postgres.js";
import { ContributorsService } from "./contributors.js";
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

// Contributors service (initialized during startup)
let contributorsService: ContributorsService | null = null;

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
    "https://sadhutech-site.vercel.app", // Legacy (during transition)
    "https://sadhutech.com", // Production
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
      // Record the threat
      const result = await intel.report(body);
      
      // Track contributor stats (contributorsService is only set when using Postgres).
      if (contributorsService) {
        try {
          await contributorsService.recordReport(
            body.reporterId,
            body.reporterName,
            body.address,
            body.category,
            body.description,
            body.evidenceUrl,
            body.victimCount,
            body.impactedChains,
            body.reporterEmail
          );
        } catch (err) {
          request.log.warn({ err }, "Failed to record contributor stats");
          // Don't fail the report if contributor tracking fails
        }
      }
      
      // Log who reported
      const user = (request as any).user;
      request.log.info({
        action: "threat_reported",
        address: body.address,
        category: body.category,
        reporterId: body.reporterId,
        reporter: body.reporterName || "anonymous",
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

// GET /v1/threats/latest - Recent threats for /news page feed (paginated)
// ============================================================================
app.get("/v1/threats/latest", async (request, reply) => {
  const intel = await createIntelAsync();

  try {
    // Parse optional query parameters
    const query = request.query as any;
    const limit = Math.min(Number(query.limit) || 50, 1000); // Max 1000 per page
    const offset = Math.max(Number(query.offset) || 0, 0); // Pagination offset
    const hours = Math.min(Number(query.hours) || 24 * 7, 24 * 365); // Default: 7 days, max: 1 year

    // Only PostgreSQL supports getRecentThreats
    if (!("getRecentThreats" in intel)) {
      return reply.status(503).send({
        error: "Threats feed not available",
        message: "PostgreSQL backend required",
      });
    }

    const threats = await (intel as any).getRecentThreats(limit, hours, offset);
    const totalCount = await (intel as any).getThreatCount();
    console.log(`[/v1/threats/latest] Query params - limit=${limit}, offset=${offset}, hours=${hours}. Returned ${threats.length}/${totalCount} threats`);

    // Group by category for stats
    const stats = {
      total: totalCount,
      returned: threats.length,
      byCategory: {} as Record<string, number>,
    };

    for (const threat of threats) {
      stats.byCategory[threat.category] = (stats.byCategory[threat.category] || 0) + 1;
    }

    return {
      timestamp: new Date().toISOString(),
      parameters: {
        limit,
        offset,
        hoursBack: hours,
      },
      pagination: {
        offset,
        limit,
        total: totalCount,
        hasMore: offset + threats.length < totalCount,
      },
      stats,
      threats: threats.map((t: any) => ({
        address: t.address,
        category: t.category,
        severity: t.trusted ? "high" : t.reports >= 3 ? "medium" : "low",
        reports: t.reports,
        reporters: t.reporters.length,
        firstSeen: new Date(t.firstSeen).toISOString(),
        lastSeen: new Date(t.lastSeen).toISOString(),
        trusted: t.trusted,
        hoursOld: Math.round((Date.now() - t.lastSeen) / (1000 * 60 * 60)),
      })),
    };
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({
      error: "Failed to fetch threats",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

// GET /v1/contributors/leaderboard - Top community threat reporters (paginated gamification)
// ============================================================================
app.get("/v1/contributors/leaderboard", async (request, reply) => {
  if (!contributorsService) {
    return reply.status(503).send({
      error: "Contributors service not initialized",
    });
  }

  try {
    const query = request.query as any;
    const limit = Math.min(Number(query.limit) || 50, 500); // Max 500 per page
    const offset = Math.max(Number(query.offset) || 0, 0); // Pagination offset
    
    const leaderboard = await contributorsService.getLeaderboard(limit, offset);
    const totalCount = await contributorsService.getContributorCount();
    
    return {
      timestamp: new Date().toISOString(),
      pagination: {
        offset,
        limit,
        total: totalCount,
        hasMore: offset + leaderboard.length < totalCount,
      },
      count: leaderboard.length,
      leaderboard,
    };
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({
      error: "Failed to fetch leaderboard",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

// GET /v1/contributors/:reporterId - Contributor profile & stats
// ============================================================================
app.get<{ Params: { reporterId: string } }>(
  "/v1/contributors/:reporterId",
  async (request, reply) => {
    if (!contributorsService) {
      return reply.status(503).send({
        error: "Contributors service not initialized",
      });
    }

    try {
      const contributor = await contributorsService.getContributor(
        request.params.reporterId
      );

      if (!contributor) {
        return reply.status(404).send({
          error: "Contributor not found",
        });
      }

      const reports = await contributorsService.getContributorReports(
        request.params.reporterId,
        20
      );

      return {
        contributor,
        recentReports: reports,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({
        error: "Failed to fetch contributor",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }
);

// GET /v1/contributors/stats - Community contribution statistics
// ============================================================================
app.get("/v1/contributors/stats", async (request, reply) => {
  if (!contributorsService) {
    return reply.status(503).send({
      error: "Contributors service not initialized",
    });
  }

  try {
    const stats = await contributorsService.getStats();
    return {
      ...stats,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({
      error: "Failed to fetch stats",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

// POST /v1/admin/sync - Manually trigger threat sync (debugging only)
app.post("/v1/admin/sync", async (request, reply) => {
  try {
    const intel = await createIntelAsync();
    if (!(intel instanceof (await import("./intel-postgres.js")).ThreatIntelPostgres)) {
      return reply.status(400).send({
        error: "Sync only available with PostgreSQL backend",
      });
    }

    const { syncExternalThreats } = await import("./sync-external-threats.js");
    const postgresIntel = intel as any;
    const report = await syncExternalThreats(postgresIntel);

    return {
      message: "Manual sync completed",
      report,
    };
  } catch (err) {
    reply.status(500);
    return {
      error: "Sync failed",
      message: err instanceof Error ? err.message : String(err),
    };
  }
});

// GET /v1/admin/db-count - Check actual database record count (debugging only)
app.get("/v1/admin/db-count", async (request, reply) => {
  try {
    const intel = await createIntelAsync();
    if (!(intel instanceof (await import("./intel-postgres.js")).ThreatIntelPostgres)) {
      return reply.status(400).send({
        error: "Database endpoint only available with PostgreSQL backend",
      });
    }

    const postgresIntel = intel as any;
    const result = await postgresIntel.pool.query(
      `SELECT COUNT(*) as total, COUNT(DISTINCT category) as categories FROM threat_intel`
    );

    const categoryBreakdown = await postgresIntel.pool.query(
      `SELECT category, COUNT(*) as count FROM threat_intel GROUP BY category ORDER BY count DESC`
    );

    // Debug: Check exactly what getRecentThreats returns
    const threats = await (postgresIntel as any).getRecentThreats(10000, 999999);
    
    console.log(`[/admin/db-count] Database has ${result.rows[0].total} threats, getRecentThreats returned ${threats.length}`);

    return {
      total_in_db: result.rows[0].total,
      category_count: result.rows[0].categories,
      breakdown: categoryBreakdown.rows,
      getRecentThreats_returned: threats.length,
      sample_addresses: threats.slice(0, 5).map((t: any) => ({ address: t.address.slice(0, 10) + "...", category: t.category })),
    };
  } catch (err) {
    reply.status(500);
    return {
      error: "Database query failed",
      message: err instanceof Error ? err.message : String(err),
    };
  }
});

// GET /v1/admin/raw-threats - Raw query without time filtering (debugging only)
app.get("/v1/admin/raw-threats", async (request, reply) => {
  try {
    const intel = await createIntelAsync();
    if (!(intel instanceof (await import("./intel-postgres.js")).ThreatIntelPostgres)) {
      return reply.status(400).send({
        error: "Database endpoint only available with PostgreSQL backend",
      });
    }

    const postgresIntel = intel as any;
    const query = request.query as any;
    const limit = Math.min(Number(query.limit) || 50, 1000);
    const hoursBack = Math.min(Number(query.hours) || 24 * 7, 24 * 365);

    // Get all threats regardless of time
    const allResult = await postgresIntel.pool.query(
      `SELECT COUNT(*) as total FROM threat_intel`
    );

    // Get threats matching the time filter used by getRecentThreats
    const filteredResult = await postgresIntel.pool.query(
      `SELECT COUNT(*) as total FROM threat_intel WHERE last_seen > NOW() - INTERVAL '1 hour' * $1`,
      [hoursBack]
    );

    // Get raw sample of first 10 threats
    const sampleResult = await postgresIntel.pool.query(
      `SELECT 
        address, 
        category, 
        array_length(reporters, 1) as reporter_count,
        trusted, 
        first_seen, 
        last_seen
       FROM threat_intel 
       ORDER BY last_seen DESC
       LIMIT 10`
    );

    console.log(`[/admin/raw-threats] All: ${allResult.rows[0].total}, Filtered (${hoursBack}h): ${filteredResult.rows[0].total}`);

    return {
      all_threats: allResult.rows[0].total,
      filtered_threats: filteredResult.rows[0].total,
      hours_back: hoursBack,
      sample: sampleResult.rows.map((r: any) => ({
        address: r.address.slice(0, 10) + "...",
        category: r.category,
        reporter_count: r.reporter_count,
        trusted: r.trusted,
        last_seen: r.last_seen,
      })),
    };
  } catch (err) {
    reply.status(500);
    return {
      error: "Query failed",
      message: err instanceof Error ? err.message : String(err),
    };
  }
});

// Async startup with proper initialization.
async function start(): Promise<void> {
  try {
    // Pre-warm threat feeds/intel before listening.
    const intel = await createIntelAsync();

    // If using PostgreSQL, sync external threats in background + initialize contributors service
    if (intel instanceof (await import("./intel-postgres.js")).ThreatIntelPostgres) {
      const postgresIntel = intel as ThreatIntelPostgres;
      
      // Start sync service: run now, then every 6 hours
      initSyncService(postgresIntel, { runOnStartup: true, intervalHours: 6 }).catch((err) => {
        console.error("[startup] Sync service failed:", err);
        // Don't crash, just log - firewall can still work with stale data
      });
      
      // Initialize contributors service for leaderboard & gamification
      try {
        // Ensure threat_intel exists first (ledger references it), then contributor tables.
        await postgresIntel.initialize();
        contributorsService = new ContributorsService(postgresIntel.pool);
        await contributorsService.initialize();
        console.log("[startup] Contributors service initialized");
      } catch (err) {
        console.warn("[startup] Contributors service failed to initialize:", err);
        // Don't crash, just warn - reporting still works without gamification
      }
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
