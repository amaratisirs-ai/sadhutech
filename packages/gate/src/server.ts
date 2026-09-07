import Fastify from "fastify";
try {
  process.loadEnvFile(new URL("../../../.env", import.meta.url));
} catch {
  // no root .env file (e.g. production, where Render sets env vars directly)
}
import { isAddress, recoverMessageAddress } from "viem";
import type { Address, AnalyzeRequest, AnalyzeSignatureRequest, ReportRequest } from "@genesis/shared";
import { analyze, analyzeSignature } from "./analyze.js";
import { createIntelAsync } from "./index.js";
import { TESTER_HTML } from "./ui.js";
import { initSyncService } from "./sync-external-threats.js";
import type { ThreatIntelPostgres } from "./intel-postgres.js";
import { ContributorsService } from "./contributors.js";
import { ProAccessService } from "./pro-access.js";
import { AuditLogService, getClientIp, lookupGeoIp } from "./audit-log.js";
import { AnalyticsService, type AnalyticsEventType } from "./analytics.js";
import { AdminTodosService } from "./admin-todos.js";
import { verifyAdminAuth } from "./admin-auth.js";
import { premiumAvailable, lookupChainAbuse } from "./chainabuse-lookup.js";
import { goplusAvailable } from "./goplus-lookup.js";
import { NewsletterService, initNewsletterService, resendConfigured } from "./newsletter.js";
import {
  loadApiKeys,
  createApiKeyMiddleware,
  createRateLimitMiddleware,
  createSecurityHeadersMiddleware,
  SimpleRateLimiter,
  validateAnalyzeRequest,
  validateBulkAnalyzeRequest,
  validateSignatureRequest,
  validateReportRequest,
  isValidEmail,
} from "./security.js";

const app = Fastify({ logger: true });

// Load API keys from environment
const authorizedApiKeys = loadApiKeys();

// Initialize rate limiter: 100 requests per 15 minutes per IP
const rateLimiter = new SimpleRateLimiter(100, 15 * 60 * 1000);

// Contributors service (initialized during startup)
let contributorsService: ContributorsService | null = null;
// Pro access service (wallet-based crypto payments; initialized during startup)
let proAccessService: ProAccessService | null = null;
// Audit log service (credit consumption + security-event trail; initialized during startup)
let auditLogService: AuditLogService | null = null;
// Analytics service (logins, page views, transaction checks, errors; initialized during startup)
let analyticsService: AnalyticsService | null = null;
// Admin build/roadmap tracker (initialized during startup)
let adminTodosService: AdminTodosService | null = null;
// Newsletter/journey service (email subscribers + templated sends; initialized during startup)
let newsletterService: NewsletterService | null = null;

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

app.get("/health", async () => ({
  status: "ok",
  service: "genesis-gate",
  // Boolean-only (never the keys themselves) - lets us verify which optional integrations
  // are actually configured on a given deployment without needing dashboard access.
  integrations: {
    goplus: goplusAvailable(),
    chainabuse: premiumAvailable(),
    resend: resendConfigured(),
  },
}));

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

    // Optional Pro "deep check": signed by the wallet, spends 1 credit, adds ChainAbuse intel.
    let proMeta: { creditsLeft: number; flagged: boolean; category?: string; reports?: number } | null = null;
    const proReq = (request.body as any).pro as
      | { wallet?: string; message?: string; signature?: string; source?: string }
      | undefined;
    if (proReq && premiumAvailable() && proAccessService) {
      const { wallet, message, signature, source } = proReq;
      if (!wallet || !isAddress(wallet) || !message || !signature) {
        return reply.status(400).send({ error: "Invalid deep-check request." });
      }
      let signer: string;
      try {
        signer = await recoverMessageAddress({ message, signature: signature as `0x${string}` });
      } catch {
        return reply.status(401).send({ error: "Bad signature." });
      }
      const tsMatch = /ts:\s*(\S+)/.exec(message);
      const timestamp = tsMatch?.[1];
      // Both the Snap (one-time onHomePage auth) and the web (cached signature, see
      // check/page.tsx's getProAuth) reuse a signed credential across requests rather
      // than re-signing every call, so both get the same 24h freshness window.
      const freshnessWindowMs = 24 * 60 * 60 * 1000;
      const fresh = timestamp ? Math.abs(Date.now() - Date.parse(timestamp)) < freshnessWindowMs : false;
      if (signer.toLowerCase() !== wallet.toLowerCase() || !fresh || !message.toLowerCase().includes(wallet.toLowerCase())) {
        return reply.status(401).send({ error: "Invalid or expired signature." });
      }
      // Perform the premium lookup (the value the credit buys), then spend the credit.
      const hit = tx.to
        ? await lookupChainAbuse(tx.to, (reason) => void auditLogService?.logIntegrationFailure("chainabuse", reason))
        : null;
      const remaining = await proAccessService.consume(wallet.toLowerCase(), 1);
      if (remaining === null) {
        return reply.status(402).send({ error: "No credits left. Buy more at /pro." });
      }
      proMeta = { creditsLeft: remaining, flagged: !!hit?.flagged, category: hit?.category, reports: hit?.reports };
    }

    try {
      const result = await analyze(body, intel, auditLogService ?? undefined);
      if (proMeta) {
        (result as any).creditsLeft = proMeta.creditsLeft;
        if (proMeta.flagged) {
          result.findings.push({
            id: "intel.chainabuse",
            severity: "critical",
            title: `ChainAbuse: reported as ${proMeta.category || "scam"}`,
            description: `This address has ${proMeta.reports || 1} report(s) on ChainAbuse.`,
            subject: tx.to!,
          });
          (result as any).verdict = "block";
          void auditLogService?.logSecurityEvent("chainabuse.flagged", tx.to, "critical", {
            category: proMeta.category,
            reports: proMeta.reports,
          });
        }
        void auditLogService?.logCreditConsumption(
          proReq!.wallet!.toLowerCase(),
          1,
          (result as any).verdict,
          proMeta.flagged,
          proReq!.source
        );
      }
      void analyticsService?.logEvent("analyze", {
        wallet: proReq?.wallet,
        chainId: tx.chainId,
        verdict: (result as any).verdict,
        meta: { endpoint: "analyze", pro: !!proMeta, findings: result.findings.length, source: proReq?.source },
      });
      return result;
    } catch (err) {
      request.log.error(err);
      void analyticsService?.logEvent("error", {
        wallet: proReq?.wallet,
        chainId: tx.chainId,
        meta: { endpoint: "analyze", message: err instanceof Error ? err.message : String(err) },
      });
      return reply.status(400).send({
        error: "Could not analyze transaction",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }
);

// ============================================================================
// POST /v1/analyze/bulk - Pro: check up to 5 addresses at once (1 credit each)
// ============================================================================
const BULK_PROBE_FROM: Address = "0x1111111111111111111111111111111111111111";
app.post<{ Body: { addresses?: string[]; pro?: { wallet?: string; message?: string; signature?: string; source?: string } } }>(
  "/v1/analyze/bulk",
  {
    onRequest: createRateLimitMiddleware(rateLimiter),
  },
  async (request, reply) => {
    const validationErrors = validateBulkAnalyzeRequest(request.body);
    if (validationErrors.length > 0) {
      return reply.status(400).send({
        error: "Invalid request",
        details: validationErrors,
      });
    }

    if (!premiumAvailable() || !proAccessService) {
      return reply.status(503).send({ error: "Bulk check requires Pro credits, which aren't configured yet." });
    }

    const addresses = (request.body.addresses ?? []).map((a) => a.toLowerCase());
    const proReq = request.body.pro;
    if (!proReq?.wallet || !isAddress(proReq.wallet) || !proReq.message || !proReq.signature) {
      return reply.status(400).send({ error: "Bulk check requires a signed Pro request." });
    }
    const { wallet, message, signature, source } = proReq;
    let signer: string;
    try {
      signer = await recoverMessageAddress({ message, signature: signature as `0x${string}` });
    } catch {
      return reply.status(401).send({ error: "Bad signature." });
    }
    const tsMatch = /ts:\s*(\S+)/.exec(message);
    const timestamp = tsMatch?.[1];
    // Same 24h window as /v1/analyze - the web now caches a signed credential too (see getProAuth).
    const freshnessWindowMs = 24 * 60 * 60 * 1000;
    const fresh = timestamp ? Math.abs(Date.now() - Date.parse(timestamp)) < freshnessWindowMs : false;
    if (signer.toLowerCase() !== wallet.toLowerCase() || !fresh || !message.toLowerCase().includes(wallet.toLowerCase())) {
      return reply.status(401).send({ error: "Invalid or expired signature." });
    }

    const remaining = await proAccessService.consume(wallet.toLowerCase(), addresses.length);
    if (remaining === null) {
      return reply.status(402).send({
        error: `Not enough credits. Checking ${addresses.length} address${addresses.length === 1 ? "" : "es"} needs ${addresses.length} credit${addresses.length === 1 ? "" : "s"}.`,
      });
    }

    const intel = await createIntelAsync();
    try {
      const results = await Promise.all(
        addresses.map(async (address) => {
          const addr = address as Address;
          const tx = { chainId: 1, from: BULK_PROBE_FROM, to: addr, value: "1", data: "0x" as const };
          const result = await analyze({ tx }, intel, auditLogService ?? undefined);
          const hit = await lookupChainAbuse(addr, (reason) => void auditLogService?.logIntegrationFailure("chainabuse", reason));
          if (hit?.flagged) {
            result.findings.push({
              id: "intel.chainabuse",
              severity: "critical",
              title: `ChainAbuse: reported as ${hit.category || "scam"}`,
              description: `This address has ${hit.reports || 1} report(s) on ChainAbuse.`,
              subject: addr,
            });
            (result as any).verdict = "block";
            void auditLogService?.logSecurityEvent("chainabuse.flagged", address, "critical", {
              category: hit.category,
              reports: hit.reports,
            });
          }
          return { address, ...result };
        })
      );
      void auditLogService?.logCreditConsumption(
        wallet.toLowerCase(),
        addresses.length,
        results.some((r) => r.verdict === "block") ? "block" : results.some((r) => r.verdict === "warn") ? "warn" : "allow",
        results.some((r) => (r as any).findings?.some((f: any) => f.id === "intel.chainabuse")),
        source
      );
      void analyticsService?.logEvent("analyze", {
        wallet,
        verdict: results.some((r) => r.verdict === "block") ? "block" : results.some((r) => r.verdict === "warn") ? "warn" : "allow",
        meta: { endpoint: "analyze/bulk", count: addresses.length, source },
      });
      return { creditsLeft: remaining, results };
    } catch (err) {
      request.log.error(err);
      void analyticsService?.logEvent("error", {
        wallet,
        meta: { endpoint: "analyze/bulk", message: err instanceof Error ? err.message : String(err) },
      });
      return reply.status(400).send({
        error: "Could not complete the bulk check",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }
);

// ============================================================================
// POST /v1/analyze-signature - Analyze an off-chain signature request before signing
// ============================================================================
app.post<{ Body: AnalyzeSignatureRequest }>("/v1/analyze-signature",
  {
    onRequest: createRateLimitMiddleware(rateLimiter),
  },
  async (request, reply) => {
    const validationErrors = validateSignatureRequest(request.body);
    if (validationErrors.length > 0) {
      return reply.status(400).send({
        error: "Invalid request",
        details: validationErrors,
      });
    }

    const intel = await createIntelAsync();
    try {
      const result = await analyzeSignature(request.body, intel, auditLogService ?? undefined);
      void analyticsService?.logEvent("analyze", {
        chainId: request.body.sig?.chainId,
        verdict: (result as any).verdict,
        meta: { endpoint: "analyze-signature", method: request.body.sig?.method },
      });
      return result;
    } catch (err) {
      request.log.error(err);
      void analyticsService?.logEvent("error", {
        chainId: request.body.sig?.chainId,
        meta: { endpoint: "analyze-signature", message: err instanceof Error ? err.message : String(err) },
      });
      return reply.status(400).send({
        error: "Could not analyze signature request",
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

// ============================================================================
// Pro access (wallet-based crypto payments)
// ============================================================================
app.post<{ Body: { address?: string } }>("/v1/pro/verify", async (request, reply) => {
  const address = request.body?.address ?? "";
  if (!isAddress(address)) {
    return reply.status(400).send({ ok: false, error: "Invalid wallet address." });
  }
  if (!proAccessService) {
    return reply.status(503).send({ ok: false, error: "Payments aren't available right now." });
  }
  const result = await proAccessService.verifyPayment(address);
  return reply.status(result.ok ? 200 : 400).send(result);
});

app.get<{ Params: { address: string } }>("/v1/pro/status/:address", async (request, reply) => {
  const address = request.params.address;
  if (!isAddress(address)) {
    return reply.status(400).send({ error: "Invalid wallet address." });
  }
  if (!proAccessService) {
    return reply.status(503).send({ error: "Pro status unavailable." });
  }
  const s = await proAccessService.getStatus(address);
  return { ...s, premium: premiumAvailable() };
});

// ============================================================================
// Analytics: client-reported events (page views, logins, errors, "stuck" flows)
// + the admin 360° summary, gated to ADMIN_WALLETS via signed wallet auth.
// ============================================================================
const CLIENT_EVENT_TYPES: ReadonlySet<AnalyticsEventType> = new Set(["page_view", "login", "error", "stuck"]);

// POST /v1/analytics/event - fire-and-forget telemetry from the site/extension.
// "analyze" events are never accepted from clients - they're logged server-side
// only (in /v1/analyze, /v1/analyze/bulk, /v1/analyze-signature) so transaction
// counts can't be spoofed.
app.post<{ Body: { type?: string; wallet?: string; page?: string; chainId?: number; meta?: unknown } }>(
  "/v1/analytics/event",
  { onRequest: createRateLimitMiddleware(rateLimiter) },
  async (request, reply) => {
    const { type, wallet, page, chainId, meta } = request.body ?? {};
    if (!type || !CLIENT_EVENT_TYPES.has(type as AnalyticsEventType)) {
      return reply.status(400).send({ error: "Invalid event type." });
    }
    if (wallet && !isAddress(wallet)) {
      return reply.status(400).send({ error: "Invalid wallet." });
    }
    void analyticsService?.logEvent(type as AnalyticsEventType, {
      wallet,
      page: typeof page === "string" ? page.slice(0, 200) : null,
      chainId: typeof chainId === "number" ? chainId : null,
      meta: meta && typeof meta === "object" ? meta : {},
    });
    return reply.status(202).send({ ok: true });
  }
);

// POST /v1/admin/analytics - the 360° dashboard summary. Auth is a signed wallet
// message (same pattern as Pro deep-check), not an API key, so the admin can log
// in with the same wallet used everywhere else on the site.
app.post<{ Body: { wallet?: string; message?: string; signature?: string; hours?: number } }>(
  "/v1/admin/analytics",
  { onRequest: createRateLimitMiddleware(rateLimiter) },
  async (request, reply) => {
    const auth = await verifyAdminAuth(request.body);
    if (!auth.ok) {
      return reply.status(auth.status).send({ error: auth.error });
    }
    if (!analyticsService) {
      return reply.status(503).send({ error: "Analytics unavailable (requires PostgreSQL)." });
    }
    try {
      const capped = Math.min(Number(request.body?.hours) || 24 * 7, 24 * 90);
      return await analyticsService.getSummary(capped);
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ error: "Failed to load analytics." });
    }
  }
);

// ============================================================================
// Admin build/roadmap tracker (todo list shown on /admin/todos)
// ============================================================================
app.post<{ Body: { wallet?: string; message?: string; signature?: string } }>(
  "/v1/admin/todos/list",
  { onRequest: createRateLimitMiddleware(rateLimiter) },
  async (request, reply) => {
    const auth = await verifyAdminAuth(request.body);
    if (!auth.ok) return reply.status(auth.status).send({ error: auth.error });
    if (!adminTodosService) return reply.status(503).send({ error: "Todos unavailable (requires PostgreSQL)." });
    try {
      return await adminTodosService.list();
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ error: "Failed to load todos." });
    }
  }
);

app.post<{
  Body: { wallet?: string; message?: string; signature?: string; title?: string; description?: string; category?: string; effort?: string; estimateHours?: string };
}>("/v1/admin/todos/create", { onRequest: createRateLimitMiddleware(rateLimiter) }, async (request, reply) => {
  const auth = await verifyAdminAuth(request.body);
  if (!auth.ok) return reply.status(auth.status).send({ error: auth.error });
  if (!adminTodosService) return reply.status(503).send({ error: "Todos unavailable (requires PostgreSQL)." });
  const { title, description, category, effort, estimateHours } = request.body ?? {};
  if (!title || !title.trim()) return reply.status(400).send({ error: "A title is required." });
  try {
    return await adminTodosService.create({ title: title.trim(), description, category, effort, estimateHours });
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({ error: "Failed to create todo." });
  }
});

app.post<{ Body: { wallet?: string; message?: string; signature?: string; id?: number; status?: string } }>(
  "/v1/admin/todos/status",
  { onRequest: createRateLimitMiddleware(rateLimiter) },
  async (request, reply) => {
    const auth = await verifyAdminAuth(request.body);
    if (!auth.ok) return reply.status(auth.status).send({ error: auth.error });
    if (!adminTodosService) return reply.status(503).send({ error: "Todos unavailable (requires PostgreSQL)." });
    const { id, status } = request.body ?? {};
    const validStatuses = new Set(["not-started", "in-progress", "done", "blocked"]);
    if (typeof id !== "number" || !status || !validStatuses.has(status)) {
      return reply.status(400).send({ error: "A valid id and status are required." });
    }
    try {
      const updated = await adminTodosService.updateStatus(id, status as "not-started" | "in-progress" | "done" | "blocked");
      if (!updated) return reply.status(404).send({ error: "Todo not found." });
      return updated;
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ error: "Failed to update todo." });
    }
  }
);

app.post<{ Body: { wallet?: string; message?: string; signature?: string; id?: number } }>(
  "/v1/admin/todos/delete",
  { onRequest: createRateLimitMiddleware(rateLimiter) },
  async (request, reply) => {
    const auth = await verifyAdminAuth(request.body);
    if (!auth.ok) return reply.status(auth.status).send({ error: auth.error });
    if (!adminTodosService) return reply.status(503).send({ error: "Todos unavailable (requires PostgreSQL)." });
    const { id } = request.body ?? {};
    if (typeof id !== "number") return reply.status(400).send({ error: "A valid id is required." });
    try {
      await adminTodosService.remove(id);
      return { ok: true };
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ error: "Failed to delete todo." });
    }
  }
);

// ============================================================================
// POST /v1/consent - Record acceptance of Terms/Privacy at a key touchpoint
// (wallet connect, Snap install, Snap one-time authorization).
// ============================================================================
const CONSENT_TYPES = ["wallet-connect", "snap-install", "snap-onboarding"];
app.post<{ Body: { address?: string; type?: string; version?: string; context?: string; email?: string } }>(
  "/v1/consent",
  { onRequest: createRateLimitMiddleware(rateLimiter) },
  async (request, reply) => {
    const { address, type, version, context, email } = request.body ?? {};
    if (!type || !CONSENT_TYPES.includes(type)) {
      return reply.status(400).send({ error: `type must be one of ${CONSENT_TYPES.join(", ")}` });
    }
    if (address !== undefined && !isAddress(address)) {
      return reply.status(400).send({ error: "Invalid wallet address." });
    }
    if (email !== undefined && email !== "" && !isValidEmail(email)) {
      return reply.status(400).send({ error: "Invalid email address." });
    }
    if (!auditLogService) {
      return reply.status(503).send({ error: "Consent logging isn't available right now." });
    }
    const ipAddress = getClientIp(request);
    const userAgent = request.headers["user-agent"] as string | undefined;
    const geo = await lookupGeoIp(ipAddress);
    await auditLogService.logConsent(address, type, version || "2026-09", context, {
      ipAddress,
      userAgent,
      country: geo?.country,
      region: geo?.region,
      city: geo?.city,
    });
    // Optional: subscribe to the email journey/newsletter framework at the same touchpoint.
    if (email && newsletterService) {
      void newsletterService.subscribe(email, { walletAddress: address, consentVersion: version || "2026-09", source: `consent:${type}` });
    }
    return { ok: true };
  }
);

// ============================================================================
// Newsletter / email journeys — subscribe, unsubscribe, and (cron-triggered) send.
// ============================================================================
app.post<{ Body: { email?: string; walletAddress?: string; consentVersion?: string; source?: string } }>(
  "/v1/newsletter/subscribe",
  { onRequest: createRateLimitMiddleware(rateLimiter) },
  async (request, reply) => {
    const { email, walletAddress, consentVersion, source } = request.body ?? {};
    if (!email || !isValidEmail(email)) {
      return reply.status(400).send({ error: "A valid email is required." });
    }
    if (walletAddress !== undefined && !isAddress(walletAddress)) {
      return reply.status(400).send({ error: "Invalid wallet address." });
    }
    if (!newsletterService) {
      return reply.status(503).send({ error: "Newsletter signup isn't available right now." });
    }
    const result = await newsletterService.subscribe(email, { walletAddress, consentVersion, source: source || "footer" });
    if (!result.ok) {
      return reply.status(500).send({ error: "Could not subscribe right now. Please try again." });
    }
    return { ok: true };
  }
);

app.get<{ Querystring: { token?: string } }>(
  "/v1/newsletter/unsubscribe",
  { onRequest: createRateLimitMiddleware(rateLimiter) },
  async (request, reply) => {
    const token = request.query?.token;
    if (!token) {
      return reply.status(400).send({ error: "Missing token." });
    }
    if (!newsletterService) {
      return reply.status(503).send({ error: "Newsletter isn't available right now." });
    }
    const ok = await newsletterService.unsubscribe(token);
    return { ok };
  }
);

// Cron-triggerable (API-key protected) so delivery doesn't depend on the in-process
// timer, which only runs while this instance happens to be awake.
app.post(
  "/v1/newsletter/run",
  { onRequest: [createRateLimitMiddleware(rateLimiter), createApiKeyMiddleware(authorizedApiKeys)] },
  async (_request, reply) => {
    if (!newsletterService) {
      return reply.status(503).send({ error: "Newsletter isn't available right now." });
    }
    return newsletterService.sendDueEmails();
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
app.post("/v1/admin/sync", { onRequest: [createRateLimitMiddleware(rateLimiter), createApiKeyMiddleware(authorizedApiKeys)] }, async (request, reply) => {
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
app.get("/v1/admin/db-count", { onRequest: [createRateLimitMiddleware(rateLimiter), createApiKeyMiddleware(authorizedApiKeys)] }, async (request, reply) => {
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
app.get("/v1/admin/raw-threats", { onRequest: [createRateLimitMiddleware(rateLimiter), createApiKeyMiddleware(authorizedApiKeys)] }, async (request, reply) => {
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

    // Listen first - every deploy restarts this process, and health checks (Render's own,
    // plus the site's gate-status badge) shouldn't have to wait behind ~7 sequential DB
    // initialize() calls below. Endpoints that need those services already fail soft with
    // a 503 ("unavailable (requires PostgreSQL)") until they finish, same as the existing
    // no-Postgres case - a much better failure mode than the whole server not responding.
    const port = Number(process.env.PORT ?? 8787);
    await app.listen({ port, host: "0.0.0.0" });
    app.log.info(`GENESIS gate listening on :${port} with loaded threat intel`);

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
        // Ensure threat_intel exists first (ledger references it), then everything else -
        // those are independent standalone tables, safe to create in parallel.
        await postgresIntel.initialize();
        contributorsService = new ContributorsService(postgresIntel.pool);
        proAccessService = new ProAccessService(postgresIntel.pool);
        auditLogService = new AuditLogService(postgresIntel.pool);
        analyticsService = new AnalyticsService(postgresIntel.pool);
        adminTodosService = new AdminTodosService(postgresIntel.pool);
        newsletterService = new NewsletterService(postgresIntel.pool);
        await Promise.all([
          contributorsService.initialize(),
          proAccessService.initialize(),
          auditLogService.initialize(),
          analyticsService.initialize(),
          adminTodosService.initialize(),
          newsletterService.initialize(),
        ]);
        initNewsletterService(newsletterService, { runOnStartup: true, intervalHours: 1 });
        console.log("[startup] Contributors service initialized");
      } catch (err) {
        console.warn("[startup] Contributors service failed to initialize:", err);
        // Don't crash, just warn - reporting still works without gamification
      }
    }
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
