# API Key Setup Guide for GENESIS Gate Beta

## Quick Start (5 minutes)

### Step 1: Generate API Keys

```bash
# Generate a new API key (run locally)
node -e "console.log('API Key: ' + require('crypto').randomBytes(16).toString('hex'))"

# Output:
# API Key: a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6

# Generate 3 beta tester keys:
for i in {1..3}; do node -e "console.log('Beta Tester ' + $i + ': ' + require('crypto').randomBytes(16).toString('hex'))"; done

# Output:
# Beta Tester 1: a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6
# Beta Tester 2: f9e8d7c6b5a4039281706f5e4d3c2b1a
# Beta Tester 3: 1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d
```

### Step 2: Set Environment Variable

**Option A: Local Testing**

```bash
export GENESIS_API_KEYS="a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6,f9e8d7c6b5a4039281706f5e4d3c2b1a,1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d"

# Test locally
pnpm --filter @genesis/gate dev
```

**Option B: Production (Render.com)**

1. Go to https://dashboard.render.com
2. Select "genesis-gate" service
3. Click "Environment"
4. Add new environment variable:
   - Name: `GENESIS_API_KEYS`
   - Value: `key1,key2,key3`
5. Click "Save"
6. Auto-deploys in ~1 minute

### Step 3: Test API Key Auth

```bash
# ✅ Success (with valid key)
curl -X POST https://genesis-gate.onrender.com/v1/report \
  -H "Content-Type: application/json" \
  -H "X-API-Key: a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6" \
  -d '{
    "address": "0x7f367cc41522ce07afd9291ff41ee04aaf1dbd14",
    "category": "phishing",
    "reporterId": "tester1",
    "description": "Known phishing site"
  }'

# Response:
# {
#   "address": "0x7f367cc41522ce07afd9291ff41ee04aaf1dbd14",
#   "category": "phishing",
#   "reports": 1,
#   "quorumReached": false,
#   "firstSeen": 1704067200000,
#   "lastSeen": 1704067200000
# }

# ❌ Failure (missing key)
curl -X POST https://genesis-gate.onrender.com/v1/report \
  -H "Content-Type: application/json" \
  -d '{...}'

# Response:
# { "error": "Unauthorized: Missing X-API-Key header" }

# ❌ Failure (invalid key)
curl -X POST https://genesis-gate.onrender.com/v1/report \
  -H "X-API-Key: invalid_key_here" \
  -d '{...}'

# Response:
# { "error": "Unauthorized: Invalid API key" }
```

---

## Rate Limiting

### Limits

- **Rate Limit**: 100 requests per 15 minutes per IP address
- **Endpoint**: Applied to both `/v1/analyze` and `/v1/report`
- **Response**: 429 (Too Many Requests) when exceeded

### Headers Returned

```bash
curl -i https://genesis-gate.onrender.com/v1/report ...

# HTTP/1.1 200 OK
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 97
# X-RateLimit-Reset: 1704067800
```

### When Rate Limited

```bash
# After 100 requests in 15 minutes:
{
  "error": "Too many requests",
  "retryAfter": 234  # seconds to wait
}

# HTTP 429 Too Many Requests
# Retry-After: 234
```

### Bypass for Local Dev

```bash
# Rate limiter uses IP address
# localhost (127.0.0.1) can make unlimited requests locally
# This is built-in for development convenience
```

---

## Input Validation

### /v1/analyze Validation

All of these will return 400 with detailed errors:

```bash
# ❌ Missing chainId
curl -X POST https://genesis-gate.onrender.com/v1/analyze \
  -d '{"tx":{"from":"0x..."}}'

# Response:
# {
#   "error": "Invalid request",
#   "details": [
#     { "field": "tx.chainId", "error": "chainId must be a positive integer" }
#   ]
# }

# ❌ Invalid address format
curl -X POST https://genesis-gate.onrender.com/v1/analyze \
  -d '{"tx":{"chainId":1,"from":"notanaddress"}}'

# Response:
# {
#   "error": "Invalid request",
#   "details": [
#     { 
#       "field": "tx.from", 
#       "error": "Invalid 'from' address: must be 0x-prefixed 40 hex chars. Got: notanaddress" 
#     }
#   ]
# }

# ✅ Valid request
curl -X POST https://genesis-gate.onrender.com/v1/analyze \
  -d '{
    "tx": {
      "chainId": 1,
      "from": "0x1111111111111111111111111111111111111111",
      "to": "0x2222222222222222222222222222222222222222",
      "value": "1000000000000000000",
      "data": "0x"
    }
  }'
```

### /v1/report Validation

```bash
# ❌ Invalid address
curl -X POST https://genesis-gate.onrender.com/v1/report \
  -H "X-API-Key: key" \
  -d '{"address":"invalid","category":"phishing","reporterId":"me"}'

# Response:
# {
#   "error": "Invalid request",
#   "details": [
#     { 
#       "field": "address", 
#       "error": "Invalid address: must be 0x-prefixed 40 hex chars. Got: invalid" 
#     }
#   ]
# }

# ❌ Invalid category
curl -X POST https://genesis-gate.onrender.com/v1/report \
  -H "X-API-Key: key" \
  -d '{"address":"0x7f367cc41522ce07afd9291ff41ee04aaf1dbd14","category":"unknown","reporterId":"me"}'

# Response:
# {
#   "error": "Invalid request",
#   "details": [
#     { 
#       "field": "category", 
#       "error": "Invalid category: must be one of phishing, drainer, malicious-contract, decoy-tripwire. Got: unknown" 
#     }
#   ]
# }

# ✅ Valid request
curl -X POST https://genesis-gate.onrender.com/v1/report \
  -H "X-API-Key: a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6" \
  -d '{
    "address": "0x7f367cc41522ce07afd9291ff41ee04aaf1dbd14",
    "category": "phishing",
    "reporterId": "my-bot-v1",
    "description": "Phishing site targeting Uniswap users"
  }'
```

---

## Distributing Keys to Beta Testers

### Email Template

```
Subject: GENESIS Beta Access - Your API Key

Hi [Name],

Thanks for joining the GENESIS beta! Here's your API key to test the threat reporting API.

API Key: a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6

USAGE:

1. Report a threat:
curl -X POST https://genesis-gate.onrender.com/v1/report \
  -H "Content-Type: application/json" \
  -H "X-API-Key: a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6" \
  -d '{
    "address": "0x...",
    "category": "phishing",
    "reporterId": "your-identifier",
    "description": "Description of the threat"
  }'

2. Analyze a transaction:
curl -X POST https://genesis-gate.onrender.com/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "tx": {
      "chainId": 1,
      "from": "0x1111111111111111111111111111111111111111",
      "to": "0x...",
      "value": "1000000000000000000",
      "data": "0x"
    }
  }'

3. Check test page:
Open https://genesis-gate.onrender.com in your browser for interactive testing.

LIMITS:
- Rate limit: 100 requests per 15 minutes
- Can submit up to 10 threats per day
- Will add real threats from multiple sources

FEEDBACK:
Please reply to this email with:
- Any bugs or issues
- Feature requests
- Performance observations
- Questions

Thanks for testing!
```

---

## Key Management Best Practices

### Rotation

```bash
# Generate new key
NEW_KEY=$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")

# Update in Render
# GENESIS_API_KEYS=old_key1,old_key2,new_key

# After 1 week, remove old keys
# GENESIS_API_KEYS=new_key

# Old requests will fail with 401 (expected)
```

### Revocation

```bash
# To revoke a specific key:
# Remove from GENESIS_API_KEYS env var
# Example: "abc123,def456,ghi789" → "def456,ghi789"
# Auto-applies in ~30 seconds
```

### Audit Trail

```bash
# Each successful report is logged in Render
# Look for:
# [threat_reported] address=0x... apiKey=a1b2c3d4...

# Failed attempts also logged:
# Unauthorized: Invalid API key
```

---

## Monitoring

### Check Rate Limit Status

```bash
# Response headers show remaining quota
X-RateLimit-Remaining: 87  # 87 requests left in this 15-min window
X-RateLimit-Reset: 1704067800  # Unix timestamp when window resets
```

### Monitor Usage

```bash
# Check Render logs
# Filter for: "[threat_reported]" or "unauthorized"

# Or use Render dashboard:
# https://dashboard.render.com → genesis-gate → Logs
```

---

## Troubleshooting

### "Missing X-API-Key header"

Make sure you're including the header:

```bash
# ❌ Missing header
curl -X POST https://genesis-gate.onrender.com/v1/report \
  -d '{"address":"0x..."}'

# ✅ With header
curl -X POST https://genesis-gate.onrender.com/v1/report \
  -H "X-API-Key: your_key_here" \
  -d '{"address":"0x..."}'
```

### "Invalid API key"

Key might be:
- Mistyped or copied wrong
- Expired (ask admin for new one)
- Not set in environment (check Render environment variables)

Solution:
```bash
# Generate new key
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Update in Render dashboard
```

### "Too many requests"

You've exceeded 100 requests in 15 minutes. Wait for `retryAfter` seconds:

```bash
# Response has Retry-After header
X-RateLimit-Reset: 1704067800

# Calculate seconds to wait
DATE_NOW=$(date +%s)
RESET_TIME=1704067800
WAIT=$((RESET_TIME - DATE_NOW))
echo "Wait $WAIT seconds"
```

### "Invalid request" / Validation errors

Check the `details` array for which fields are wrong:

```json
{
  "error": "Invalid request",
  "details": [
    { "field": "address", "error": "..." },
    { "field": "category", "error": "..." }
  ]
}
```

Fix each field and retry.

---

## Environment Setup Checklist

- [ ] Generate API keys locally
- [ ] Set `GENESIS_API_KEYS` environment variable in Render
- [ ] Test with curl (both success and failure cases)
- [ ] Verify rate limiting works
- [ ] Verify input validation works
- [ ] Test /v1/analyze (no auth needed)
- [ ] Test /v1/report (auth needed)
- [ ] Distribute keys to beta testers
- [ ] Monitor usage in Render logs
- [ ] Set rotation schedule (weekly/monthly)

---

## Next Steps

1. **Security Headers**: All responses include HSTS, CSP, X-Frame-Options (no action needed)
2. **CORS**: Limited to known origins (localhost, vercel.app, render.com)
3. **Audit Logging**: Each report includes apiKey (first 8 chars) in logs
4. **Monitoring**: Set up alerts if error rate > 1% (TODO)
5. **User Accounts**: When adding user signup, migrate to Supabase Auth (TODO)

See docs/AUTH-STRATEGY.md for full auth options.
