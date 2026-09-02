# GENESIS Centralized API Architecture & Security Strategy

## Overview

This document defines the complete API ecosystem for GENESIS, including:
1. **Internal APIs** — GENESIS Gate service endpoints
2. **External Integrations** — Community threat feeds and paid services
3. **Security Framework** — Request signing, rate limiting, validation
4. **Client SDK** — Secure, cached, retry-enabled client library

---

## Part 1: Internal APIs (GENESIS Gate)

### Endpoint: `POST /v1/analyze`

**Purpose:** Analyze a transaction before signing (pre-sign gate)

**Request:**
```json
{
  "tx": {
    "chainId": 1,
    "from": "0x1111...",
    "to": "0x2222...",
    "data": "0x095ea7b3...",
    "value": "1000000000000000000"
  },
  "autonomy": "observe"
}
```

**Security:**
- Rate limit: 10 requests/sec per IP
- Max payload: 10 KB
- Nonce-based replay prevention (optional)
- CORS: Allow all origins (tighten in production)

**Response:**
```json
{
  "verdict": "warn",
  "score": 45,
  "findings": [
    {
      "id": "approval_unlimited",
      "severity": "high",
      "title": "Unlimited Token Approval",
      "description": "Granting unlimited access to your tokens"
    }
  ],
  "plainEnglish": "This transaction grants unlimited access to your USDC tokens. Only do this if you trust the recipient.",
  "summary": "Unlimited approval to 0x3333... for token USDC"
}
```

---

### Endpoint: `POST /v1/report`

**Purpose:** Submit a community threat report

**Request:**
```json
{
  "address": "0x7f367cc41522ce07afd9291ff41ee04aaf1dbd14",
  "category": "drainer",
  "reporterId": "snap_user_123"
}
```

**Security:**
- Rate limit: 1 report/sec per reporter
- **Requires Snap signature** (only signed reports count toward quorum)
- Nonce validation (prevent double-reporting)
- Request must be signed: `X-Signature: <HMAC-SHA256>`

**Response:**
```json
{
  "address": "0x7f367cc41522ce07afd9291ff41ee04aaf1dbd14",
  "category": "drainer",
  "reports": 3,
  "quorumReached": true,
  "firstSeen": 1693507200000,
  "lastSeen": 1693593600000
}
```

---

### Endpoint: `GET /health`

**Purpose:** Service availability check

**Response:**
```json
{
  "status": "ok",
  "service": "genesis-gate",
  "version": "1.0.0",
  "uptime": 86400,
  "threatIntelLoaded": true
}
```

**Security:**
- Rate limit: 100 requests/sec per IP
- No authentication required
- No payload limit

---

### Endpoint: `POST /v1/threats/batch` (Future)

**Purpose:** Bulk threat lookup

**Request:**
```json
{
  "addresses": [
    "0x7f367cc41522ce07afd9291ff41ee04aaf1dbd14",
    "0xa8d0e6799f360c032b411d471c748ab132d67cb2"
  ]
}
```

**Security:**
- Rate limit: 5 requests/sec per IP
- Max 100 addresses per request
- Response cached for 1 hour per address

**Response:**
```json
[
  {
    "address": "0x7f367cc41522ce07afd9291ff41ee04aaf1dbd14",
    "category": "drainer",
    "reports": 3,
    "quorumReached": true
  },
  {
    "address": "0xa8d0e6799f360c032b411d471c748ab132d67cb2",
    "category": "malicious-contract",
    "reports": 12,
    "quorumReached": true
  }
]
```

---

## Part 2: External Threat Feed Integrations

### 1. Amber Alerts (Scam Sniffer)

| Property | Value |
|----------|-------|
| **API** | `https://api.scamsniffer.io/api/v1/alerts` |
| **Auth** | API Key (env: `SCAMSNIFFER_API_KEY`) |
| **Rate** | 60 req/min |
| **Sync** | Every 1 hour |
| **Trust Score** | 85/100 |
| **Data** | Drainers, phishing links, honeypots |

**Integration:**
```typescript
// Fetch from Scam Sniffer
const response = await fetch(`https://api.scamsniffer.io/api/v1/alerts?type=drainer`, {
  headers: { Authorization: `Bearer ${SCAMSNIFFER_API_KEY}` }
});
const alerts = await response.json();

// Merge into GENESIS threat intel (Hive layer)
for (const alert of alerts) {
  intelService.report({
    address: alert.contractAddress,
    category: 'drainer',
    reporterId: 'scamsniffer', // Curated feed
  });
}
```

---

### 2. Rekt Database

| Property | Value |
|----------|-------|
| **API** | `https://rekt.news/api/v1/exploits` |
| **Auth** | None (public) |
| **Rate** | 30 req/min |
| **Sync** | Every 6 hours |
| **Trust Score** | 90/100 |
| **Data** | Rug-pulls, major exploits, bridge hacks |

**Integration:**
```typescript
const exploits = await fetch('https://rekt.news/api/v1/exploits?format=json').then(r => r.json());
for (const exploit of exploits) {
  intelService.report({
    address: exploit.address,
    category: 'drainer', // Exploit = drainer
    reporterId: 'rekt.news',
  });
}
```

---

### 3. 0xScope (MEV Trackers)

| Property | Value |
|----------|-------|
| **API** | `https://api.0xscope.io/v1/attackers` |
| **Auth** | API Key (env: `OXSCOPE_API_KEY`) |
| **Rate** | 60 req/min |
| **Sync** | Every 2 hours |
| **Trust Score** | 75/100 |
| **Data** | MEV extractors, sandwich attackers |

**Integration:**
```typescript
const mevAttackers = await fetch('https://api.0xscope.io/v1/attackers?type=mev', {
  headers: { Authorization: `Bearer ${OXSCOPE_API_KEY}` }
}).then(r => r.json());

for (const attacker of mevAttackers) {
  intelService.report({
    address: attacker.address,
    category: 'malicious-contract', // MEV extractor = malicious
    reporterId: '0xscope',
  });
}
```

---

### 4. Chainalysis (Premium/Optional)

| Property | Value |
|----------|-------|
| **API** | `https://api.chainalysis.com/v1/threats` |
| **Auth** | API Key (env: `CHAINALYSIS_API_KEY`) |
| **Rate** | 30 req/min |
| **Sync** | Every 12 hours |
| **Trust Score** | 95/100 |
| **Status** | **Disabled by default** (paid tier) |
| **Data** | Ransomware, stolen funds, sanctioned addresses |

**Integration:**
```typescript
if (process.env.CHAINALYSIS_API_KEY) {
  const threats = await fetch('https://api.chainalysis.com/v1/threats', {
    headers: { Authorization: `Bearer ${CHAINALYSIS_API_KEY}` }
  }).then(r => r.json());

  for (const threat of threats) {
    intelService.report({
      address: threat.address,
      category: threat.category, // 'sanctioned', 'stolen_funds', etc
      reporterId: 'chainalysis',
      trusted: true, // High trust score = immediate confirmation
    });
  }
}
```

---

### 5. Etherscan Verified Scams

| Property | Value |
|----------|-------|
| **API** | `https://api.etherscan.io/api?module=account&action=getminedblocks` |
| **Auth** | API Key (env: `ETHERSCAN_API_KEY`) |
| **Rate** | 5 req/min (free tier) |
| **Sync** | Every 24 hours |
| **Trust Score** | 70/100 |
| **Data** | Community-reported scams |

---

### 6. Abuse.ch Chain Abuse

| Property | Value |
|----------|-------|
| **API** | `https://api.abuse.ch/v1/ethereum/scams` |
| **Auth** | None |
| **Rate** | 20 req/min |
| **Sync** | Every 6 hours |
| **Trust Score** | 80/100 |
| **Data** | Malware, abuse tracker |

---

## Part 3: Security Framework

### Request Signing (HMAC-SHA256)

All reports (`POST /v1/report`) and sensitive requests must be signed:

```typescript
import crypto from 'crypto';

const secret = process.env.GENESIS_SECRET_KEY;
const nonce = Math.random().toString(36).substring(7);
const timestamp = new Date().toISOString();

const message = JSON.stringify({
  address: "0x...",
  category: "drainer",
  reporterId: "snap_user_123",
  timestamp,
  nonce,
});

const signature = crypto
  .createHmac('sha256', secret)
  .update(message)
  .digest('hex');

// Send request with headers
fetch('http://localhost:8787/v1/report', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Signature': signature,
    'X-Timestamp': timestamp,
    'X-Nonce': nonce,
  },
  body: message,
});
```

---

### Rate Limiting

**Global:** 100 requests/sec per IP

**Per-endpoint:**
- `POST /v1/analyze`: 10 req/sec
- `POST /v1/report`: 1 req/sec (per reporter)
- `GET /health`: 100 req/sec
- `POST /v1/threats/batch`: 5 req/sec

**Enforcement:**
```typescript
// In-memory for MVP, Redis for production
if (!rateLimiter.isAllowed(clientIP + endpoint, limit)) {
  return reply.status(429).json({
    error: "Rate limited",
    retryAfter: 1,
  });
}
```

---

### Request Validation

All requests validated against schema:

```typescript
const schema = {
  tx: {
    type: "object",
    required: ["chainId", "from", "to"],
    properties: {
      chainId: { type: "number" },
      from: { type: "string", pattern: "^0x[0-9a-fA-F]{40}$" },
      to: { type: "string", pattern: "^0x[0-9a-fA-F]{40}$" },
    },
  },
};

// Validation returns 400 if invalid
```

---

### Replay Attack Prevention (Nonce)

All requests include a unique nonce:

```typescript
// Client-side
const nonce = `${Date.now()}_${Math.random()}`;
headers['X-Nonce'] = nonce;

// Server-side
nonceStore.add(nonce); // Returns false if already seen
```

---

## Part 4: Client SDK

### Installation

```bash
pnpm add @genesis/shared
```

### Basic Usage

```typescript
import { createGenesisClient } from '@genesis/shared';

const client = createGenesisClient({
  gateUrl: 'http://localhost:8787',
  autonomy: 'enforce',
});

// Analyze transaction
const analysis = await client.analyzeTransaction({
  tx: {
    chainId: 1,
    from: '0x...',
    to: '0x...',
    data: '0x...',
  },
});

if (analysis.verdict === 'block') {
  console.warn('❌ Transaction blocked');
  console.warn(analysis.plainEnglish);
} else if (analysis.verdict === 'warn') {
  console.warn('⚠️ High risk:', analysis.summary);
} else {
  console.log('✅ Safe to sign');
}
```

### Advanced Usage

```typescript
// Report a malicious address
await client.reportThreat({
  address: '0x...',
  category: 'drainer',
  reporterId: 'snap_user_123',
});

// Batch check threats
const threats = await client.checkThreats([
  '0x7f367cc41522ce07afd9291ff41ee04aaf1dbd14',
  '0xa8d0e6799f360c032b411d471c748ab132d67cb2',
]);

// Check service health
const health = await client.getHealth();
```

### Caching

SDK automatically caches:
- Threat intel: 60 min TTL
- Request analysis: 60 min TTL
- Configurable via `cacheTTLMinutes`

```typescript
const client = createGenesisClient({
  cacheThreatsLocally: true,
  cacheTTLMinutes: 120, // 2 hours
});

// Bypass cache if needed
await client.analyzeTransaction(request, { bypassCache: true });

// Clear cache
client.clearCache();
```

### Retry Logic

Automatic retries with exponential backoff:
- Max retries: 3
- Backoff: 100ms initial, doubles each retry
- Retryable: timeouts, connection errors, 5xx responses

---

## Part 5: Environment Configuration

### Required

```bash
GENESIS_GATE_URL=http://localhost:8787
GENESIS_SECRET_KEY=your-hmac-secret-key

# Threat feed APIs
SCAMSNIFFER_API_KEY=your-api-key
OXSCOPE_API_KEY=your-api-key
ETHERSCAN_API_KEY=your-api-key
```

### Optional (Premium)

```bash
CHAINALYSIS_API_KEY=your-api-key # Enables premium intel
METRICS_ENDPOINT=http://localhost:3001/metrics # Telemetry
```

---

## Part 6: Threat Intel Quorum Voting

### Confirmation Threshold

Address confirmed as threat when:
- **3+ distinct reporters** agree (default `DEFAULT_QUORUM`)
- **OR** it came from a **curated/trusted feed** (Rekt, Chainalysis, Amber)

**Weighted Voting (Future):**
```
Regular user report = 1 point
Amber Alerts report = 10 points
0xScope report = 8 points
Rekt Database = 12 points
Chainalysis report = 20 points (auto-confirms at 1)
```

---

## Part 7: Deployment Checklist

- [ ] Configure environment variables
- [ ] Set up Redis for distributed rate limiting (production)
- [ ] Enable HTTPS and set `requireHttps: true`
- [ ] Restrict CORS origins to known domains
- [ ] Set up monitoring/alerts for API errors
- [ ] Load threat feeds on startup
- [ ] Test request signing/verification
- [ ] Set up metrics collection endpoint
- [ ] Document API for client integrations
- [ ] Add API keys to secret management (e.g., AWS Secrets)

---

## Summary

**Centralized APIs** enable:
✅ **Consistency** — All endpoints follow same security model
✅ **Security** — Request signing, rate limiting, validation
✅ **Scalability** — External feeds pluggable, Redis-ready
✅ **Observability** — Centralized metrics and logging
✅ **Developer experience** — Single SDK, auto-caching, retry logic

**Community-powered** threat intel via:
✅ **Sybil resistance** — Quorum voting from distinct reporters
✅ **Feed aggregation** — Amber, Rekt, 0xScope, Chainalysis
✅ **Weighted trust** — Trusted feeds have higher priority
✅ **Open reporting** — `/v1/report` endpoint for community

This architecture scales from MVP (in-memory) to production (Redis, distributed quorum) without breaking changes.
