# Security Audit: GENESIS Gate & Site

**Date**: Sept 2, 2026  
**Status**: 🔴 CRITICAL VULNERABILITIES FOUND - Production needs hardening before beta

---

## 1. CRITICAL: Open CORS + No Rate Limiting + No Auth

### Current State (Vulnerable)
```typescript
// packages/gate/src/server.ts
reply.header("access-control-allow-origin", "*");  // ❌ CRITICAL
reply.header("access-control-allow-methods", "GET,POST,OPTIONS");

// POST /v1/report (no auth)
app.post("/v1/report", async (request, reply) => {
  // No rate limit, no auth, no input validation → Easy to spam
});

// POST /v1/analyze (no rate limit)
app.post("/v1/analyze", async (request, reply) => {
  // No rate limit → DoS vulnerability
});
```

### Attack Scenario
```bash
# 1. Attacker spams /v1/report with fake threats from any origin
for i in {1..10000}; do
  curl -X POST https://genesis-gate.onrender.com/v1/report \
    -d '{"address":"0x1234...","category":"phishing","reporterId":"attacker"}'
done

# 2. Database fills with garbage (1000 req/sec = 86M records/day)
# 3. Legitimate reports buried
# 4. System performance degrades
```

### Risk
- ⚠️ **Spam threat reports** (pollute database)
- ⚠️ **DoS attacks** (crash backend by overloading /v1/analyze)
- ⚠️ **Data poisoning** (false threats drown out real ones)
- ⚠️ **Compliance** (PCI-DSS requires auth on state-changing endpoints)

### Fix Priority: **CRITICAL** (Deploy before beta)

---

## 2. CRITICAL: Public Threat Data Exposure

### Current State (Exposed)
```
❌ /public/threat-feeds.json is publicly accessible
   → Contains 21 curated threat addresses + categories
   → Reveals detection patterns to competitors/attackers
   
❌ /public/WHITEPAPER.md exposes architecture
   → Details of threat scoring logic
   → Descriptions of quorum voting
   → Could be reverse-engineered
```

### Example Public Access
```bash
curl -s https://sadhutech-site.vercel.app/public/threat-feeds.json | jq .

# Output: All 21 curated threats + metadata exposed to world
```

### Risk
- 🔓 **Competitive intelligence** (competitors see our data)
- 🔓 **Attack planning** (malicious actors see what we block)
- 🔓 **Scam targeting** (scammers know how to evade detection)

### Fix Priority: **CRITICAL** (Deploy before beta)

---

## 3. HIGH: Missing Input Validation

### Current State (Vulnerable)
```typescript
// POST /v1/analyze - No validation on tx fields
app.post<{ Body: AnalyzeRequest }>("/v1/analyze", async (request, reply) => {
  // request.body.tx could be:
  // - Missing required fields
  // - Non-hex addresses (should be 0x + 40 hex chars)
  // - Negative values
  // - Malformed data
});

// POST /v1/report - Minimal validation
app.post<{ Body: ReportRequest }>("/v1/report", async (request, reply) => {
  // No check: address format, category allowed values, reporterId length
});
```

### Attack Scenario
```bash
# 1. Send invalid tx
curl -X POST https://genesis-gate.onrender.com/v1/analyze \
  -d '{"tx":{"chainId":"invalid","from":"notanaddress"}}'

# 2. Could crash parser or trigger unexpected errors
# 3. Stack trace leaked = security info disclosure
```

### Risk
- ⚠️ **Crash backend** (malformed data → unhandled exception → 500 error)
- ⚠️ **Info disclosure** (error messages reveal code paths)
- ⚠️ **Replay attacks** (no transaction nonce checking)

### Fix Priority: **HIGH** (Deploy before beta)

---

## 4. HIGH: No API Authentication/Keys

### Current State
```typescript
// Anyone can call /v1/analyze and /v1/report unlimited times
// No API key mechanism
// No user session tracking
```

### Risk
- ⚠️ **Monetization blocked** (can't charge for API access)
- ⚠️ **Attribution lost** (don't know who submitted report)
- ⚠️ **Trust issues** (can't identify reliable reporters vs spam)

### Fix Priority: **HIGH** (Important for subscription model)

---

## 5. HIGH: Database Direct Access Not Restricted

### Current State
```
Database connection string in:
- Environment variable (Render.com)
- Documentation examples
- Logs (possible leakage)

If someone finds connection string → Full database access
```

### Risk
- 🔴 **Data breach** (all 4,121 threats + reporters exposed)
- 🔴 **Data manipulation** (attacker edits threat records)
- 🔴 **Competitive theft** (sell threat intel to competitors)

### Fix Priority: **CRITICAL** (Already somewhat protected by Neon SSL)

---

## 6. MEDIUM: No Content Security Policy (CSP)

### Current State
```typescript
// Frontend has no CSP headers
// Can load scripts from anywhere
// Vulnerable to XSS → attacker injects code
```

### Risk
- ⚠️ **XSS attacks** (steal user session, wallet address)
- ⚠️ **Malicious script injection** (modify page content)
- ⚠️ **Phishing** (inject fake login form)

### Fix Priority: **MEDIUM** (Before production launch)

---

## 7. MEDIUM: No HTTPS Enforcement

### Current State
```
Frontend: Vercel → Auto HTTPS ✅
Backend: Render → Auto HTTPS ✅
But no HSTS header forcing HTTPS for all future requests
```

### Risk
- ⚠️ **Man-in-the-middle attacks** (attacker intercepts traffic)
- ⚠️ **Session hijacking** (steal cookies if downgraded to HTTP)

### Fix Priority: **MEDIUM** (Easy fix: one header)

---

## 8. MEDIUM: No Logging/Monitoring

### Current State
```typescript
// No audit trail of:
// - Who called /v1/analyze
// - Who submitted /v1/report
// - When threats were added/modified
// - Failed attempts
```

### Risk
- ⚠️ **Forensics impossible** (if hacked, can't trace attacker)
- ⚠️ **Compliance violation** (regulations require audit logs)
- ⚠️ **No anomaly detection** (can't notice unusual patterns)

### Fix Priority: **MEDIUM** (Important for compliance)

---

## 9. LOW: Exposed Whitepaper Architecture

### Current State
```
/whitepaper/page.tsx publicly describes:
- Threat scoring algorithm
- Quorum voting mechanism
- Category definitions
- How addresses are analyzed
```

### Risk
- ℹ️ **Reverse engineering** (attacker learns how to bypass)
- ℹ️ **Competitive analysis** (competitors see our strategy)

### Fix Priority: **LOW** (Nice to have: move to authenticated area)

---

## Recommended Security Roadmap

### Phase 1: Pre-Beta (Next 2 weeks) 🚨 BLOCKER
- [ ] Add API key/authentication on /v1/report (prevent spam)
- [ ] Add rate limiting on all endpoints (prevent DoS)
- [ ] Remove /public/threat-feeds.json (don't expose data)
- [ ] Add input validation on /v1/analyze and /v1/report
- [ ] Add HSTS header for HTTPS enforcement
- [ ] Add CSP header to frontend

### Phase 2: Beta Launch (Week 3)
- [ ] Add logging/audit trail to database
- [ ] Add request tracking (correlation IDs)
- [ ] Add monitoring alerts (spike in errors, requests)
- [ ] Document API key management
- [ ] Add Terms of Service & Privacy Policy

### Phase 3: Production (Week 4+)
- [ ] Add DDoS protection (Cloudflare, AWS Shield)
- [ ] Add secrets scanning (GitHub secret scanning)
- [ ] Add vulnerability scanning (Snyk, Dependabot)
- [ ] Add SIEM/security monitoring (LogRocket, Sentry)
- [ ] Add penetration testing

---

## Implementation Examples

### A. API Key Middleware (Prevent Spam)

```typescript
// packages/gate/src/security-middleware.ts
import crypto from "crypto";

const VALID_API_KEYS = new Set(
  (process.env.GENESIS_API_KEYS || "").split(",")
);

export const apiKeyMiddleware = (req: any, reply: any, done: any) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || !VALID_API_KEYS.has(apiKey as string)) {
    reply.status(401).send({ error: "Unauthorized: Invalid API key" });
    return;
  }

  // Attach authenticated user to request
  req.user = { apiKey };
  done();
};

export const generateApiKey = (): string => crypto.randomBytes(16).toString("hex");
```

Apply to POST endpoints:
```typescript
app.post("/v1/report", { onRequest: apiKeyMiddleware }, async (req, reply) => {
  // Only authorized callers reach here
  const reportId = `${req.user.apiKey}-${Date.now()}`;
  await intel.report({
    ...req.body,
    reporterId: reportId, // Track who reported
  });
});
```

### B. Rate Limiting (Prevent DoS)

```typescript
// Install: npm install @fastify/rate-limit
import rateLimit from "@fastify/rate-limit";

app.register(rateLimit, {
  max: 100, // Max 100 requests per window
  timeWindow: "15 minutes",
  allowList: ["127.0.0.1"], // Bypass for localhost
});

// Per-endpoint overrides:
app.post("/v1/analyze", { 
  config: { rateLimit: { max: 10, timeWindow: "1 minute" } }
}, async (req, reply) => {
  // Stricter limit for expensive analysis endpoint
});
```

### C. Input Validation (Prevent Crashes)

```typescript
// packages/gate/src/validation.ts
const isValidAddress = (addr: string): boolean =>
  /^0x[a-f0-9]{40}$/i.test(addr);

const isValidCategory = (cat: string): boolean =>
  ["phishing", "drainer", "malicious-contract", "decoy-tripwire"].includes(cat);

export const validateAnalyzeRequest = (body: any) => {
  const { tx } = body;
  if (!tx) throw new Error("Missing 'tx' field");
  if (typeof tx.chainId !== "number") throw new Error("Invalid chainId");
  if (!isValidAddress(tx.from)) throw new Error("Invalid 'from' address format");
  if (tx.to && !isValidAddress(tx.to)) throw new Error("Invalid 'to' address format");
  if (typeof tx.value !== "string") throw new Error("Invalid 'value' format");
  // ... etc
};

export const validateReportRequest = (body: any) => {
  if (!isValidAddress(body.address)) throw new Error("Invalid address");
  if (!isValidCategory(body.category)) throw new Error("Invalid category");
  if (typeof body.reporterId !== "string") throw new Error("Invalid reporterId");
  if (body.reporterId.length > 100) throw new Error("reporterId too long");
};

// Use in server
app.post("/v1/analyze", async (req, reply) => {
  try {
    validateAnalyzeRequest(req.body);
    // ... continue
  } catch (err) {
    reply.status(400).send({ error: (err as Error).message });
  }
});
```

### D. HSTS + CSP Headers (Browsers)

```typescript
// packages/site/next.config.ts
export default {
  headers: async () => {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains", // Force HTTPS for 1 year
          },
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' https://cdn.vercel-analytics.com;
              style-src 'self' 'unsafe-inline';
              connect-src 'self' https://genesis-gate.onrender.com;
              img-src 'self' data: https:;
              font-src 'self';
            `.replace(/\s+/g, " ").trim(),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ];
  },
};
```

---

## Security Checklist for Beta Launch

- [ ] Input validation on all endpoints
- [ ] Rate limiting active on all endpoints
- [ ] API key authentication on /v1/report
- [ ] /public/threat-feeds.json removed or protected
- [ ] Security headers (HSTS, CSP, X-Content-Type-Options)
- [ ] Error messages don't leak stack traces
- [ ] Logging enabled (who, what, when)
- [ ] Database backups tested
- [ ] SSL/TLS properly configured
- [ ] CORS origin restricted (not "*")
- [ ] No secrets in code, only env vars
- [ ] Tests cover error cases
- [ ] Monitoring/alerts configured

---

## Known Accepted Risks (for Beta)

1. **Public API endpoints** - By design, anyone can call /v1/analyze (no key needed)
   - Mitigated by: Rate limiting
   - Acceptance: Need free tier for community adoption

2. **Threat data copyright** - Using open-source threat feeds
   - Mitigated by: Attribution in reports (reporters[] array)
   - Acceptance: All sources allow redistribution

3. **Database on free tier** - Neon free tier has limits
   - Mitigated by: Can upgrade to paid anytime
   - Acceptance: Sufficient for beta (1M+ rows capacity)

---

## References

- [OWASP Top 10](https://owasp.org/Top10/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CWE: Common Weakness Enumeration](https://cwe.mitre.org/)
- [Fastify Security Best Practices](https://www.fastify.io/docs/latest/Guides/Security/)
