# GENESIS Layman's Testing Guide 🔒

**Goal:** Understand how GENESIS works by testing it hands-on (no coding required)

---

## What is GENESIS? (Plain English)

Think of GENESIS like a **security guard for your crypto wallet**. Before you send crypto to someone, GENESIS checks:
- Is the address safe? ✅
- Is it suspicious? ⚠️ 
- Is it dangerous? 🚫

Then it tells you what it found — in plain English.

---

## Setup (5 minutes)

### 1. Get MetaMask (if you don't have it)
- Visit: https://metamask.io
- Click "Download" → Install for your browser
- Create an account or import an existing wallet
- ✅ You're ready!

### 2. Install GENESIS Snap
- Visit: https://sadhutech-site.vercel.app/snap-install
- Click the big blue **"What's Next?"** button
- MetaMask shows a popup: "Genesis Firewall wants to..."
- Click **"Approve"**
- ✅ GENESIS is now installed!

### 3. Where to Find It
- Open MetaMask
- You'll see a new tab: **"Insights"** (next to "Activity")
- That's where GENESIS shows up!

---

## Test #1: SAFE Transaction ✅

This is a normal, safe transaction you see every day.

### Step 1: Go to Uniswap
- Visit: https://app.uniswap.org/swap
- This is a well-known, trusted crypto exchange (like Coinbase, but decentralized)

### Step 2: Do a Test Swap
- Click: "Select a token" → Pick "ETH" (Ethereum)
- Enter: Any small amount (e.g., 0.01 ETH)
- Click: "Select a token" → Pick "USDC" (stablecoin)
- Click: **"Swap"** button

### Step 3: Review Transaction
- MetaMask popup appears
- Click on the **"Insights"** tab (new!)
- You'll see:
  ```
  ✅ ALLOW (Score: 0-30)
  Safe to proceed
  ```

### What This Means:
- ✅ **ALLOW** = Address is safe, known exchange
- **Score: 0-30** = Safest range
- **Finding:** "None" or "legitimate_exchange"
- ✅ **You can safely proceed**

### Continue:
- Click: **"Confirm"** in MetaMask
- Transaction sends! ✅

---

## Test #2: SUSPICIOUS Transaction ⚠️

This shows a risky but not blocked transaction.

### Step 1: Go to a Staking Site
- Visit: https://lido.fi/ (popular staking service)
- Click: **"Stake ETH"** button

### Step 2: Approve Token Spending
- You'll be asked to "Approve" — this is where GENESIS helps
- MetaMask popup appears
- Click: **"Insights"** tab
- You'll see:
  ```
  ⚠️  WARN (Score: 31-70)
  Review carefully
  ```

### What This Means:
- ⚠️ **WARN** = Unusual but not necessarily bad
- **Score: 31-70** = Medium risk
- **Finding:** "erc20.unlimited-approval"
- **Translation:** "You're giving unlimited permission to spend your tokens"
- **Question to ask:** "Do I trust this service?" (Lido is legit, but GENESIS flags risky patterns)
- ⚠️ **Ask yourself: Is this worth the risk?**

### Continue (if you're confident):
- Click: **"Confirm"** in MetaMask
- ✅ Transaction sends

---

## Test #3: DANGEROUS Transaction 🚫

This shows a known scam/drainer address.

### Step 1: Go to Address Checker
- Visit: https://sadhutech-site.vercel.app (our site)
- Click: **"Threats Hub"** → See known dangerous addresses

### Step 2: Copy a Dangerous Address
- Find an address marked 🚫 (BLOCK)
- Example: A known phishing address
- Copy the address

### Step 3: Try to Send Crypto
- Open MetaMask
- Click: **"Send"** button
- Paste the dangerous address into "To:"
- Enter any amount (doesn't matter, you won't send it)
- Click: **"Next"**

### Step 4: Review in Insights
- MetaMask shows confirmation popup
- Click: **"Insights"** tab
- You'll see:
  ```
  🚫 BLOCK (Score: 71-100)
  DO NOT SEND
  ```

### What This Means:
- 🚫 **BLOCK** = Known scam/drainer address
- **Score: 71-100** = Extremely high risk
- **Finding:** "intel.confirmed" or "erc20.drainer"
- **Translation:** "This address is known to steal crypto"
- 🚫 **DO NOT PROCEED**

### Cancel (Don't Send!):
- Click: **"Reject"** in MetaMask
- ✅ Your crypto is safe!

---

## Understanding the Findings 📊

### What Each Finding Means:

| Finding | What It Is | Danger Level |
|---------|-----------|-------------|
| `intel.confirmed` | Known scam address from our database | 🚫 BLOCK |
| `intel.unconfirmed` | Community reported it as suspicious | ⚠️ WARN |
| `erc20.unlimited-approval` | App can spend ALL your tokens (not just this transaction) | ⚠️ WARN |
| `erc20.drainer` | Known to drain wallets automatically | 🚫 BLOCK |
| `general.hidden-function` | Sneaky code that does something secret | ⚠️ WARN |
| (none) | Normal, safe transaction | ✅ ALLOW |

---

## The Verdict Scale Explained 📈

```
0 ────────── 30 ────────────── 70 ────────────── 100
✅ SAFE      ⚠️  RISKY        🚫 DANGEROUS
ALLOW        WARN             BLOCK

Score: 0-30  = Do it confidently
Score: 31-70 = Ask "Do I trust this?"
Score: 71+   = Don't send!
```

---

## Real-World Examples 🌍

### Example 1: Swapping on Uniswap
```
You: "I want to trade ETH for USDC"
Uniswap address: 0x68b3465833fb72B5A828cCCAC310Db3c56100D1C

GENESIS Analysis:
  Finding: legitimate_exchange
  Score: 5 (very safe)
  Verdict: ✅ ALLOW
  
Translation: "This is Uniswap, a well-known exchange. Safe to swap!"
```

### Example 2: Approving OpenSea (NFT Marketplace)
```
You: "I want to sell my NFT"
OpenSea address: 0x1E0049784dF921c51cF7773E3D1FB86912356DaE

GENESIS Analysis:
  Finding: erc20.unlimited-approval
  Score: 45 (medium risk)
  Verdict: ⚠️  WARN
  
Translation: "OpenSea is asking for unlimited spending power. 
They're legit, but if they get hacked, your tokens could be stolen."
```

### Example 3: Suspicious Phishing Link
```
Someone sends you: "Click here to claim free ETH!"
Address: 0xABC123... (random address)

GENESIS Analysis:
  Finding: intel.confirmed + erc20.drainer
  Score: 98 (extremely dangerous)
  Verdict: 🚫 BLOCK
  
Translation: "This is a known scam. DO NOT SEND ANYTHING."
```

---

## Quick Testing Checklist ✓

- [ ] **Install GENESIS snap** (2 min)
- [ ] **Test SAFE transaction** on Uniswap (3 min)
- [ ] **Test SUSPICIOUS transaction** on Lido (3 min)
- [ ] **Test DANGEROUS transaction** on our site (2 min)
- [ ] **Understand the 3 verdict levels** ✅⚠️🚫
- [ ] **Know where to find findings** (in Insights tab)

**Total time: ~15 minutes** ⏱️

---

## Common Questions 🤔

### Q: Do I need actual money to test?
**A:** No! MetaMask will reject the transaction in a test phase if it's too risky. You can safely explore.

### Q: What if I accidentally send to a dangerous address?
**A:** 
1. GENESIS shows 🚫 BLOCK before you send
2. You can click "Reject" and cancel
3. If you don't see the warning, contact support: support@genesis.com

### Q: Can GENESIS prevent hacks?
**A:** GENESIS shows you the risk BEFORE you send. You make the final decision. Think of it as a security advisor, not a security guard.

### Q: Why does Lido show ⚠️ WARN?
**A:** Lido is legitimate! But GENESIS flags "unlimited approval" because it's a risky pattern (even if the service is trustworthy). It's like a seatbelt warning even when driving safely.

### Q: What if my transaction gets blocked?
**A:** 
- If score is 31-70 (⚠️ WARN): Use your judgment. If you trust it, proceed.
- If score is 71+ (🚫 BLOCK): This is a known scam. Do NOT proceed.

### Q: Can I report false positives?
**A:** Yes! Visit: https://sadhutech-site.vercel.app/report
Tell us if GENESIS was wrong, and help improve the system!

---

## What You've Learned 🎓

After this test, you now understand:
- ✅ What GENESIS does (analyzes transactions for risk)
- ✅ How to use it (click "Insights" in MetaMask)
- ✅ What the 3 verdicts mean (✅ ALLOW | ⚠️ WARN | 🚫 BLOCK)
- ✅ How to read findings (intel.confirmed, erc20.unlimited-approval, etc.)
- ✅ When to proceed vs. when to cancel (use your judgment on ⚠️, never on 🚫)

---

## Next Steps 🚀

1. **Keep using GENESIS** on all transactions
2. **Report false positives** if you find them (help us improve)
3. **Tell friends** about GENESIS (we grow by word-of-mouth)
4. **Try advanced features** (API, threat reports, community voting)

---

## Get Help 🆘

- **Installation help:** https://sadhutech-site.vercel.app/help
- **Report a threat:** https://sadhutech-site.vercel.app/report
- **Suggest a feature:** support@genesis.com
- **See all threats:** https://sadhutech-site.vercel.app/threats

---

**That's it!** You now understand GENESIS and how to use it safely. 🎉

Questions? [Ask in our community Discord] — or just start testing!
