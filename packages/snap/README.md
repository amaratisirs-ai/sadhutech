# GENESIS Firewall Snap

**Real-time transaction security for your MetaMask wallet.**

GENESIS is a MetaMask Snap that analyzes every transaction you sign against 4,100+ community-verified threats—instantly catching drainers, exploits, phishing, and rugpulls before they happen.

## What It Does

When you attempt to sign a transaction, GENESIS:

1. **Intercepts** the transaction before you sign
2. **Analyzes** against our threat database (4,100+ known bad actors)
3. **Scores** the risk level (0–100)
4. **Returns** a verdict in plain English:
   - ✅ **ALLOW** — No risks detected
   - ⚠️ **WARN** — Review carefully before signing
   - 🚫 **BLOCK** — Do not sign this transaction

## Key Features

- 🛡️ **Real Threats** — 4,100+ verified threats from community reports, incident databases, and trusted security researchers
- ⚡ **Instant Analysis** — Millisecond response times, right inside MetaMask
- 📊 **Risk Scoring** — Get a numerical score (0–100) for every transaction
- 🔄 **Always Updated** — Threat database updates continuously with new community reports
- 🤝 **Community Driven** — Threats verified by Sybil-resistant quorum voting
- ✅ **Private** — No tracking, no analytics, no custody of your funds

## Threat Categories

GENESIS detects and warns about:

- **Drainer Contracts** — Malicious smart contracts designed to steal funds
- **Phishing** — Fake contracts impersonating legitimate protocols
- **Exploits** — Addresses associated with known security vulnerabilities
- **Rugpulls** — Projects that exit-scammed the community
- **MEV Extractors** — Sandwich attackers and other MEV exploits

## How Community Threat Reporting Works

GENESIS uses Sybil-resistant quorum voting:

1. Security researchers and community members submit threat reports
2. Each report includes evidence (public incident database links, tx hashes, etc.)
3. Reports reach "trusted" status after consensus from 3+ independent reporters
4. Snap shows verified threats as "HIGH RISK", single reports as "MEDIUM RISK"

## Privacy & Security

- ✅ No private key access — Snap only sees transaction data
- ✅ No tracking — We don't monitor which addresses you interact with
- ✅ No analytics — Usage data stays on your device
- ✅ No fund custody — GENESIS never holds or controls your assets
- ✅ Open source — Full transparency on threat detection logic

## Installation

1. Visit [GENESIS Firewall](https://sadhutech-site.vercel.app/snap-install)
2. Click "Add to MetaMask"
3. Review permissions (transaction insight + network access)
4. Sign the Snap installation approval

## Requirements

- MetaMask 12.0+
- Mainnet or any EVM-compatible chain

## Supported Chains

GENESIS works on all EVM chains:
- Ethereum Mainnet
- Polygon
- Arbitrum
- Optimism
- Base
- Avalanche
- And 100+ other chains

## Example Use Cases

### Scenario 1: Phishing Prevention
```
You visit a fake DeFi site that looks like Uniswap.
You go to swap tokens on what you think is Uniswap.
GENESIS detects the router address is flagged as phishing.
Verdict: 🚫 BLOCK
```

### Scenario 2: Known Drainer
```
You approve a contract for token swaps.
The contract is associated with a known drainer exploit.
GENESIS detects and flags it.
Verdict: ⚠️ WARN - Review carefully
```

### Scenario 3: Safe Transaction
```
You swap ETH for USDC on the real Uniswap contract.
Address is verified by GENESIS's threat intel.
Verdict: ✅ ALLOW - No risks detected
```

## FAQ

**Q: Will GENESIS block my legitimate transactions?**  
A: GENESIS only warns or blocks if an address matches our threat database. Legitimate protocols are not flagged. You can always override warnings.

**Q: Does this cost gas?**  
A: No. Snap analysis happens off-chain. Zero gas fees.

**Q: What if GENESIS is wrong?**  
A: You can submit a counter-report to dispute false positives. Community votes determine if a threat is removed.

**Q: Can I uninstall it?**  
A: Yes. Open MetaMask Settings → Snaps → GENESIS Firewall → Remove.

**Q: How often does the threat database update?**  
A: Every hour. New community reports are added and verified continuously.

**Q: Does it work on mobile?**  
A: Only on MetaMask Mobile if it supports Snaps (expanding support in 2026).

## Links

- 🌐 [Website](https://sadhutech-site.vercel.app)
- 📖 [Docs](https://sadhutech-site.vercel.app)
- 🐛 [Report Issues](https://github.com/sadhutech/genesis/issues)
- 🔐 [Security](https://github.com/sadhutech/genesis#security)

## License

MIT
