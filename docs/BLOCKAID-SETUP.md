# Blockaid.io Enterprise Threat Intelligence Setup

Enable real-time threat data at enterprise scale (10,000+ threats, hourly updates).

## Quick Start

### 1. Get API Key
1. Visit https://blockaid.io/threat-intelligence
2. Sign up / log in to Blockaid dashboard
3. Generate API key under Threat Intelligence
4. Copy the key (format: `sk_xxx`)

### 2. Set Environment Variable

**For Render (Production):**
```bash
# Go to Render dashboard → Service → Environment
# Add new environment variable:
BLOCKAID_API_KEY=sk_your_api_key_here
```

**For Local Development:**
```bash
# Add to .env.local or shell
export BLOCKAID_API_KEY=sk_your_api_key_here

# Then run sync
pnpm --filter @genesis/gate sync
```

### 3. Verify Integration

After setting the API key, watch for logs:

```
[sync] Fetching Blockaid enterprise threats...
[sync] ✅ Blockaid loaded 5000 threats
[sync] Loaded 5021 total threats from 2 sources
```

Without the key, you'll see:
```
[sync] Blockaid API key not set (BLOCKAID_API_KEY env var). Skipping.
[sync] Loaded 21 total threats from 1 sources
```

## What You Get

### Enterprise Features
- ✅ **10,000+ real-time threats** (vs 21 curated)
- ✅ **Hourly updates** from Blockaid monitoring
- ✅ **Multi-chain coverage**: Ethereum, Polygon, Arbitrum, Optimism, Base, Blast
- ✅ **Risk scoring**: Critical, High, Medium, Low
- ✅ **Categories**: Drainers, malicious contracts, phishing, honeypots

### API Response Example
```json
{
  "addresses": [
    {
      "address": "0x1234567890123456789012345678901234567890",
      "label": "Known MEV sandwich attacker",
      "risk_level": "critical",
      "chain": "ethereum",
      "updated": "2026-09-02T22:00:00Z"
    }
  ]
}
```

## Pricing

Visit https://blockaid.io/pricing for current plans:
- **Free tier**: Limited addresses/month
- **Pro**: $99-999/month - 10,000+ threats, enterprise support
- **Enterprise**: Custom pricing with SLA

## Fallback Behavior

If Blockaid API fails or key is invalid:
1. Service logs error but **continues operation**
2. Falls back to 21 curated threats
3. Community reports still work
4. System stays online (graceful degradation)

## Troubleshooting

### API Key Rejected (401 Unauthorized)
```
[sync] ⚠️  Blockaid API key invalid or expired. Check BLOCKAID_API_KEY.
```

**Fix:**
- Verify key in Blockaid dashboard
- Check for typos in environment variable
- Ensure key hasn't expired
- Regenerate if needed

### Connection Timeout (Network Error)
```
[sync] Blockaid fetch error: fetch failed
```

**Fix:**
- Check internet connectivity
- Verify Blockaid API is online (https://status.blockaid.io)
- Try manual fetch: `curl -H "Authorization: Bearer $BLOCKAID_API_KEY" https://api.blockaid.io/v0/addresses`

### Rate Limiting (429 Too Many Requests)
Blockaid enforces rate limits per plan. If you hit limits:
- Adjust sync frequency (currently every 6 hours)
- Upgrade to higher tier plan
- Contact Blockaid support

## Sync Schedule

By default, GENESIS syncs threats:
- **On startup**: Loads latest threats immediately
- **Every 6 hours**: Background sync keeps data fresh

To change frequency, edit [packages/gate/src/sync-external-threats.ts](../packages/gate/src/sync-external-threats.ts):

```typescript
// In initSyncService():
const interval = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
// Change to:
const interval = 2 * 60 * 60 * 1000; // 2 hours
```

## Monitoring

Track Blockaid integration health:

```bash
# Check logs in Render
render.com → Service → Logs

# Search for:
[sync] Blockaid loaded X threats
```

For production alerts, set up monitoring on:
- Sync failure rate
- Threat count trends
- API response time

## Future Integrations

GENESIS roadmap supports layering multiple threat sources:

- **Phase 1 (Now)**: Blockaid + Curated + Community
- **Phase 2 (Q4)**: Add Chainalysis for enterprise KYC
- **Phase 3 (2027)**: Custom threat scoring model

Multiple sources are deduplicated by address, so integration costs scale linearly.

---

**Need Help?**
- Blockaid Docs: https://developer.blockaid.io/
- Blockaid Support: support@blockaid.io
- GENESIS Issues: https://github.com/amaratisirs-ai/sadhutech/issues
