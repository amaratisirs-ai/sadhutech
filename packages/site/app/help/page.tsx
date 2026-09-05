"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { withGenesisStyle } from "@/components/Genesis";

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqItems = [
    {
      category: "Getting started",
      questions: [
        {
          q: "How do I use GENESIS?",
          a: "Go to Check, choose 'Check an address' or 'Check a transaction', paste it in, and get a plain-English verdict in seconds. No install, no signup.",
        },
        {
          q: "What's the difference between GENESIS Check, GENESIS Snap, and Wallet Guard?",
          a: "GENESIS Check is the free web tool at /check  -  paste anything, no install. GENESIS Snap is a MetaMask extension that pops up the same verdict right before you sign (live today via direct install). GENESIS Wallet Guard is the broader roadmap vision: automatic protection built into any wallet or browser, not just MetaMask  -  Snap is the first concrete step toward it. See /products for the full picture.",
        },
        {
          q: "Is GENESIS the only thing sadhutech makes?",
          a: "GENESIS (crypto transaction safety) is sadhutech's first product. Mobile device protection, laptop protection, and SaaS protection are on the roadmap next  -  see /products and /whitepaper.",
        },
        {
          q: "Do I need to connect my wallet?",
          a: "No, not for a free check  -  paste an address or transaction and get a verdict with no wallet involved. Connecting a wallet is only needed if you want a Pro deep check: you sign a message to prove ownership and pay in USDC on Base for credits. Even then, GENESIS never sees your keys, seed phrase, or funds.",
        },
        {
          q: "What can I check?",
          a: "Any EVM address or transaction  -  Ethereum, Polygon, Arbitrum, Optimism, and Avalanche  -  for free. Pro adds deeper ChainAbuse-powered checks on those same chains today; cross-chain coverage (BTC, Solana & more) is on the roadmap, not live yet.",
        },
        {
          q: "Is GENESIS free?",
          a: "The core check is free forever  -  no payment, no subscription, no account. Pro is optional, pay-as-you-go (from 1 USDC per check, paid in USDC on Base) for deeper checks. See /pricing for details.",
        },
        {
          q: "How much does it cost to use?",
          a: "Free tier: zero cost, no gas fees, no charges. Pro tier: pay only for what you check, from 1 USDC per check, no subscription required.",
        },
        {
          q: "What's the difference between Free and Pro?",
          a: "Free covers EVM address & transaction checks against the community threat feed. Pro adds a ChainAbuse-powered deep check per address, billed per credit and paid with USDC on Base  -  no subscription, no account. There's also a Business/API tier for wallets, dapps, and security teams  -  see /pricing.",
        },
        {
          q: "Is my data safe?",
          a: "Yes. GENESIS has no accounts and never sees your keys or funds. A free check only sends us the address or transaction you're checking. Buying Pro credits also records your wallet address and payment transaction hash so we can credit your balance  -  see /privacy for the full breakdown.",
        },
      ],
    },
    {
      category: "Using GENESIS",
      questions: [
        {
          q: "How do I read the result?",
          a: "ALLOW = safe, no risks detected. WARN = potential risk, review carefully. BLOCK = likely dangerous, don't sign.",
        },
        {
          q: "Why did it show WARN for something I trust?",
          a: "GENESIS errs on the side of caution. Common examples: new contracts, staking, or broad approvals. Read the specific finding to understand why.",
        },
        {
          q: "Does it work on all blockchains?",
          a: "Today, checks cover EVM chains  -  Ethereum, Polygon, Arbitrum, Optimism, and Avalanche. Non-EVM addresses (Bitcoin, Solana, etc.) are detected and clearly marked as not supported yet rather than given a false result; broader chain coverage is on the roadmap.",
        },
        {
          q: "What does a Pro 'deep check' do?",
          a: "It cross-checks the address against ChainAbuse's global scam-report database in addition to our community feed. It costs 1 credit, requires a connected wallet to sign a message proving ownership, and never touches your keys or funds.",
        },
        {
          q: "How fast is a check?",
          a: "A few seconds. Paste, check, decide.",
        },
      ],
    },
    {
      category: "Privacy & Security",
      questions: [
        {
          q: "Does GENESIS see my private keys?",
          a: "Never, even when you connect a wallet for Pro. Signing a message or sending a payment happens inside your own wallet app  -  GENESIS never sees your keys, seed phrase, or password.",
        },
        {
          q: "Does GENESIS track my transactions?",
          a: "We don't build a profile of you. Free checks aren't stored beyond basic request metadata (IP, timestamp) used for rate-limiting and abuse prevention. Pro deep-check spending and credit payments are recorded (wallet address + on-chain transaction hash) so we can credit your balance and audit for abuse.",
        },
        {
          q: "Does GENESIS collect my address/wallet data?",
          a: "Only what's needed: the address or transaction you paste for a free check, or your wallet address and payment transaction hash if you buy Pro credits. No accounts, no KYC, no selling your data. Full detail at /privacy.",
        },
        {
          q: "Is GENESIS open source?",
          a: "Yes! Full source code at github.com/amaratisirs-ai/sadhutech. Audit it yourself.",
        },
        {
          q: "Who maintains the threat database?",
          a: "The community. Security researchers and users report threats, and multiple independent reporters confirm them before they count. Pro checks also draw on third-party feeds (GoPlus Security, ChainAbuse, Blockaid)  -  see /partners.",
        },
        {
          q: "What's in the threat database?",
          a: "Known drainers, phishing contracts, honeypots, and exploit addresses. Each is confirmed by multiple independent reporters before it's trusted.",
        },
      ],
    },
    {
      category: "Troubleshooting",
      questions: [
        {
          q: "The checker says it's unavailable",
          a: "The backend is briefly down or waking up from idle (the first check after a while can take up to a minute). Wait and try again. Status: github.com/amaratisirs-ai/sadhutech/issues.",
        },
        {
          q: "I got a rate-limit or 'Forbidden' error",
          a: "You've sent a lot of requests in a short time. Wait a few minutes and try again.",
        },
        {
          q: "My address shows no result",
          a: "Make sure it's a valid EVM address  -  0x followed by 40 characters. ENS names and non-EVM addresses (Bitcoin, Solana, etc.) aren't supported yet.",
        },
        {
          q: "My Pro payment went through but I don't see credits",
          a: "Payments on Base can take up to ~30 seconds to confirm. The Pro page automatically checks for it; if credits still don't appear, use 'Already paid? Add checks' on /pro to re-check.",
        },
      ],
    },
    {
      category: "Reporting & Feedback",
      questions: [
        {
          q: "I found a false positive (safe address flagged as dangerous)",
          a: "The /report form is for submitting new threats, not disputes. If an address was wrongly flagged, email security@sadhutech.com with the address and your reasoning and we'll review it.",
        },
        {
          q: "I found a false negative (dangerous address not flagged)",
          a: "Report it at /report: enter the address, category, and a description, then confirm via the one-time email link we send you (this stops spam/Sybil abuse). It's added once multiple independent reporters confirm it.",
        },
        {
          q: "How do I suggest a new feature?",
          a: "Open an issue at github.com/amaratisirs-ai/sadhutech/issues with label 'enhancement'. Community votes on priority.",
        },
        {
          q: "I want to contribute threat intel",
          a: "Use the /report page and confirm via the email link we send you. Once confirmed, it joins the shared threat feed pending confirmation from other reporters.",
        },
        {
          q: "Is there a bug bounty program?",
          a: "Not yet  -  it's on our roadmap. For now, report vulnerabilities responsibly to security@sadhutech.com or via GitHub issues.",
        },
      ],
    },
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center text-teal-400"><Icon name="question" className="w-16 h-16" /></div>
        <h1 className="text-5xl font-black text-white">Help & Support</h1>
        <p className="text-lg text-teal-200 max-w-2xl mx-auto">
          Find answers to common questions or get in touch with our team.
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-6">
        <a
          href="https://github.com/amaratisirs-ai/sadhutech/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-slate-900/50 border border-teal-500/30 rounded-2xl p-8 hover:border-teal-500/60 hover:shadow-lg hover:shadow-teal-500/20 transition-all group"
        >
          <div className="text-teal-400 mb-3"><Icon name="bug" className="w-8 h-8" /></div>
          <h3 className="font-bold text-white group-hover:text-teal-300">Report a Bug</h3>
          <p className="text-sm text-slate-400 mt-2">Found something broken? Let us know on GitHub.</p>
        </a>

        <a
          href="/report"
          className="bg-slate-900/50 border border-teal-500/30 rounded-2xl p-8 hover:border-teal-500/60 hover:shadow-lg hover:shadow-teal-500/20 transition-all group"
        >
          <div className="text-teal-400 mb-3"><Icon name="bell" className="w-8 h-8" /></div>
          <h3 className="font-bold text-white group-hover:text-teal-300">Report a Threat</h3>
          <p className="text-sm text-slate-400 mt-2">Submit a dangerous address to the threat database.</p>
        </a>

        <a
          href="mailto:security@sadhutech.com"
          className="bg-slate-900/50 border border-teal-500/30 rounded-2xl p-8 hover:border-teal-500/60 hover:shadow-lg hover:shadow-teal-500/20 transition-all group"
        >
          <div className="text-teal-400 mb-3"><Icon name="mail" className="w-8 h-8" /></div>
          <h3 className="font-bold text-white group-hover:text-teal-300">Email Support</h3>
          <p className="text-sm text-slate-400 mt-2">security@sadhutech.com  -  We usually respond within 24h</p>
        </a>
      </div>

      {/* FAQ by Category */}
      <div className="space-y-8">
        {faqItems.map((category, catIdx) => (
          <div key={catIdx} className="space-y-4">
            <h2 className="text-2xl font-bold text-white">{category.category}</h2>

            <div className="space-y-3">
              {category.questions.map((item, idx) => {
                const globalIdx = faqItems.slice(0, catIdx).reduce((sum, c) => sum + c.questions.length, 0) + idx;
                const isOpen = openFaq === globalIdx;

                return (
                  <div
                    key={idx}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden hover:border-teal-500/30 transition-all"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : globalIdx)}
                      className="w-full px-6 py-4 flex justify-between items-start text-left hover:bg-slate-700/50 transition-all"
                    >
                      <span className="font-bold text-white">{withGenesisStyle(item.q)}</span>
                      <span
                        className={`text-2xl text-teal-300 transition-transform flex-shrink-0 ml-4 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      >
                        ▼
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700">
                        <p className="text-slate-300">{withGenesisStyle(item.a)}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Still Can't Find Help? */}
      <section className="bg-gradient-to-br from-teal-500/10 to-indigo-500/10 border-2 border-teal-500/30 rounded-2xl p-12 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Still need help?</h2>
        <p className="text-slate-300 max-w-2xl mx-auto">
          We're here to help. Reach out and we'll get back to you as soon as possible.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
          <a
            href="mailto:security@sadhutech.com"
            className="px-6 py-3 bg-teal-500 text-slate-950 font-bold rounded-xl hover:bg-teal-400 transition-all"
          >
            Email security@sadhutech.com
          </a>
          <a
            href="https://github.com/amaratisirs-ai/sadhutech/discussions"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 border-2 border-teal-500 text-teal-300 font-bold rounded-xl hover:bg-teal-500/10 transition-all"
          >
            Ask on GitHub Discussions
          </a>
        </div>
      </section>

      {/* Back to Start */}
      <div className="text-center">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-teal-300 hover:text-white transition-all"
        >
          ← Back to Home
        </a>
      </div>
    </div>
  );
}
