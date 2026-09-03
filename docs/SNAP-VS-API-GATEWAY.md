# GENESIS Deployment Strategy: Snap vs API Gateway

## Executive Summary

**CHOICE:** Build **API Gateway + SDK first**, then layer Snap on top.

**Why:** The API gateway is the foundation that the Snap depends on. Without it, the Snap is just a UI wrapper around a single local analysis engine. With it, the Snap becomes a powerful distributed security system.

---

## Option 1: MetaMask Snap-First Approach

### What Is It?

A MetaMask Snap is a sandboxed JavaScript program that runs **inside your MetaMask wallet** and intercepts transactions before signing.

```
User → MetaMask → [Snap runs here] → GENESIS analysis → Allow/Warn/Block
                  ↓
              Isolated runtime
              Local-only computation
```

### Pros ✅

- **Instant integration** — MetaMask installs it like a plugin
- **No wallet switching** — Runs in the wallet user already has
- **Zero backend dependency** — Works offline if cached
- **Lower latency** — No network round-trip for basic checks
- **User control** — They choose to install/update
- **Adoption advantage** — MetaMask has 30M+ users

### Cons ❌

- **Limited computation** — Can't do complex analysis in a Snap
- **No threat intel aggregation** — Can't call external APIs reliably
- **Single user's data** — No community quorum voting
- **Sandboxed environment** — Can't access browser APIs freely
- **Outdated threat data** — Threat feeds must be bundled in Snap
- **Multiple wallets problem** — Separate Snap for Trust Wallet, Coinbase, etc.
- **No backend coordination** — Each Snap instance is isolated
- **Size limits** — Snaps have strict bundle size limits (~3MB)

### Example Snap Flow

```typescript
// In MetaMask Snap
async function interceptTransaction(tx: TxRequest) {
  // ❌ Can't call external APIs (blocked by sandbox)
  // ❌ Can't access updated threat feeds (bundled data only)
  // ❌ Can't vote with community (isolated instance)
  
  // ✅ Can decode calldata locally
  const approvals = decodeERC20Approvals(tx.data);
  
  // ✅ Can check bundled threat list
  if (BUNDLED_THREAT_LIST.has(tx.to)) {
    return { verdict: 'block', reason: 'Known drainer' };
  }
  
  // ✅ Can do basic heuristics
  if (approvals.unlimited) {
    return { verdict: 'warn', reason: 'Unlimited approval' };
  }
  
  return { verdict: 'allow' };
}
```

### Reality Check

The MetaMask Snap approach **works for simple checks** but **fails at scale**:
- No access to real-time threat intel
- No community voting (Hive pillar)
- No weighted trust scoring across feeds
- No ability to pull from Rekt, DefiLlama, CertiK, etc.
- Can't verify against the latest exploits

**Result:** Users get false negatives. A drainer that entered the system 1 hour ago isn't in the bundled list.

---

## Option 2: Centralized API Gateway + SDK (Recommended)

### What Is It?

A backend service that provides transaction analysis via REST API, with a client SDK for any wallet/interface.

```
User Wallet          SDK Client              GENESIS Gate            Threat Feeds
─────────────────────────────────────────────────────────────────────────────────

MetaMask      ──→  GenesisClient  ──(HTTP)──→  /v1/analyze  ──→  Chainalysis
Trust Wallet  ──→      (cached)   ──────────→  Threat Intel  ──→  Rekt.news
Coinbase      ──→   (retry logic)             (quorum voting)  ──→  0xScope
Hardware      ──→                             (10 feeds)         ──→  + 6 more

Result: One backend, infinite wallet support
```

### Pros ✅

- **Centralized threat intel** — All 16+ feeds aggregated in one place
- **Real-time updates** — Threat data refreshed every 1-2 hours
- **Community voting** — Hive quorum works across all users
- **Scalable** — Add new feeds without wallet updates
- **Multi-wallet support** — One API for MetaMask, Trust Wallet, Coinbase, etc.
- **Advanced features** — Machine learning, advanced risk scoring
- **Analytics** — Understand what's being targeted
- **Compliance-ready** — Can log threats for regulatory reporting
- **Mobile-friendly** — Works with any HTTP client (mobile wallets, etc.)
- **Webhook option** — Can push alerts to users
- **Versioning** — API v1, v2, v3 without breaking clients

### Cons ❌

- **Network latency** — ~100-500ms per request
- **Backend dependency** — Requires running a server (cost)
- **Privacy considerations** — Wallet sees what you're analyzing (mitigated by not logging addresses)
- **Requires distribution** — Need to get users to adopt the SDK/integration

### Example API Flow

```typescript
// In any wallet/app
import { createGenesisClient } from '@genesis/shared';

const client = createGenesisClient({
  gateUrl: 'https://gate.genesis-security.io',
  autonomy: 'enforce',
});

// Analyze transaction
const analysis = await client.analyzeTransaction({
  tx: {
    chainId: 1,
    from: userAddress,
    to: targetAddress,
    data: calldata,
  },
});

if (analysis.verdict === 'block') {
  showBlockPage(analysis.plainEnglish); // "This is a known drainer"
} else if (analysis.verdict === 'warn') {
  showWarningDialog(analysis.findings); // "Unlimited approval + suspicious spender"
}
```

### What This Unlocks

✅ **Hive Pillar Works**: Community reports → quorum voting → confirmed threats
✅ **Real Threat Data**: Chainalysis + Rekt + DefiLlama + Amber all voting
✅ **Zero-Day Detection**: New exploit detected by CertiK → propagates to all users in <1 hour
✅ **Mobile Support**: Works on Metamask Mobile, Trust Wallet, Coinbase Wallet
✅ **Hardware Wallets**: Ledger Live can show risk before signing
✅ **Enterprise Adoption**: Can require API key auth for compliance customers
✅ **Future-Proof**: Add new feeds without redeploying anything on client side

---

## Option 3: Hybrid (Recommended Long-term)

### Architecture

```
Phase 1: API Gateway Only
User Wallet → SDK Client → GENESIS Gate → All threat intel

Phase 2: Add Snap (Optional Layer)
User Wallet (with Snap installed)
     ↓
  Snap checks local cache
     ↓
  [Cache hit?] → Instant response (even offline)
     ↓
  [Cache miss?] → Call SDK → GENESIS Gate → Update cache → Respond

Result: Best of both worlds
- Snap for instant local checks
- API Gateway for comprehensive analysis
- Hybrid caching strategy
```

### Benefits

✅ **Low latency** — Snap cache for common addresses
✅ **Full coverage** — API gateway for comprehensive analysis
✅ **Offline capable** — Snap works without network
✅ **User choice** — Install Snap for speed boost, or just use SDK
✅ **Instant adoption** — API works day 1; Snap adds polish later

---

## Comparison Table

| Feature | Snap-Only | API Gateway | Hybrid |
|---------|-----------|-------------|--------|
| **Real-time threat intel** | ❌ No | ✅ Yes | ✅ Yes |
| **Community voting** | ❌ No | ✅ Yes | ✅ Yes |
| **Multiple wallets** | ❌ No | ✅ Yes | ✅ Yes |
| **Instant (no network)** | ✅ Yes | ❌ No | ✅ Yes |
| **Complex analysis** | ❌ Limited | ✅ Yes | ✅ Yes |
| **Scalable feeds** | ❌ No | ✅ Yes | ✅ Yes |
| **Mobile support** | ❌ Limited | ✅ Yes | ✅ Yes |
| **Backend dependency** | ❌ No | ✅ Yes | ✅ Yes |
| **Implementation complexity** | 🟢 Low | 🟡 Medium | 🔴 High |
| **Time to launch** | 🟢 2 weeks | 🟡 4 weeks | 🔴 8 weeks |
| **User adoption** | 🟡 Medium | 🟡 Medium | 🟢 High |
| **Attack surface** | 🟢 Small | 🟡 Medium | 🔴 Large |

---

## Deployment Roadmap

### Phase 1: API Gateway Foundation (Weeks 1-4)

**Build:**
```
✅ GENESIS Gate (/v1/analyze, /v1/report, /health)
✅ SDK Client (GenesisClient class)
✅ Threat Intel Pipeline (6 core feeds)
✅ Security Middleware (rate limiting, signing)
✅ Docker container + deployment config
```

**Ship:** Open beta API to early integrators
- Etherscan API integration
- Rabby Wallet integration (quick win)
- Web tester (cli tool)

**Metrics:** ✅ 1K tx/day analyzed, 0 attacks blocked

---

### Phase 2: Ecosystem Integration (Weeks 5-8)

**Build:**
```
✅ WalletConnect middleware (any WalletConnect wallet gets GENESIS)
✅ Browser extension (inject analysis into web3 apps)
✅ Public API docs + SDKs (TypeScript, Python, Go)
✅ Extended threat feeds (10+ sources)
```

**Ship:** Production API at `gate.genesis-security.io`
- Integrate with Trust Wallet first, then Rabby, MathWallet, Tally Ho
- Publish npm @genesis/sdk
- Launch bug bounty program

**Metrics:** ✅ 10K tx/day, 2-3 drainers blocked/week

---

### Phase 3: MetaMask Snap (Weeks 9-12)

**Build:**
```
✅ MetaMask Snap that calls API Gateway
✅ Local threat cache (for offline checks)
✅ Hybrid decision logic (cache + network)
✅ User preferences (custom risk thresholds)
```

**Ship:** MetaMask Snap public release
- Listed in MetaMask official Snaps directory
- Auto-updates threat cache
- Shows risk badge before signing

**Metrics:** ✅ 100K tx/day, 30% reduction in successful drains

---

### Phase 4: Community Layer (Weeks 13+)

**Build:**
```
✅ DAO governance (community votes on threat categories)
✅ Reward system (users earn tokens for reporting)
✅ On-chain threat registry (IPFS + blockchain)
✅ Decentralized quorum (no single GENESIS server)
```

**Ship:** Community-powered Hive
- Users vote on verdicts
- Earn $GENESIS for accurate reports
- Treasury funds security research

**Metrics:** ✅ Autonomous ecosystem, 1M+ daily users

---

## Decision Framework

### Choose API Gateway If:

1. **You want real impact immediately**
   - Snap-only can't access threat feeds
   - API can integrate with Rekt, DefiLlama, CertiK from day 1

2. **You need multi-wallet support**
   - One API = MetaMask + Trust Wallet + Coinbase + Ledger + everything
   - Snap = one wallet at a time

3. **You want to build a community**
   - API enables quorum voting (Hive pillar)
   - Snap = isolated instances, no voting

4. **You need to scale features fast**
   - Add new threat feed → everyone gets it instantly
   - Snap → need to push updates to 30M+ users

5. **You want to enable future integrations**
   - API Gateway is the foundation for everything else
   - Snap, CLI, browser extension all depend on it

### Choose Snap If:

1. **You want instant MetaMask adoption** (short-term)
   - MetaMask users get 1-click install
   - But limited to local checks only

2. **You want zero backend costs** (not realistic for security)
   - Snap can work offline
   - But can't detect new exploits

3. **You want to prove concept first**
   - Build Snap MVP in 2 weeks
   - Migrate to API Gateway when you need scale

---

## Recommended Decision: **API Gateway + SDK FIRST**

### Why:

1. **API is the foundation** — Snap depends on it anyway
2. **Better for your 4-pillar architecture** — Hive needs centralized quorum
3. **Scalable from day 1** — Don't hit a wall and rebuild
4. **Multi-wallet from day 1** — Reach more users
5. **Real threat intel** — Not bundled data that's stale

### Implementation:

```bash
# Week 1: Deploy GENESIS Gate
pnpm gate  # Start API server

# Week 2: Launch SDK
npm publish @genesis/sdk

# Week 3: Integrate with first partner
# (Rabby Wallet, Etherscan, or web3 app)

# Week 4: Public API at gate.genesis-security.io

# Then later (optional): Add MetaMask Snap as convenience layer
```

### Product Rollout Sequence

1. **WalletConnect onboarding, starting with Trust Wallet** as the first production mobile flow.
2. **MetaMask Snap** for users who want direct in-wallet protection in MetaMask.
3. **API Explorer / SDK** for developers and partner wallets to test and integrate the firewall.

### Users Get:

✅ **Week 1:** Any wallet can use GENESIS via SDK
✅ **Week 2:** Web3 apps can integrate risk checking
✅ **Week 3:** Community reports flow into quorum voting
✅ **Month 2:** MetaMask Snap for faster checks
✅ **Month 3:** 10+ threat feeds aggregated
✅ **Month 4:** Decentralized governance (DAO)

---

## If You Go Snap-Only (Why This Fails)

```
Week 1: Launch MetaMask Snap ✅
Users install it, analyze 100 transactions
30 are drainers that aren't in the bundled list ❌
"This tool doesn't catch real threats" ❌
Users uninstall ❌

Why: Snap can't access real threat intel
     No way to add Chainalysis, Rekt, DefiLlama without rebuilding everything
```

---

## Final Recommendation

**Start with API Gateway + SDK.** Then add Snap later as a UI convenience layer.

The architecture supports all four pillars:
- 🐝 **Hive** — Quorum voting (API coordinates)
- ⚛️ **Nucleus** — Layered checks (API enforces)
- 🔗 **Entanglement** — Trust bonds (API signs requests)
- 🌀 **Multiverse** — Risk stratification (API decides ALLOW/WARN/BLOCK)

**Snap can't do any of these alone.**

---

## Document This Decision

**Decision Log Entry:**

```
Date: 2026-09-02
Decision: Build Centralized API Gateway + SDK, then add Snap later
Rationale: 
  - Enables true Hive quorum voting (foundation pillar)
  - Multi-wallet support from day 1
  - Real threat intel integration (not bundled data)
  - Scalable architecture (add feeds without app updates)
  - Snap becomes optional UX layer, not core system

Timeline:
  - Phase 1 (Weeks 1-4): API Gateway + SDK + core feeds
  - Phase 2 (Weeks 5-8): WalletConnect + extended feeds + public API
  - Phase 3 (Weeks 9-12): MetaMask Snap (caching + offline)
  - Phase 4 (Weeks 13+): Community governance + DAO

Success Metrics:
  - Week 4: 1K transactions/day analyzed
  - Week 8: 10K transactions/day, 2-3 drainers blocked/week
  - Week 12: 100K transactions/day, Snap installed by 10K users
  - Month 6: 1M transactions/day, 30% of drains prevented
```

This gives you a clear path from MVP to ecosystem, with each phase building on the previous one.
