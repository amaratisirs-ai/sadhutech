"use client";

import { useState } from "react";

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqItems = [
    {
      category: "Installation",
      questions: [
        {
          q: "Where do I install GENESIS Snap?",
          a: "Visit sadhutech-site.vercel.app/snap-install and click '+ Install GENESIS Snap'. MetaMask will open with installation details.",
        },
        {
          q: "What are the system requirements?",
          a: "You need MetaMask v11.0+ and any EVM-compatible wallet. Works on Chrome, Firefox, and Brave browsers.",
        },
        {
          q: "Is GENESIS Snap free?",
          a: "Completely free. No payment, no subscription. GENESIS is open source.",
        },
        {
          q: "How much does it cost to use?",
          a: "Zero cost. Analysis happens on your device, no gas fees, no charges.",
        },
        {
          q: "Snap installation failed. What do I do?",
          a: "Try: (1) Refresh MetaMask, (2) Refresh the website, (3) Clear browser cache, (4) Restart browser. If error persists, email support@genesis.com with screenshot.",
        },
        {
          q: "I uninstalled MetaMask. Is my data safe?",
          a: "Yes. GENESIS never stores your data on servers. All analysis happens locally on your device.",
        },
      ],
    },
    {
      category: "Using GENESIS",
      questions: [
        {
          q: "Where do I see GENESIS analysis in MetaMask?",
          a: "When you're about to sign a transaction, look for the 'Insights' section at the top of the confirmation screen (above the Sign button). That's where GENESIS shows its verdict.",
        },
        {
          q: "What's the difference between ALLOW, WARN, and BLOCK?",
          a: "ALLOW (✅) = Safe, no risks detected. WARN (⚠️) = Potential risk, review carefully. BLOCK (🚫) = Likely dangerous, do not sign.",
        },
        {
          q: "Can I override a BLOCK verdict?",
          a: "Yes, MetaMask lets you sign anyway if you choose to. But if GENESIS blocks something, there's usually a good reason. Proceed at your own risk.",
        },
        {
          q: "Why did it show WARN for a transaction I trust?",
          a: "GENESIS errs on the side of caution. Common false positives: DAO voting, staking, or new contracts. Always read the specific finding to understand the risk.",
        },
        {
          q: "Will GENESIS block my legitimate transaction?",
          a: "GENESIS only warns/blocks if it detects specific risk patterns (drainers, unlimited approvals, known scams). Legitimate transactions should show ✅ ALLOW. If not, review the finding and decide.",
        },
        {
          q: "Does GENESIS work on all blockchains?",
          a: "Yes! GENESIS works on any EVM-compatible chain: Ethereum, Polygon, Arbitrum, Optimism, Base, Avalanche, etc. Plus non-EVM via its API.",
        },
        {
          q: "Can I disable GENESIS for certain transactions?",
          a: "You can skip the analysis by rejecting and trying again, but that's cumbersome. Better: email support if you find a false positive.",
        },
        {
          q: "How fast is GENESIS analysis?",
          a: "Analysis happens in <200ms. You won't notice any delay.",
        },
      ],
    },
    {
      category: "Privacy & Security",
      questions: [
        {
          q: "Does GENESIS see my private keys?",
          a: "Never. GENESIS is sandboxed in MetaMask and has no access to your keys, recovery phrase, or private data.",
        },
        {
          q: "Does GENESIS track my transactions?",
          a: "No. All analysis happens locally on your device. GENESIS does not log or store your transactions.",
        },
        {
          q: "Does GENESIS collect my address/wallet data?",
          a: "No. Your addresses are never sent to GENESIS servers. All threat analysis uses only transaction details, not identifiers.",
        },
        {
          q: "Is GENESIS open source?",
          a: "Yes! Full source code at github.com/sadhutech/genesis. Audit it yourself.",
        },
        {
          q: "Who maintains the threat database?",
          a: "The community. Security researchers and users report threats, and consensus voting (quorum) verifies them.",
        },
        {
          q: "What's in the threat database?",
          a: "4,100+ known drainers, phishing contracts, honeypots, and exploit addresses. Community-verified via Sybil-resistant voting.",
        },
      ],
    },
    {
      category: "Troubleshooting",
      questions: [
        {
          q: "Snap shows 'Error: Cannot connect to gate'",
          a: "GENESIS backend is temporarily down. Check status at github.com/sadhutech/genesis/issues. Try again in 5 minutes. You can still sign (analysis just won't show).",
        },
        {
          q: "Snap doesn't appear in MetaMask after install",
          a: "Try: (1) Refresh MetaMask, (2) Go to Settings → Extensions → Snaps, check if GENESIS Firewall is listed, (3) Restart browser.",
        },
        {
          q: "Got 'E403 Forbidden' error",
          a: "This usually means rate limiting. Wait 15 minutes and try again. If persistent, contact support.",
        },
        {
          q: "Snap installed but not showing analysis",
          a: "Make sure you're signing a transaction (not just viewing). The Insights panel only shows when you click 'Sign' in MetaMask.",
        },
        {
          q: "Is GENESIS Snap safe?",
          a: "Yes. Runs in MetaMask's secure sandbox, open source, audited by community. No access to keys or funds.",
        },
        {
          q: "I lost my MetaMask wallet. Is GENESIS affected?",
          a: "No. GENESIS has no data about you. Import your backup seed phrase into MetaMask, reinstall snap, and you're set.",
        },
      ],
    },
    {
      category: "Reporting & Feedback",
      questions: [
        {
          q: "I found a false positive (safe address flagged as dangerous)",
          a: "Thank you! Report it at sadhutech-site.vercel.app/report with: (1) Address, (2) Screenshot, (3) Your reasoning. Community votes to remove it.",
        },
        {
          q: "I found a false negative (dangerous address not flagged)",
          a: "Report at /report. Include the address, why it's dangerous, and proof (link to incident, social media reports, etc.).",
        },
        {
          q: "How do I suggest a new feature?",
          a: "Open an issue at github.com/sadhutech/genesis/issues with label 'enhancement'. Community votes on priority.",
        },
        {
          q: "I want to contribute threat intel",
          a: "Use /report page. Your submission is verified by the community and added to the threat database.",
        },
        {
          q: "Is there a bug bounty program?",
          a: "Check github.com/sadhutech/genesis for security policy. Report vulnerabilities responsibly.",
        },
      ],
    },
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="text-6xl">❓</div>
        <h1 className="text-5xl font-black text-white">Help & Support</h1>
        <p className="text-lg text-teal-200 max-w-2xl mx-auto">
          Find answers to common questions or get in touch with our team.
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-6">
        <a
          href="https://github.com/sadhutech/genesis/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-slate-900/50 border border-teal-500/30 rounded-2xl p-8 hover:border-teal-500/60 hover:shadow-lg hover:shadow-teal-500/20 transition-all group"
        >
          <div className="text-3xl mb-3">🐛</div>
          <h3 className="font-bold text-white group-hover:text-teal-300">Report a Bug</h3>
          <p className="text-sm text-slate-400 mt-2">Found something broken? Let us know on GitHub.</p>
        </a>

        <a
          href="/report"
          className="bg-slate-900/50 border border-teal-500/30 rounded-2xl p-8 hover:border-teal-500/60 hover:shadow-lg hover:shadow-teal-500/20 transition-all group"
        >
          <div className="text-3xl mb-3">🚨</div>
          <h3 className="font-bold text-white group-hover:text-teal-300">Report a Threat</h3>
          <p className="text-sm text-slate-400 mt-2">Submit a dangerous address to the threat database.</p>
        </a>

        <a
          href="mailto:support@genesis.com"
          className="bg-slate-900/50 border border-teal-500/30 rounded-2xl p-8 hover:border-teal-500/60 hover:shadow-lg hover:shadow-teal-500/20 transition-all group"
        >
          <div className="text-3xl mb-3">✉️</div>
          <h3 className="font-bold text-white group-hover:text-teal-300">Email Support</h3>
          <p className="text-sm text-slate-400 mt-2">support@genesis.com — We usually respond within 24h</p>
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
            href="mailto:support@genesis.com"
            className="px-6 py-3 bg-teal-500 text-slate-950 font-bold rounded-xl hover:bg-teal-400 transition-all"
          >
            Email support@genesis.com
          </a>
          <a
            href="https://github.com/sadhutech/genesis/discussions"
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
