# Product Design: Threat Intelligence Content + Onboarding

---

## 1. NEWS/ARTICLES/SECURITY TAB

### User Need
Users want to understand:
- "Why was this address flagged?"
- "What kind of scam/exploit is this?"
- "What do I do if I got scammed?"
- "How do I report this?"

### Data Available from Threat Sources

**CryptoScamDB**:
- Has: Address, category, description, incident details
- Example: "Curve Vyper compiler exploit" + link to security advisory
- Can provide: Articles, incident descriptions

**Chainabuse**:
- Has: 815K+ user-reported scams with descriptions
- Has: Victim stories (pig butchering, blackmail, sextortion)
- Has: Top scam categories (phishing: 560k, rug pull: 387k)
- Can provide: Real scam examples, safety tips

**Scam Sniffer**:
- Has: Phishing addresses + metadata
- Can provide: How to identify phishing

**Blockaid** (when enabled):
- Has: Real-time threat metadata
- Can provide: Breaking news on new exploits

### Proposed UI: /news/page.tsx

```tsx
// pages/news/page.tsx
export default function NewsPage() {
  return (
    <div className="bg-gradient-to-b from-slate-950 to-slate-900 min-h-screen">
      {/* Header */}
      <div className="p-8 border-b border-teal-500/20">
        <h1 className="text-4xl font-bold text-teal-400">Threat Intel & Safety</h1>
        <p className="text-gray-400 mt-2">Latest scams, exploits, and security news</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 p-6 border-b border-teal-500/20 sticky top-0 bg-slate-950">
        <button className="px-6 py-2 rounded-lg bg-teal-500/20 border border-teal-500 text-teal-400">
          🚨 Breaking Threats
        </button>
        <button className="px-6 py-2 rounded-lg bg-slate-800 border border-slate-700 text-gray-400 hover:text-gray-300">
          📰 Articles & Research
        </button>
        <button className="px-6 py-2 rounded-lg bg-slate-800 border border-slate-700 text-gray-400 hover:text-gray-300">
          🛡️ Safety Tips
        </button>
        <button className="px-6 py-2 rounded-lg bg-slate-800 border border-slate-700 text-gray-400 hover:text-gray-300">
          📊 Threat Statistics
        </button>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-8">
        
        {/* Column 1: Breaking Threats */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-800/50 border border-red-500/20 rounded-lg p-6 hover:bg-slate-800 transition">
            <div className="flex gap-4">
              <div className="w-16 h-16 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 text-xs font-bold bg-red-500 text-white rounded">CRITICAL</span>
                  <span className="text-xs text-gray-500">2 hours ago</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Uniswap Phishing Campaign Detected
                </h3>
                <p className="text-gray-400 mb-4">
                  815 reported phishing addresses impersonating Uniswap wallet approval pages.
                  Users tricked into giving unlimited token approvals.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-2 py-1 text-xs bg-slate-700 text-gray-300 rounded">Phishing</span>
                  <span className="px-2 py-1 text-xs bg-slate-700 text-gray-300 rounded">Chainabuse Report</span>
                  <span className="px-2 py-1 text-xs bg-slate-700 text-gray-300 rounded">815+ victims</span>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <a href="/demo?threat=uniswap-phishing" className="text-teal-400 hover:text-teal-300 text-sm font-semibold">
                    Test with GENESIS → {">"}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-yellow-500/20 rounded-lg p-6">
            <div className="flex gap-4">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🪱</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 text-xs font-bold bg-yellow-500 text-white rounded">HIGH RISK</span>
                  <span className="text-xs text-gray-500">12 hours ago</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  MEV Bot Sandwich Attack Spike
                </h3>
                <p className="text-gray-400 mb-4">
                  Flashbots MEV extractors detected 3,400 sandwich attacks in 24h.
                  Targets: low-slippage DEX trades on Ethereum mainnet.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-2 py-1 text-xs bg-slate-700 text-gray-300 rounded">MEV Bot</span>
                  <span className="px-2 py-1 text-xs bg-slate-700 text-gray-300 rounded">Blockaid Alert</span>
                  <span className="px-2 py-1 text-xs bg-slate-700 text-gray-300 rounded">3,400 attacks</span>
                </div>
                <a href="/demo?threat=mev-extractor" className="inline-block mt-4 text-teal-400 hover:text-teal-300 text-sm font-semibold">
                  See Example →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Sidebar - Stats & Resources */}
        <div>
          <div className="bg-slate-800/50 border border-teal-500/20 rounded-lg p-6 mb-6 sticky top-32">
            <h4 className="font-bold text-teal-400 mb-4">🔥 Today's Threats</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Phishing</span>
                <span className="font-bold text-red-400">245</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Rug Pulls</span>
                <span className="font-bold text-orange-400">18</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">MEV Bots</span>
                <span className="font-bold text-yellow-400">3,400</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Exploits</span>
                <span className="font-bold text-purple-400">5</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-teal-500/20 rounded-lg p-6">
            <h4 className="font-bold text-teal-400 mb-4">📚 Resources</h4>
            <div className="space-y-2">
              <a href="/docs/phishing" className="block text-sm text-gray-400 hover:text-teal-400 transition">
                → How to Spot Phishing
              </a>
              <a href="/docs/approvals" className="block text-sm text-gray-400 hover:text-teal-400 transition">
                → Infinite Approvals Danger
              </a>
              <a href="/docs/recovery" className="block text-sm text-gray-400 hover:text-teal-400 transition">
                → If You Got Scammed
              </a>
              <a href="https://chainabuse.com" className="block text-sm text-gray-400 hover:text-teal-400 transition" target="_blank">
                → Report to Chainabuse
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Data Source Mapping

```typescript
// packages/site/app/news/utils.ts
interface ThreatArticle {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  category: "phishing" | "rug-pull" | "mev-bot" | "exploit" | "scam";
  source: "chainabuse" | "cryptoscamdb" | "scam-sniffer" | "blockaid";
  victimCount?: number;
  timestamp: Date;
  linkToDashboard?: string; // Link to /demo with threat address
  readMore?: string; // Link to full article
}

// Fetch real data every 6 hours
export async function fetchLatestThreats(): Promise<ThreatArticle[]> {
  // Call GENESIS backend endpoints
  const response = await fetch("https://genesis-gate.onrender.com/v1/threats/latest", {
    headers: { "x-api-key": process.env.NEXT_PUBLIC_THREAT_API_KEY },
  });
  
  return response.json();
}
```

### Backend Endpoint Needed

```typescript
// packages/gate/src/server.ts
interface ThreatNews {
  address: string;
  category: ThreatCategory;
  description: string;
  source: string;
  reporters: string[];
  victimCount?: number;
  firstSeen: Date;
  lastSeen: Date;
}

app.get("/v1/threats/latest", async (request, reply) => {
  // Get most recent 50 threats added in last 24h
  // Order by reporter count (high quorum = important)
  const threats = await intel.getLatestThreats({ hours: 24, limit: 50 });
  
  return {
    timestamp: new Date(),
    threats: threats.map(t => ({
      address: t.address,
      category: t.category,
      victimCount: t.reporters.length,
      source: t.reporters[0], // Primary source
      firstSeen: t.firstSeen,
      lastSeen: t.lastSeen,
    })),
  };
});
```

---

## 2. USER ONBOARDING & SUBSCRIPTION

### Current State (Missing)
- ❌ No welcome flow
- ❌ No user accounts
- ❌ No subscription/pricing page
- ❌ No integration guide for wallets
- ❌ No API key management

### Proposed Onboarding Flow

```
1. Landing Page (/) 
   ↓
2. "Try it Free" button 
   ↓
3. Demo Transaction (/demo)
   - Show example threat
   - Test with sample tx
   - Explain ALLOW/WARN/BLOCK verdicts
   ↓
4. Choose Integration:
   a) Wallet Integration (Phantom, Rabby, etc.)
      - Get setup guide
      - Get RPC endpoint
   b) SDK Integration (Developers)
      - Get API key
      - Get docs
      - Get sample code
   c) Just Watching (End users)
      - Subscribe to alerts
      - View threat reports
   ↓
5. Sign Up (Email)
   - Create account
   - Verify email
   ↓
6. Select Plan:
   - Free: 100 requests/day
   - Pro: Unlimited ($9.99/mo)
   - Team: Custom (contact sales)
```

### Pages to Add

```
/pricing          → Plans & pricing
/onboarding       → Interactive welcome flow
/dashboard        → User account dashboard
/settings         → API keys, preferences
/docs/sdk         → Integration guide
/docs/wallet      → Wallet setup guide
/success          → Post-signup congratulations
```

### Pricing Model (Recommendation)

```json
{
  "plans": [
    {
      "name": "Community",
      "price": "$0/mo",
      "limits": {
        "requests": 100,
        "period": "day",
        "concurrent": 2,
        "features": ["Basic threat lookup", "Reports"]
      },
      "target": "Individual users, evaluating"
    },
    {
      "name": "Pro",
      "price": "$9.99/mo",
      "limits": {
        "requests": 10000,
        "period": "day",
        "concurrent": 20,
        "features": [
          "Unlimited threat lookups",
          "Priority support",
          "Webhook alerts",
          "Custom integrations"
        ]
      },
      "target": "Wallets, dapps with <100k users"
    },
    {
      "name": "Enterprise",
      "price": "Custom",
      "limits": {
        "requests": "Unlimited",
        "period": "custom",
        "concurrent": 100,
        "features": [
          "Everything in Pro",
          "SLA guarantee (99.9% uptime)",
          "Dedicated account manager",
          "Custom threat feeds",
          "Data export",
          "On-premise deployment"
        ]
      },
      "target": "Major exchanges, protocols, custodians"
    }
  ]
}
```

### Key Features of Onboarding

1. **API Key Management** (/dashboard/keys)
   ```tsx
   // Show API keys
   // Ability to generate new keys
   // Rotate keys
   // Set rate limits per key
   // View usage stats
   ```

2. **Integration Guides** (/docs)
   ```tsx
   // 1. For Wallet Developers (WalletConnect, Snap Protocol)
   // 2. For dApp Developers (Web3.js, Ethers.js examples)
   // 3. For Non-Technical Users (just enable in wallet)
   ```

3. **Threat Subscriptions** (Email alerts)
   ```tsx
   // Users can subscribe to:
   // - New threats on chains they care about
   // - High-severity threats
   // - Phishing campaigns
   // - Custom addresses they watch
   ```

4. **Usage Dashboard** (Real-time stats)
   ```tsx
   // Show:
   // - Requests this month
   // - API latency
   // - Error rate
   // - Top called endpoints
   ```

---

## 3. CONTENT STRATEGY

### What to Display in News Tab

**From Chainabuse** (highest priority):
- User-submitted reports with victim counts
- Scam categories (Phishing, Rug Pull, Sextortion, etc.)
- Top contributors (PhishFort, ScamSniffer, etc.)
- Recent reports with timestamps

**From CryptoScamDB**:
- Historical incident data (Poly Network, Wormhole, etc.)
- Links to security advisories
- Chain-specific threats

**From Blockaid** (when available):
- Real-time breaking threats
- MEV bot activity spikes
- Zero-day exploits

**From Scam Sniffer**:
- Phishing address clusters
- Similar attack patterns

### Content Not to Show (Protect User Privacy)

```
❌ Real victim names or addresses
❌ Exact stolen amounts (only order of magnitude)
❌ Personal details from reports
✅ Scam patterns & detection methods
✅ Safety tips & prevention
✅ General statistics
```

### Content Licensing

Before displaying content from sources:
1. ✅ **CryptoScamDB** - Open source (MIT), can display
2. ✅ **Chainabuse** - Free API tier allows display
3. ✅ **Scam Sniffer** - GitHub public, can display
4. ⚠️ **Blockaid** - Check their terms (likely: display only with attribution)

---

## 4. SECURITY-FOCUSED DESIGN

### Don't Expose

```typescript
// ❌ DON'T show in UI
- Full threat database (entire address list)
- Quorum thresholds (how many reports = block)
- Threat scoring weights
- Raw reporters[] array without filtering

// ✅ DO show
- Threat category (phishing, drainer, etc.)
- Number of independent reporters (generalized)
- Recent threat examples
- Safety tips
```

### Threat Model for News Tab

**Attack**: Attacker tries to learn detection rules

```
Attacker: "If I report 5 times with address X, does it get blocked?"

Defense:
- Don't show exact quorum threshold
- Randomize response times
- Don't show reporter count exactly (round to ranges: "5+", "10+", "50+")
- Rate limit by IP (prevent enumeration)
```

---

## Files to Create

1. ✅ `/packages/site/app/news/page.tsx` - Main news page
2. ✅ `/packages/site/app/pricing/page.tsx` - Pricing page
3. ✅ `/packages/site/app/onboarding/page.tsx` - Welcome flow
4. ✅ `/packages/site/app/dashboard/page.tsx` - User account
5. ✅ `/packages/gate/src/server.ts` - Add `/v1/threats/latest` endpoint
6. ✅ `/packages/gate/src/security-middleware.ts` - API key validation
7. ✅ `/docs/CONTENT-STRATEGY.md` - This document (for reference)

---

## Timeline

**This Week**:
- [ ] Implement /v1/threats/latest endpoint
- [ ] Add /news page mockup
- [ ] Add /pricing page mockup

**Next Week**:
- [ ] Implement API key authentication
- [ ] Add /onboarding flow
- [ ] Add /dashboard

**Following Week**:
- [ ] Payment integration (Stripe)
- [ ] Email alerts setup
- [ ] Analytics & monitoring

