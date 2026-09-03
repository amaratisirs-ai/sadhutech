# GENESIS WalletConnect Middleware

HTTP-based pre-sign transaction firewall for WalletConnect onboarding, with Trust Wallet as the first production path.

## Overview

The WalletConnect middleware adapter lets wallets analyze transactions via GENESIS gate before users sign them. In the current product flow, Trust Wallet is the primary onboarding target, and the same gate/API can later be adopted by additional WalletConnect-compatible wallets.

**Key features:**
- ✅ Works with WalletConnect wallets that adopt the GENESIS flow
- ✅ Trust Wallet is the first production onboarding path
- ✅ Simple HTTP API (no WalletConnect SDK required for wallets)
- ✅ Real-time risk scoring (allow/warn/block)
- ✅ Plain-English verdict explanations
- ✅ Community threat intel (Sybil-resistant quorum)

## Integration Patterns

### Pattern 1: Wallet Pre-Sign Hook (Recommended)

Wallets can add a pre-sign interceptor that routes transactions through GENESIS. This is the end-state for in-wallet protection.

```javascript
// In your wallet's transaction handler
async function beforeSignTransaction(tx) {
  const client = new GENESISWCMiddleware({ gateUrl: 'http://localhost:8787' });
  const verdict = await client.analyzeTransaction({
    chainId: tx.chainId,
    from: tx.from,
    to: tx.to,
    value: tx.value,
    data: tx.data,
  });
  
  if (verdict.verdict === 'block') {
    throw new Error(`Transaction blocked: ${verdict.plainEnglish}`);
  }
  
  if (verdict.verdict === 'warn') {
    // Show UI warning to user
    showWarningDialog(verdict.plainEnglish);
  }
  
  // Proceed to signing
  return tx;
}
```

### Pattern 2: Separate Tab/Modal

Wallets can send txs to GENESIS in a separate dialog before showing the sign request:

```javascript
async function showTransactionPreview(tx) {
  const client = new GENESISWCMiddleware({ gateUrl: 'http://localhost:8787' });
  const verdict = await client.analyzeTransaction(tx);
  
  // Render risk summary + findings
  return (
    <RiskPanel verdict={verdict}>
      <button onClick={acceptAndSign}>Sign Anyway</button>
      <button onClick={reject}>Reject</button>
    </RiskPanel>
  );
}
```

### Pattern 3: Server-Side Middleware (OAuth-like)

Wallet backends can middleware all signing requests:

```typescript
// In wallet backend request handler
app.post('/sign-request', async (req, res) => {
  const { tx, signature } = req.body;
  
  // Check with GENESIS gate first
  const genesis = new GENESISWCMiddleware({ gateUrl: 'http://genesis-gate-url' });
  const verdict = await genesis.analyzeTransaction(tx);
  
  if (verdict.verdict === 'block') {
    return res.status(403).json({
      error: 'Blocked by GENESIS gate',
      reason: verdict.plainEnglish,
      findings: verdict.findings,
    });
  }
  
  // Log the verdict for analytics
  logTransaction(tx, verdict);
  
  // Proceed with signing
  return processSignature(signature, tx);
});
```

## API Reference

### `GENESISWCMiddleware`

```typescript
interface WCMiddlewareConfig {
  gateUrl: string; // GENESIS gate endpoint (e.g., http://localhost:8787)
}

class GENESISWCMiddleware {
  analyzeTransaction(tx: WCTransactionRequest): Promise<RiskAssessment>;
  reportThreat(address: string, category: ThreatCategory, reporterId: string): Promise<any>;
  healthCheck(): Promise<boolean>;
}
```

### Input: `WCTransactionRequest`

```typescript
{
  chainId: number;
  from: string;        // 0x-prefixed address
  to: string;          // Contract or recipient address
  value?: string;      // Wei (default "0")
  data?: string;       // Call data (default "0x")
}
```

### Output: `RiskAssessment`

```typescript
{
  verdict: "allow" | "warn" | "block";
  score: number;                      // 0-100 risk score
  plainEnglish: string;               // User-friendly explanation
  findings: RiskFinding[];            // Technical details
  summary: string;                    // Brief summary
  simulation: SimulationResult;       // Decoded transaction
}
```

## Examples

### React Integration

```jsx
import { GENESISWCMiddleware } from '@genesis/wc-middleware';

function TransactionWarning({ tx }) {
  const [verdict, setVerdict] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = new GENESISWCMiddleware({ 
      gateUrl: process.env.REACT_APP_GENESIS_URL 
    });
    
    client.analyzeTransaction(tx).then(setVerdict).finally(() => setLoading(false));
  }, [tx]);

  if (loading) return <div>Analyzing transaction...</div>;
  if (!verdict) return <div>Error analyzing</div>;

  const riskColor = {
    allow: 'green',
    warn: 'orange',
    block: 'red',
  }[verdict.verdict];

  return (
    <div style={{ borderLeft: `4px solid ${riskColor}`, padding: '1rem' }}>
      <h3>{verdict.verdict.toUpperCase()}</h3>
      <p>{verdict.plainEnglish}</p>
      <details>
        <summary>Technical findings ({verdict.findings.length})</summary>
        <ul>
          {verdict.findings.map(f => (
            <li key={f.id}>[{f.severity}] {f.title}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
```

### Node.js Integration

```javascript
const { GENESISWCMiddleware } = require('@genesis/wc-middleware');

async function checkBeforeSign(tx) {
  const genesis = new GENESISWCMiddleware({
    gateUrl: process.env.GENESIS_URL || 'http://localhost:8787',
  });

  try {
    const verdict = await genesis.analyzeTransaction(tx);
    
    console.log(`Verdict: ${verdict.verdict}`);
    console.log(`Explanation: ${verdict.plainEnglish}`);
    console.log(`Risk score: ${verdict.score}/100`);
    
    if (verdict.verdict === 'block') {
      throw new Error(`Transaction blocked: ${verdict.plainEnglish}`);
    }
  } catch (err) {
    console.error('Analysis failed:', err.message);
    // Graceful fallback: allow signing if gate is unreachable
    console.log('Gate unreachable, proceeding without analysis');
  }
}
```

## Threat Reporting

Community members can report suspicious addresses:

```javascript
const genesis = new GENESISWCMiddleware({ gateUrl: 'http://localhost:8787' });

await genesis.reportThreat(
  '0x1234567890123456789012345678901234567890',
  'drainer',
  'alice@example.com'  // Reporter ID (email, ENS, username, etc.)
);
```

Reports are Sybil-resistant: quorum requires **distinct reporters**, not multiple reports from the same ID.

## Deployment

### Development

```bash
pnpm install
pnpm gate  # Starts GENESIS gate on http://localhost:8787
```

### Production

```bash
# Set PostgreSQL for persistence
export DATABASE_URL=postgresql://...

# Or Docker
docker run -p 8787:8787 \
  -e DATABASE_URL="postgresql://..." \
  genesis-gate:latest
```

See [docs/POSTGRES-SETUP.md](../docs/POSTGRES-SETUP.md) for full deployment.

## Security Considerations

1. **No Key Exposure**: GENESIS never sees private keys. Only analyzes pre-signed transaction data.
2. **No Custody**: Wallets retain full control. GENESIS only provides analysis.
3. **Graceful Fallback**: If gate is unreachable, wallets should allow signing (don't block users).
4. **Rate Limiting**: Consider rate-limiting at the gate to prevent DoS.
5. **CORS**: Gate allows permissive CORS for dev. Restrict in production.

## Product Flow

Current public onboarding follows this sequence:

1. **MetaMask users** install the Snap and get wallet-native protection.
2. **Trust Wallet users** start with WalletConnect onboarding to link the wallet to GENESIS.
3. **Developers/integrators** use the API Explorer or middleware patterns to test `/v1/analyze` with real transactions.

WalletConnect connection alone is a session handshake. Actual protection requires either a wallet-side pre-sign integration or a GENESIS-controlled analysis step before the final signature prompt.

## Multi-Chain Support

GENESIS supports:
- ✅ Ethereum (chainId: 1)
- ✅ Polygon (chainId: 137)
- ✅ Arbitrum (chainId: 42161)
- ✅ Base (chainId: 8453)
- ✅ Any EVM chain (add decoders as needed)

## Next Steps

1. Deploy GENESIS gate (local or Neon DB)
2. Integrate `GENESISWCMiddleware` into your wallet
3. Test with scenarios from `pnpm demo`
4. Report feedback and threats via `/v1/report`

---

**Questions?** See [AGENTS.md](../AGENTS.md) and [engineering-reference.md](../docs/engineering-reference.md) for full architecture.
