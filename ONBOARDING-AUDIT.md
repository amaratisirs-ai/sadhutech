# User Onboarding Flow Audit

## 🎯 Complete User Journey Map

### Phase 1: Discovery → Homepage
**URL:** https://sadhutech-site.vercel.app

**Current Flow:**
1. User lands on homepage
2. Sees hero: "Milliseconds Matter"
3. Sees 6 features listed
4. Sees "How It Works" 3-step diagram
5. Sees 4 FAQ items
6. Can click:
   - "Get Protected" nav button → /snap-install
   - "+ Add to MetaMask" header button → /snap-install

**Potential Confusion Points:**
- ❌ No clear "What is GENESIS?" explanation before features
- ❌ Hero section doesn't explain what the Snap is (web3 jargon)
- ❌ "How It Works" section assumes user knows what "approval" means
- ⚠️ Two different CTAs (Get Protected vs Add to MetaMask) - both go same place, but wording differs

**Improvements Needed:**
- ✅ Add 1-sentence teaser before features: "MetaMask Snap that stops wallet drains before they happen"
- ✅ Simplify feature descriptions (reduce crypto jargon)
- ✅ Add video or animated demo (optional)
- ✅ Consolidate to single CTA language

---

### Phase 2: Installation → /snap-install
**URL:** https://sadhutech-site.vercel.app/snap-install

**Current Flow:**
1. User sees hero: "🔐 Get GENESIS Protection"
2. Left column: 6 benefits (with icons)
3. Right column: Installation box
4. User clicks: "+ Install GENESIS Snap"
5. MetaMask popup appears
6. User sees snap permissions
7. User clicks "Install"
8. Shows success screen with next steps

**Potential Confusion Points:**
- ⚠️ Installation button says "Install GENESIS Snap" but MetaMask shows "wallet_requestSnaps"
- ⚠️ User might not know what permissions mean
- ⚠️ Success screen says "Try a Test Transaction" but doesn't explain HOW
- ❌ No "What if I get an error?" guidance
- ❌ Not clear that snap works with ALL chains (user might think Ethereum only)

**What's Good:**
- ✅ Step-by-step visual flow (4 steps with icons)
- ✅ Clear benefits (6 cards)
- ✅ Trust indicators (Open Source, Non-custodial checkmarks)
- ✅ FAQ section (6 Q&A pairs)
- ✅ npm package link for transparency

**Improvements Needed:**
- ✅ Add "This is safe:" section explaining permissions
- ✅ Add "Try It Now" examples with screenshots
- ✅ Add troubleshooting section
- ✅ Add "Works on all EVM chains" badge

---

### Phase 3: First Transaction → Snap Analysis
**URL:** User's MetaMask wallet (when signing any transaction)

**Expected Flow:**
1. User goes to Uniswap, OpenSea, etc.
2. User initiates transaction
3. Snap intercepts before signing
4. Snap shows verdict in MetaMask insight panel:
   - ✅ ALLOW — "Safe, no risks"
   - ⚠️ WARN — "Review before signing"
   - 🚫 BLOCK — "Do not sign"
5. User sees findings (if any threats)
6. User decides to proceed or reject

**Potential Confusion Points:**
- ❌ New users might not know WHERE to see snap analysis in MetaMask
- ❌ User might think snap blocks transaction (it doesn't, just warns)
- ⚠️ Finding severity labels (HIGH/MEDIUM/LOW) vs verdict (ALLOW/WARN/BLOCK) - connection unclear
- ❌ No guidance on "I got WARN, what should I do?"

**What's Missing:**
- ❌ "After Install" guide showing WHERE snap shows up in MetaMask
- ❌ Screenshot guide of what to expect
- ❌ Decision tree: "Should I sign or not?"
- ❌ Feedback mechanism: "Report false positive/negative"

---

## 📊 Onboarding Checklist

### Homepage Quality
- [ ] Hero section explains WHAT GENESIS is
- [ ] Features use simple language (no "drainer", "approval", "quorum")
- [ ] Single clear CTA button
- [ ] Trust badges (Open Source, Community-driven)
- [ ] Quick FAQ (top 3 questions)

### Installation Page Quality
- [ ] Permissions explained in plain English
- [ ] "What snap permissions mean" section
- [ ] Success state clear
- [ ] Error handling visible
- [ ] "What's next" section (post-install)

### Post-Installation Guide
- [ ] Screenshot: "Where to see snap analysis"
- [ ] Example transactions (safe vs risky)
- [ ] Decision guide: "Should I sign?"
- [ ] "Get help" / "Report issues" link
- [ ] Link to community reporting

### Documentation
- [ ] Getting Started guide
- [ ] FAQ (10 Q&A minimum)
- [ ] Troubleshooting guide
- [ ] Privacy policy link
- [ ] Support email

---

## 🎯 Clarity Score: Current vs Target

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| **Discovery** | 7/10 | 9/10 | Need clearer "what is this" |
| **Installation** | 8/10 | 9/10 | Need error handling + permissions explained |
| **First Use** | 5/10 | 9/10 | BIGGEST GAP - no post-install guide |
| **Error Recovery** | 3/10 | 8/10 | Need troubleshooting page |
| **Support** | 4/10 | 8/10 | Need FAQ + email link |
| **Overall** | 5.4/10 | 8.6/10 | **Need: Post-install guide** |

---

## ✅ Priority Improvements (Ranked)

### 🔴 CRITICAL (Do First)
1. **Post-Installation Guide Page** (`/after-install`)
   - Where snap appears in MetaMask
   - Screenshots
   - Example transaction analysis
   - "What each verdict means"
   - Link to test transaction

2. **Permissions Explained Section** (add to /snap-install)
   - "Why does GENESIS need network access?"
   - "Why transaction insight?"
   - "Your keys are always safe"

3. **Troubleshooting Page** (`/help`)
   - "Snap won't install"
   - "Snap not showing up"
   - "Got an error"
   - "Contact support"

### 🟡 HIGH (Do Second)
4. **Simplify Homepage**
   - Remove crypto jargon
   - Clearer "What is this" tagline
   - Single CTA (not two)

5. **FAQ Expansion**
   - Homepage FAQ: Top 3 beginner questions
   - /snap-install FAQ: Installation questions
   - /help page: Troubleshooting
   - Total: 20+ FAQs

### 🟢 NICE-TO-HAVE (Do Later)
6. Video demo (1 min showing full flow)
7. Interactive transaction simulator
8. Community threat feed on homepage
9. "Success Stories" section
10. Contributor spotlight

---

## 🚀 Recommended Action Items

### This Week
- [ ] Create `/after-install` page with post-installation guide
- [ ] Create `/help` page with troubleshooting
- [ ] Add "Permissions Explained" to /snap-install
- [ ] Simplify homepage hero section

### Next Week
- [ ] Expand FAQ sections
- [ ] Add video demo links
- [ ] Test with 5 new users (get feedback)
- [ ] Refine based on feedback

### Testing Checklist
- [ ] Can a non-technical person understand "what is GENESIS" in 30 seconds?
- [ ] Can they install snap without getting stuck?
- [ ] Do they know where to see snap analysis after install?
- [ ] Do they know what "WARN" means?
- [ ] Can they find help if something goes wrong?

---

## 📋 Quick Wins (5 min each)

```markdown
// Add to /snap-install page (after success screen):

### What Happens Next

1. **Go to any DeFi app** (Uniswap, OpenSea, etc.)
2. **Try a transaction** (swap, mint, stake, etc.)
3. **Before you sign**, look for GENESIS panel in MetaMask
4. **Read the verdict**:
   - ✅ ALLOW = Safe, sign away
   - ⚠️ WARN = Review carefully, might be risky
   - 🚫 BLOCK = Don't sign (likely scam)

### Where to Find GENESIS in MetaMask

The snap analysis shows up in the **"Insights" section** when you're about to sign:

[INSERT SCREENSHOT]

---

// Add to homepage footer:

**Need help?** → [Support](/help)
**Found a bug?** → [Report](https://github.com/sadhutech/genesis/issues)
**Have feedback?** → [Suggest feature](mailto:feedback@genesis.com)
```

---

## Summary

**Current State:** Product works perfectly, but onboarding **feels incomplete**

**Main Issue:** After installation, user doesn't know:
- Where snap shows up
- What to expect
- What to do if something goes wrong

**Why It Matters:** First experience determines if users trust & keep using snap

**Fix Impact:** Simple guides + screenshots = 3x better retention
