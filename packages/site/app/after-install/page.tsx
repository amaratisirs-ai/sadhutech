"use client";

import { Icon } from "@/components/Icon";
import { Genesis, withGenesisStyle } from "@/components/Genesis";

export default function AfterInstallPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center text-emerald-400"><Icon name="checkCircle" className="w-16 h-16" /></div>
        <h1 className="text-5xl font-black text-white">You're Protected!</h1>
        <p className="text-lg text-teal-200 max-w-2xl mx-auto">
          <Genesis /> Snap is now active. Here's what happens next.
        </p>
      </div>

      {/* What to Expect Section */}
      <section className="bg-slate-900/50 rounded-2xl border border-teal-500/20 p-12">
        <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3"><Icon name="badge" className="w-7 h-7 text-teal-400" /> What to Expect</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Your First Transaction</h3>
            <p className="text-slate-300">
              Open any crypto app (Uniswap, OpenSea, etc.) and try a transaction. <strong>Before you sign</strong>, <Genesis /> will analyze it and show you a verdict.
            </p>
            <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4">
              <p className="text-sm text-teal-200 font-mono">
                Takes &lt;200ms • No gas fees • Works on all chains
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Where to See It</h3>
            <p className="text-slate-300">
              When you're about to sign a transaction in MetaMask, look for the <strong>"Insights"</strong> section. That's where <Genesis /> shows its analysis.
            </p>
            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4">
              <p className="text-sm text-indigo-200">
                New to MetaMask? The Insights panel is above the "Sign" button
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Three Verdicts - Visual Guide */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3"><Icon name="chart" className="w-7 h-7 text-teal-400" /> Understand the Verdicts</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              iconName: "checkCircle",
              verdict: "ALLOW",
              score: "0-30",
              meaning: "No risks detected",
              action: "Safe to sign",
              example: "Swapping on real Uniswap contract",
              color: "from-green-500/20 to-emerald-500/20",
              border: "border-green-500/30",
            },
            {
              iconName: "warning",
              verdict: "WARN",
              score: "31-70",
              meaning: "Potential risk detected",
              action: "Review carefully before signing",
              example: "Approving unlimited tokens to unknown contract",
              color: "from-yellow-500/20 to-orange-500/20",
              border: "border-yellow-500/30",
            },
            {
              iconName: "block",
              verdict: "BLOCK",
              score: "71-100",
              meaning: "Likely dangerous",
              action: "Do NOT sign this transaction",
              example: "Interacting with known drainer contract",
              color: "from-red-500/20 to-rose-500/20",
              border: "border-red-500/30",
            },
          ].map((item, i) => (
            <div
              key={i}
              className={`bg-gradient-to-br ${item.color} border-2 ${item.border} rounded-2xl p-8 space-y-4`}
            >
              <div className="space-y-2">
                <div className="text-emerald-300"><Icon name={item.iconName} className="w-12 h-12" /></div>
                <h3 className="text-2xl font-black text-white">{item.verdict}</h3>
                <p className="text-sm text-slate-400">Risk Score: {item.score}</p>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold">Meaning</p>
                  <p className="text-white font-semibold">{item.meaning}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold">What to Do</p>
                  <p className="text-white">{item.action}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold">Example</p>
                  <p className="text-slate-300 italic">{item.example}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Real-World Signals */}
      <section className="bg-slate-900/50 rounded-2xl border border-teal-500/20 p-12">
        <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3"><Icon name="search" className="w-7 h-7 text-teal-400" /> What <Genesis /> looks for</h2>

        <div className="space-y-4">
          {[
            {
              icon: "checkCircle",
              title: "Safe transactions",
              desc: "A normal, legitimate transaction with no known issues shows a green verdict and no findings.",
            },
            {
              icon: "warning",
              title: "Risky permissions",
              desc: "GENESIS may warn if a transaction requests broad or unnecessary token approvals that could expose your wallet.",
            },
            {
              icon: "block",
              title: "Known threats",
              desc: "If a destination or smart contract matches a known drainer, phishing pattern, or flagged address, GENESIS blocks it before you sign.",
            },
          ].map((scenario, i) => (
            <div key={i} className="bg-slate-800/50 border border-teal-500/10 rounded-lg p-6 space-y-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-3">
                <Icon name={scenario.icon as any} className="w-5 h-5 text-teal-400" />
                <span>{scenario.title}</span>
              </h3>
              <p className="text-slate-300">{withGenesisStyle(scenario.desc)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Findings Explained */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3"><Icon name="search" className="w-7 h-7 text-teal-400" /> What Findings Mean</h2>
        
        <p className="text-slate-300 mb-6">
          When <Genesis /> detects something, it shows a finding with details. Here are common ones:
        </p>

        <div className="space-y-4">
          {[
            {
              id: "intel.confirmed",
              title: "Community-Flagged Address (Verified)",
              severity: "HIGH",
              meaning: "Multiple security experts have flagged this address as dangerous",
              action: "DO NOT SIGN. This is very likely a scam.",
            },
            {
              id: "intel.unconfirmed",
              title: "Community-Flagged Address (Unconfirmed)",
              severity: "MEDIUM",
              meaning: "Community members have reported this, but not yet verified",
              action: "Proceed with caution. Check on RugDoc or Twitter before signing.",
            },
            {
              id: "erc20.unlimited-approval",
              title: "Unlimited Token Approval",
              severity: "MEDIUM",
              meaning: "You're giving a contract permission to spend unlimited tokens",
              action: "Only do this if you trust the contract completely.",
            },
            {
              id: "general.hidden-function",
              title: "Hidden/Complex Function Call",
              severity: "MEDIUM",
              meaning: "Transaction calls multiple functions at once (batching)",
              action: "Decode the transaction to understand what it does.",
            },
          ].map((finding, i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-white">{finding.title}</h3>
                <span className="text-sm font-bold">{finding.severity}</span>
              </div>
              <p className="text-slate-300"><strong>Means:</strong> {finding.meaning}</p>
              <p className="text-teal-300"><strong>Action:</strong> {finding.action}</p>
              <p className="text-xs text-slate-500 font-mono">ID: {finding.id}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="bg-slate-900/50 rounded-2xl border border-teal-500/20 p-12">
        <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3"><Icon name="question" className="w-7 h-7 text-teal-400" /> Troubleshooting</h2>
        
        <div className="space-y-4">
          {[
            {
              q: "I don't see the Insights panel in MetaMask",
              a: "Make sure you're using MetaMask v11.0+. If snap is installed, the Insights tab should appear above the Sign button. Try refreshing the page and trying again.",
            },
            {
              q: "Snap shows WARN but I trust this app",
              a: "That's OK! GENESIS just shows the risk level. You can still proceed if you're confident. Common false positives: setting up governance voting or staking.",
            },
            {
              q: "Got an error during installation",
              a: "Try: (1) Refresh MetaMask, (2) Uninstall snap and reinstall, (3) Clear cache and try again. If it persists, contact support.",
            },
            {
              q: "Snap shows BLOCK but I think it's wrong",
              a: "You can still override and sign anyway (MetaMask lets you). But please report it via /report so we can investigate!",
            },
          ].map((item, i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-2">
              <h3 className="font-bold text-white text-lg">{item.q}</h3>
              <p className="text-slate-300">{withGenesisStyle(item.a)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Next Steps CTA */}
      <section className="text-center space-y-6">
        <h2 className="text-3xl font-bold text-white">Ready?</h2>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://uniswap.org"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-teal-500 text-slate-950 font-bold rounded-xl hover:bg-teal-400 transition-all"
          >
            Try Your First Transaction →
          </a>
          <a
            href="/report"
            className="px-6 py-3 border-2 border-teal-500 text-teal-300 font-bold rounded-xl hover:bg-teal-500/10 transition-all"
          >
            Report a Threat
          </a>
          <a
            href="/help"
            className="px-6 py-3 border-2 border-slate-600 text-slate-300 font-bold rounded-xl hover:border-slate-500 transition-all"
          >
            Get Help
          </a>
        </div>
      </section>

      {/* Final Note */}
      <section className="bg-teal-500/10 border-2 border-teal-500/30 rounded-2xl p-8 text-center space-y-3">
        <p className="text-teal-200">
          <strong>Pro Tip:</strong> <Genesis /> learns from your feedback. If you find a false positive or false negative, please report it!
        </p>
        <p className="text-sm text-slate-400">
          Privacy: <Genesis /> never sees your addresses or personal data. All analysis is done on your device.
        </p>
      </section>
    </div>
  );
}
