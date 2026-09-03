# Production Deployment: Site + Database

This guide covers deploying GENESIS dashboard (Next.js site) + gate (Node.js API) + PostgreSQL to production.

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  Vercel (Site)                                      │
│  ├─ Next.js dashboard (pages, API routes)           │
│  ├─ /api/threats (threat feed JSON)                 │
│  ├─ /demo (interactive tester)                      │
│  └─ /api-explorer (HTTP client)                     │
└─────────────────────────────────────────────────────┘
         ↓ (CORS-enabled HTTP)
┌─────────────────────────────────────────────────────┐
│  Render/Railway/Your Host (Gate API)                │
│  ├─ POST /v1/analyze (decode + score transactions)  │
│  ├─ POST /v1/report (threat reporting + quorum)     │
│  ├─ GET /health (status)                            │
│  └─ GET / (HTML tester UI)                          │
└─────────────────────────────────────────────────────┘
         ↓ (SQL connection pool)
┌─────────────────────────────────────────────────────┐
│  Neon PostgreSQL (Serverless)                       │
│  ├─ threat_intel table (addresses, reporters)       │
│  ├─ Auto-scaling, backups, point-in-time recovery   │
│  └─ Free tier: 3 branches, 5GB storage              │
└─────────────────────────────────────────────────────┘
```

## Step 1: Deploy Gate API

### Option A: Render (Recommended)

1. **Create Render account** → [render.com](https://render.com)
2. **Connect GitHub** → Grant repo access
3. **Create Web Service**:
   - Name: `genesis-gate`
   - Root Directory: (leave blank or `.`)
   - Build Command: `pnpm install && pnpm build`
   - Start Command: `pnpm --filter @genesis/gate start`
   - Env vars:
     ```
     DATABASE_URL=postgresql://user:pass@host/genesis
     PORT=8787
     NODE_ENV=production
     TENDERLY_API_KEY=<optional>
     TENDERLY_PROJECT=<optional>
     ```
4. **Deploy** → Render auto-deploys on git push
5. **Get URL** → `https://genesis-gate.onrender.com`

### Option B: Railway

1. **Create Railway account** → [railway.app](https://railway.app)
2. **Deploy from GitHub** → Select repo
3. **Set environment variables** (same as above)
4. **Railway handles Node.js build automatically**

### Health Check

```bash
curl https://genesis-gate.onrender.com/health
# {"status":"ok","service":"genesis-gate"}
```

## Step 2: Deploy Neon Database

### 1. Create Neon Project

1. Sign in → [console.neon.tech](https://console.neon.tech)
2. Create project (e.g., "genesis-firewall")
3. Copy connection string: `postgresql://user:password@ep-xxx.neon.tech/genesis`

### 2. Run Schema Migration

```bash
# Get the SQL:
cat packages/gate/data/migrations/001-threat-intel.sql

# Option A: Via Neon console
# → SQL Editor → Paste + Run

# Option B: Via psql
psql "postgresql://user:password@ep-xxx.neon.tech/genesis" < packages/gate/data/migrations/001-threat-intel.sql
```

### 3. Seed Real Threat Data

```bash
# Gate auto-seeds on startup; verify with:
curl -X POST https://genesis-gate.onrender.com/v1/analyze \
  -H "content-type: application/json" \
  -d '{"tx":{"chainId":1,"from":"0x1111...","to":"0x2222...","data":"0x095ea7b3000000000000000000000000000000000000000000000000000000000000deadffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"}}'

# Should BLOCK (known drainer at 0x...dead)
```

### 4. Monitor Database

Neon console → Monitoring:
- **Connections**: Should be < 10 for gate + site
- **Query latency**: < 10ms typical
- **Storage**: monitor against plan limit

Scale-up if needed:
- Upgrade to Pro plan for higher connection limits
- Add read-only replicas for analytics

## Step 3: Deploy Site (Next.js) to Vercel

**✅ You have a paid Vercel plan** — use it for the site.

### Setup

1. **Add project to Vercel** → [vercel.com](https://vercel.com)
   - Connect GitHub repo
   - Import project
2. **Build settings** (auto-detected):
   - Framework: Next.js
   - Build Command: `pnpm --filter @genesis/site build`
   - Install Command: `pnpm install`
   - Output Directory: `.next`
3. **Environment variables**:
   ```
   NEXT_PUBLIC_GATE_URL=https://genesis-gate.onrender.com
   ```
4. **Domain** (sadhutech.com):
   - Vercel dashboard → Project → Settings → Domains
   - Add: `sadhutech.com`
   - Update DNS CNAME in Cloudflare: `_vercel-challenge.sadhutech.com`
   - Takes ~5 min to propagate
5. **Deploy** → Auto-deploys on push to main

**Result**: https://sadhutech.com → Next.js dashboard

### Site Environment Config

Update site to dynamically use gate URL:

```typescript
// packages/site/app/demo/page.tsx
const [gateUrl, setGateUrl] = useState(
  process.env.NEXT_PUBLIC_GATE_URL || "http://localhost:8787"
);
```

### Post-Deploy Verification

Visit site in browser:
- [Overview tab] → Hero + features + status
- [Demo tab] → Should connect to gate (test scenario)
- [Threat Feed tab] → Load via /api/threats endpoint
- [API Explorer tab] → Interactive POST testing

## Step 4: CORS & Security

### Enable CORS on Gate

Update `packages/gate/src/server.ts`:

```typescript
import cors from "@fastify/cors";

const server = fastify();
await server.register(cors, {
  origin: "https://genesis-site.vercel.app", // Update to your site
  methods: ["GET", "POST"],
  credentials: false,
});
```

Install dependency:

```bash
pnpm add @fastify/cors
```

### Security Headers

Add to `next.config.ts`:

```typescript
async headers() {
  return [
    {
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
      ],
    },
  ];
}
```

## Step 5: Monitor & Alert

### Render Alerts

- CPU > 80% for 5 min → scale up
- Memory > 90% → increase plan
- Error rate > 1% → check logs

### Neon Alerts

- Storage > 80% → upgrade plan
- Slow queries (> 100ms) → review indexes
- Connection pool exhaustion → reduce client count

### Logging

View logs:

```bash
# Render
curl https://api.render.com/v1/services/genesis-gate/logs \
  -H "Authorization: Bearer $RENDER_API_KEY"

# Neon
# → Console → Monitoring → Slow queries
```

## Step 6: Custom Domain (sadhutech.com)

### Add sadhutech.com to Vercel Site

1. Vercel Dashboard → Project Settings → Domains
2. Add: `sadhutech.com`
3. Update DNS in Cloudflare:
   ```
   CNAME sadhutech.com → cname.vercel-dns.com
   ```
4. SSL auto-provisioned (free)

**Result**: https://sadhutech.com → GENESIS dashboard

### Add Subdomain to Gate API (Optional)

If you want a shorter gate URL:
1. Cloudflare DNS → Add CNAME: `api.sadhutech.com → genesis-gate.onrender.com`
2. Update site env: `NEXT_PUBLIC_GATE_URL=https://api.sadhutech.com`
3. Render: Add custom domain in settings

## Deployment Checklist

- [ ] Database schema migrated to Neon
- [ ] Gate health endpoint responding (200 OK)
- [ ] Threat feed seeded (verify /v1/analyze blocks known drainer)
- [ ] Site builds and deploys to Vercel
- [ ] CORS configured (site can call gate API)
- [ ] Demo page successfully connects to gate
- [ ] Threat feed page loads data via /api/threats
- [ ] Custom domain configured (if desired)
- [ ] Monitoring alerts set up
- [ ] Backup strategy in place (Neon auto-backs up daily)

## Cost Estimate

| Service       | Tier       | Monthly | Notes |
|---------------|------------|---------|-------|
| Neon          | Free       | $0      | 5GB storage, 3 branches |
| Render        | Starter    | $7      | 750 hrs/mo free, then $0.25/hr |
| Vercel        | Paid Plan  | $0*     | You already have paid plan (no marginal cost) |
| **Marginal Cost** |        | **$7**  | Only Render; Neon + Vercel already covered |

*Vercel pro plan allows 50 concurrent deployments, 100 deployments/day, no usage limit

## Paid Plans: Real-Time & Latest Threats

### Tier Structure

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| **Threat Sources** | Community reports (curated) | Community + premium feeds | Custom + all sources |
| **Update Frequency** | Daily | Real-time (< 5 min) | Real-time + webhooks |
| **Threat Count** | ~4,100 | 50K+ | 500K+ |
| **API Rate Limit** | 100 req/15 min | 10K req/day | Custom |
| **False Positive Support** | Community vote | Priority review (4h) | Dedicated support |
| **Price** | Free | $29/mo | Custom |

### How It Works: Free vs Paid

**Free Tier (Current)**:
```
User → MetaMask Snap → /v1/analyze → Local threat DB (seeded at startup)
Threats updated: Daily via git commits
Source: Community reports only
```

**Paid Tier (Planned)**:
```
User → MetaMask Snap → /v1/analyze → API key required
                            ↓
                    Checks local cache (< 1s)
                    + Real-time feed (if expired)
                            ↓
        Premium sources (ChainAbuse, Chaos Labs, etc.)
Threats updated: Real-time via webhook ingestion
```

### Implementation Plan

#### Phase 1: Add API Key Authentication

```typescript
// packages/gate/src/server.ts
const authenticate = (request: Request): boolean => {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) return false; // Free tier = null
  
  const tier = getTierFromKey(apiKey); // Pro/Enterprise
  return tier !== null;
};

// Endpoint routing
app.post("/v1/analyze", async (req) => {
  const isPaid = req.headers["x-api-key"] ? true : false;
  
  if (isPaid) {
    // Fetch real-time threats + cache
    threats = await getRealtimeThreats();
  } else {
    // Use local seeded database
    threats = await getLocalThreats();
  }
  
  return analyze(tx, threats);
});
```

#### Phase 2: Real-Time Feed Ingestion

```typescript
// packages/gate/src/realtime-feed.ts
interface ThreatFeed {
  source: "chainabuse" | "chaos-labs" | "custom";
  apiKey: string;
  pollInterval: number; // 5 min for paid users
  webhookUrl?: string;  // For enterprise
}

async function syncRealtimeThreats() {
  // Poll premium sources every 5 minutes
  const newThreats = await Promise.all([
    fetchChainAbuseThreats(apiKey),
    fetchChaosLabsThreats(apiKey),
  ]);
  
  // Update cache (Redis or DB)
  await cacheThreats(newThreats, { ttl: 5 * 60 }); // 5 min cache
}

// Webhook for enterprise (immediate updates)
app.post("/v1/webhook/threat", (req) => {
  const threat = req.body;
  cacheThreats([threat], { ttl: Infinity }); // Persist immediately
  return { ok: true };
});
```

#### Phase 3: Tiered Response Metadata

```typescript
// API response includes tier info
{
  verdict: "BLOCK",
  score: 85,
  threats: [
    {
      address: "0x...",
      reason: "Known drainer",
      source: "community",     // Free tier sees this
      confidence: 0.95,
      lastSeen: "2026-09-01T10:30:00Z"
    },
    {
      address: "0x...",
      reason: "Active exploit pattern",
      source: "chaos-labs",    // Paid tier sees this
      confidence: 0.98,
      detected: "2026-09-02T08:15:00Z" // Real-time, not delayed
    }
  ],
  tier: "pro", // For analytics
  cacheAge: 120 // seconds (paid = always fresh)
}
```

#### Phase 4: Database Schema Update

```sql
-- Add to 001-threat-intel.sql
CREATE TABLE threat_sources (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL, -- 'community', 'chainabuse', 'chaos-labs', 'custom'
  api_key TEXT, -- For premium feeds
  poll_interval INT DEFAULT 300, -- seconds
  last_synced TIMESTAMP,
  active BOOLEAN DEFAULT true
);

CREATE TABLE api_keys (
  id BIGSERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  tier TEXT NOT NULL, -- 'free', 'pro', 'enterprise'
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  rate_limit INT, -- requests per day
  last_used TIMESTAMP
);

-- Index for rate limiting
CREATE INDEX idx_api_keys_last_used ON api_keys(last_used);
```

#### Phase 5: Rate Limiting

```typescript
// packages/gate/src/middleware/rate-limit.ts
async function checkRateLimit(apiKey: string): Promise<boolean> {
  const tier = await getTier(apiKey);
  const limits = {
    free: 100,      // per 15 min
    pro: 10000,     // per day
    enterprise: -1  // unlimited
  };
  
  const used = await redis.incr(`ratelimit:${apiKey}:${today}`);
  
  if (used > limits[tier]) {
    throw new Error("Rate limit exceeded");
  }
  
  return true;
}
```

### Real-Time Threat Architecture Options

**Option A: Webhook Push (Recommended)**
- Premium sources push threats to `/v1/webhook/threat`
- Enterprise tier: < 100ms latency
- Cost: Higher ops complexity, immediate protection
- Implementation: Set webhook URL in ChainAbuse/Chaos Labs dashboard

**Option B: Pull via Background Worker**
- Cron job polls every 5 minutes (for paid)
- Threats cached in Redis
- Cost: Lower latency variance
- Implementation: Use Render Background Jobs or separate worker service

**Option C: Hybrid**
- Webhook for critical threats (known drainer exploits)
- Poll for routine updates (phishing campaigns)
- Best of both: instant + comprehensive

### Cost Structure for Business

| Tier | Revenue Model | Margin |
|------|---------------|--------|
| Free | None (ads? or freemium upsell) | — |
| Pro ($29/mo) | Direct subscription | 70% (vendor cut ~30%) |
| Enterprise (custom) | Revenue share or fixed | 50% |

**Scaling Assumptions**:
- 1,000 free users → 10 Pro ($290/mo) → $3.5K/year at scale
- 100 Enterprise ($500-5K/mo) → $60-600K/year

### Roadmap: Launch Timeline (1-2 weeks)

**Already Done**:
- ✅ Database schema ready
- ✅ API endpoints working
- ✅ Rate limiting middleware coded
- ✅ Tests + deployment pipeline live

**Remaining Work**:
```
Day 1:     Add api_keys table + API key authentication middleware
Day 2-3:   Integrate first premium feed (ChainAbuse API)
Day 4:     Real-time cache (Redis or in-memory) + webhook handler
Day 5:     Add tier-aware response metadata + admin endpoints
Day 6-7:   QA + beta testing with 5 Pro accounts
           ↓
Week 2:    Public Pro tier launch ($29/mo)
```

**Total: 1-2 weeks to market**

### Monitoring Real-Time Threats

```bash
# Check feed freshness
curl https://api.sadhutech.com/v1/admin/feed-status \
  -H "x-api-key: $ADMIN_KEY" | jq .

# Response:
{
  "sources": [
    {"name": "community", "lastUpdate": "2026-09-02T12:34:00Z", "count": 4100},
    {"name": "chaos-labs", "lastUpdate": "2026-09-02T12:33:45Z", "count": 12500},
    {"name": "chainabuse", "lastUpdate": "2026-09-02T12:33:50Z", "count": 8300}
  ],
  "realTimeLatency": "2.3s", // Average time from threat detected to in-cache
  "falsePositives": 0.02, // Chaos Labs confidence threshold
}
```

---

## Troubleshooting

### Site can't reach gate

1. Check CORS headers: `curl -i -X OPTIONS https://gate-url/v1/analyze`
2. Verify gate is running: `curl https://gate-url/health`
3. Check firewall: Render/Railway may have outbound restrictions
4. Update `NEXT_PUBLIC_GATE_URL` env var

### Database connection timeouts

1. Check connection string: `psql "postgresql://..."`
2. Verify Neon network allow-list includes gate server IP
3. Check connection pooling: Neon provides `...pooler.neon.tech` endpoint for high-concurrency

### Deployment fails

1. Check build logs: Render/Vercel → Deployments → View logs
2. Verify `pnpm` version: `pnpm -v` (requires 10+)
3. Check env vars are set (no missing DATABASE_URL, etc.)

---

**Status**: ✅ MVP production-ready. Deploy with 3-command setup.
