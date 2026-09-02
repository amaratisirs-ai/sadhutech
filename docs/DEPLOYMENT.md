# GENESIS Gate MVP — Deployment & Usage

**Complete pre-sign transaction firewall with real threat intel, persistent quorum storage, and wallet integration.**

## What's Built ✅

### 1. Real Threat Feed (`packages/gate/`)
- 10+ real incidents (Poly Network, Wormhole, Ronin, Curve exploit, etc.)
- Curated drainer & exploit addresses
- Extensible JSON feed format
- Auto-loads on server startup

### 2. PostgreSQL Persistent Store (`packages/gate/src/intel-postgres.ts`)
- Sybil-resistant quorum voting (counts distinct reporters)
- ACID-guaranteed threat counts
- Multi-instance deployment support (share threat intel across servers)
- Neon DB integration (or local PostgreSQL)
- Optional; falls back to in-memory if DATABASE_URL not set

### 3. WalletConnect Middleware (`packages/wc-middleware/`)
- Simple HTTP adapter for any WalletConnect wallet
- Analyzes transactions before signing
- Returns allow/warn/block + plain-English explanation
- No SDK overhead; just HTTP requests to `/v1/analyze`

### 4. Test Coverage
- ✅ 9/9 tests passing
- ✅ All scenarios (benign, unlimited, setApprovalForAll, Permit2, multicall, drainer)
- ✅ Quorum escalation & Sybil resistance verified

---

## Quick Start

### Development (In-Memory, No DB)

```bash
cd /Users/sitaram/Documents/sadhutech

# Install dependencies
pnpm install

# Run tests
pnpm test  # 9/9 passing ✅

# Run CLI demo (6 scenarios)
pnpm demo

# Start web server
pnpm gate  # Listens on http://localhost:8787
```

**Test in browser:**
- Open http://localhost:8787/
- Click scenario buttons or submit custom transaction
- View verdict + risk score

**Test via curl:**
```bash
curl -X POST http://localhost:8787/v1/analyze \
  -H 'content-type: application/json' \
  -d '{
    "tx": {
      "chainId": 1,
      "from": "0x1111111111111111111111111111111111111111",
      "to": "0x2222222222222222222222222222222222222222",
      "data": "0x095ea7b3000000000000000000000000000000000000000000000000000000000000deadffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
    }
  }'
```

Returns:
```json
{
  "verdict": "block",
  "score": 100,
  "plainEnglish": "Do NOT sign. One of the addresses involved is a community-confirmed scam/drainer. This lets 0x0000…dead spend an UNLIMITED amount of your tokens.",
  "findings": [...]
}
```

---

## Production Deployment

### With PostgreSQL (Neon DB)

**1. Create Neon project**
- Go to https://console.neon.tech
- Create database
- Copy connection string

**2. Set up schema**
```bash
psql "$DATABASE_URL" < packages/gate/data/migrations/001-threat-intel.sql
```

**3. Configure environment**
```bash
echo "DATABASE_URL=postgresql://user:password@your-neon-host/genesis" > .env
```

**4. Start server**
```bash
pnpm gate
```

Server logs: `[threat-intel] Using PostgreSQL mode (DATABASE_URL found)`

**Verify persistence:**
```bash
# Report a threat
curl -X POST http://localhost:8787/v1/report \
  -H 'content-type: application/json' \
  -d '{
    "address": "0x1234567890123456789012345678901234567890",
    "category": "drainer",
    "reporterId": "alice"
  }'

# Query Neon DB
psql "$DATABASE_URL" -c "SELECT address, category, reporters FROM threat_intel LIMIT 5;"
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Any Wallet                             │
│  (MetaMask, Rainbow, Ledger, Phantom, etc.)              │
└────────────────────┬────────────────────────────────────┘
                     │ eth_signTransaction
                     ↓
┌─────────────────────────────────────────────────────────┐
│          GENESIS Gate API (:8787)                        │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ /v1/analyze    → decode → evaluate → verdict    │  │
│  │ /v1/report     → add reporter → quorum check    │  │
│  │ /health        → health check                   │  │
│  └──────────────────────────────────────────────────┘  │
│                     ↓                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │          Threat Intelligence                     │  │
│  │                                                  │  │
│  │  In-Memory (dev)  or  PostgreSQL/Neon (prod)    │  │
│  │  • Real threat feed (10+ incidents)             │  │
│  │  • Quorum voting (Sybil-resistant)              │  │
│  │  • Multi-instance sync (via shared DB)          │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Packages

| Package | Purpose | Status |
|---------|---------|--------|
| `@genesis/shared` | Domain types & constants | ✅ Complete |
| `@genesis/gate` | Core firewall (decode → evaluate → verdict) | ✅ Complete |
| `@genesis/wc-middleware` | WalletConnect HTTP adapter | ✅ Complete |

---

## API Endpoints

### `POST /v1/analyze`
Analyze transaction before signing.

**Request:**
```json
{
  "tx": {
    "chainId": 1,
    "from": "0x...",
    "to": "0x...",
    "value": "0",
    "data": "0x..."
  }
}
```

**Response:**
```json
{
  "verdict": "allow|warn|block",
  "score": 0-100,
  "plainEnglish": "User-friendly explanation",
  "findings": [
    {
      "id": "approval.unlimited",
      "severity": "high",
      "title": "Grants unlimited token allowance",
      "description": "..."
    }
  ],
  "simulation": { "approvals": [...], "assetChanges": [...] }
}
```

### `POST /v1/report`
Report a suspected malicious address.

**Request:**
```json
{
  "address": "0x...",
  "category": "drainer|malicious-contract|decoy-tripwire|sanctioned|phishing",
  "reporterId": "alice"
}
```

**Response:**
```json
{
  "address": "0x...",
  "category": "drainer",
  "reports": 2,
  "quorumReached": false,
  "firstSeen": 1691234567890,
  "lastSeen": 1691234567890
}
```

### `GET /health`
Health check.

**Response:**
```json
{
  "status": "ok",
  "service": "genesis-gate"
}
```

---

## Integration Guides

- [WalletConnect Integration](WALLETCONNECT-INTEGRATION.md) — HTTP API for wallets
- [PostgreSQL Setup](POSTGRES-SETUP.md) — Neon DB configuration
- [Engineering Reference](engineering-reference.md) — Full technical documentation

---

## Development Workflow

### Add New Threat Category

1. Update `@genesis/shared/src/index.ts` → `ThreatCategory`
2. Add rule logic to `packages/gate/src/rules.ts`
3. Add test in `packages/gate/src/analyze.test.ts`
4. Run `pnpm test` (must pass)

### Add New Decoder

1. Add function to `packages/gate/src/decode.ts`
2. Update SUSPECT_ABI to recognize method
3. Add test case
4. Run `pnpm test`

### Deploy to Production

1. Set `DATABASE_URL` (Neon or local PostgreSQL)
2. Run schema migration: `psql "$DATABASE_URL" < packages/gate/data/migrations/001-threat-intel.sql`
3. Start server: `pnpm gate`
4. Verify logs: `[threat-intel] Using PostgreSQL mode`

---

## Security Model

**What GENESIS Protects Against:**
- ✅ Unlimited token approvals (infinite allowance)
- ✅ NFT operator grants (setApprovalForAll)
- ✅ Batched hidden actions (multicall)
- ✅ Permit2 gasless approvals with unlimited amounts
- ✅ Known drainers, exploits, rug pulls
- ✅ Honeypots and decoy tokens

**What GENESIS Does NOT Protect Against:**
- ❌ "Hack-proof" — no system is un-hackable. GENESIS is one layer in defense-in-depth.
- ❌ Private key theft (use hardware wallets)
- ❌ Phishing the seed phrase (use secure practices)
- ❌ Novel zero-day exploits (detection happens after discovery)

**Residual Risks:**
- Feed lag (new drainers before reports reach quorum)
- False negatives (benign txs that look risky but aren't)
- False positives (risky txs marked safe)
- Quorum Sybil attacks (reports from coordinated bad actors)

All risks are documented in [threat-model.md](threat-model.md).

---

## Next Steps (Backlog)

1. **MetaMask Snap** — In-wallet verdict rendering (scaffold exists, needs mm-snap build)
2. **Real-time threat feed sync** — Scheduled updates from external threat sources
3. **Advanced analytics** — Dashboard of most-blocked txs, false-positive tracking
4. **Fork-backed simulator** — Anvil integration for accurate multicall decoding
5. **Hardware key binding** — Secure element integration (deferred, escalation required)
6. **PQC key schema** — Post-quantum cryptography support (later phases)

---

## Support & Feedback

- **Architecture questions?** See [AGENTS.md](../AGENTS.md) and [engineering-reference.md](engineering-reference.md)
- **Integration help?** Check [WALLETCONNECT-INTEGRATION.md](WALLETCONNECT-INTEGRATION.md)
- **Database questions?** See [POSTGRES-SETUP.md](POSTGRES-SETUP.md)
- **Threat model?** See [threat-model.md](threat-model.md)

---

**Built:** September 2026 | **Version:** 0.0.1-MVP | **License:** TBD
