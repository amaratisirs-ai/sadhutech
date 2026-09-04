"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqItems = [
    {
      category: "Getting started",
      questions: [
        {
          q: "How do I use GENESIS?",
          a: "Go to Check, paste a crypto address or a transaction, and you get a plain-English verdict in seconds. No install, no signup.",
        },
        {
          q: "Do I need to connect my wallet?",
          a: "No. GENESIS never connects to your wallet and never touches your keys or funds. You simply paste the address or transaction you want to check.",
        },
        {
          q: "What can I check?",
          a: "Any EVM address or transaction  -  Ethereum, Polygon, Arbitrum, Optimism, and Avalanche  -  for free. Pro adds cross-chain coverage (BTC, Solana & more) and deeper ChainAbuse-powered checks.",
        },
        {
          q: "Is GENESIS free?",
          a: "The core check is free forever  -  no payment, no subscription, no account. Pro is optional, pay-as-you-go (from 1 USDC per check) for deeper cross-chain checks. See /pricing for details.",
        },
        {
          q: "How much does it cost to use?",
          a: "Free tier: zero cost, no gas fees, no charges. Pro tier: pay only for what you check, from 1 USDC per check, no subscription required.",
        },
        {
          q: "What's the difference between Free and Pro?",
          a: "Free covers EVM address & transaction checks against the community threat feed. Pro adds ChainAbuse-powered deep checks and cross-chain coverage (BTC, Solana & more), billed per check. There's also a Business/API tier for wallets, dapps, and security teams  -  see /pricing.",
        },
        {
          q: "Is my data safe?",
          a: "Yes. GENESIS has no accounts and never sees your keys or funds. We only receive the address or transaction you choose to check.",
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
          a: "Free checks cover EVM chains  -  Ethereum, Polygon, Arbitrum, Optimism, and Avalanche. Pro adds cross-chain coverage (BTC, Solana & more) via ChainAbuse-powered deep checks.",
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
          a: "Never. GENESIS has no wallet connection and never sees your keys, recovery phrase, or funds.",
        },
        {
          q: "Does GENESIS track my transactions?",
          a: "No. We don't log or store what you check  -  the transaction details are used only to produce a verdict.",
        },
        {
          q: "Does GENESIS collect my address/wallet data?",
          a: "Only what you paste. To produce a verdict we send the address or transaction you're checking to our server  -  nothing else. No accounts, no keys, no tracking, and we don't store it.",
        },
        {
          q: "Is GENESIS open source?",
          a: "Yes! Full source code at github.com/amaratisirs-ai/sadhutech. Audit it yourself.",
        },
        {
          q: "Who maintains the threat database?",
          a: "The community. Security researchers and users report threats, and multiple independent reporters confirm them before they count.",
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
          a: "The backend is briefly down or waking up. Wait a minute and try again. Status: github.com/amaratisirs-ai/sadhutech/issues.",
        },
        {
          q: "I got a rate-limit or 'Forbidden' error",
          a: "You've sent a lot of requests in a short time. Wait a few minutes and try again.",
        },
        {
          q: "My address shows no result",
          a: "Make sure it's a valid EVM address  -  0x followed by 40 characters. ENS names aren't supported yet.",
        },
      ],
    },
    {
      category: "Reporting & Feedback",
      questions: [
        {
          q: "I found a false positive (safe address flagged as dangerous)",
          a: "Thank you! Report it at sadhutech.com/report with: (1) Address, (2) Screenshot, (3) Your reasoning. Community votes to remove it.",
        },
        {
          q: "I found a false negative (dangerous address not flagged)",
          a: "Report at /report. Include the address, why it's dangerous, and proof (link to incident, social media reports, etc.).",
        },
        {
          q: "How do I suggest a new feature?",
          a: "Open an issue at github.com/amaratisirs-ai/sadhutech/issues with label 'enhancement'. Community votes on priority.",
        },
        {
          q: "I want to contribute threat intel",
          a: "Use /report page. Your submission is verified by the community and added to the threat database.",
        },
        {
          q: "Is there a bug bounty program?",
          a: "Check github.com/amaratisirs-ai/sadhutech for security policy. Report vulnerabilities responsibly.",
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
          href="mailto:contact@bhusoft.com"
          className="bg-slate-900/50 border border-teal-500/30 rounded-2xl p-8 hover:border-teal-500/60 hover:shadow-lg hover:shadow-teal-500/20 transition-all group"
        >
          <div className="text-teal-400 mb-3"><Icon name="mail" className="w-8 h-8" /></div>
          <h3 className="font-bold text-white group-hover:text-teal-300">Email Support</h3>
          <p className="text-sm text-slate-400 mt-2">contact@bhusoft.com  -  We usually respond within 24h</p>
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
                      <span className="font-bold text-white">{item.q}</span>
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
                        <p className="text-slate-300">{item.a}</p>
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
            href="mailto:contact@bhusoft.com"
            className="px-6 py-3 bg-teal-500 text-slate-950 font-bold rounded-xl hover:bg-teal-400 transition-all"
          >
            Email contact@bhusoft.com
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
