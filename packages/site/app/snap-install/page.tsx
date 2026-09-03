"use client";

import { useState } from "react";

// Type declaration for MetaMask's window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any }) => Promise<any>;
    };
  }
}

export default function SnapInstallPage() {
  const [installStep, setInstallStep] = useState<"intro" | "installing" | "confirm" | "done">("intro");
  const [isInstalled, setIsInstalled] = useState(false);

  const handleInstallClick = async () => {
    setInstallStep("installing");

    try {
      if (!window.ethereum) {
        alert("🔧 MetaMask Required\n\nGENESIS runs as a MetaMask Snap. You'll need to install MetaMask first (it's free).\n\n👉 Download MetaMask: https://metamask.io\n\nThen come back here and click \"Install GENESIS Snap\" again!");
        setInstallStep("intro");
        return;
      }

      // Snap ID published to npm: https://www.npmjs.com/package/genesis-snap
      const snapId = "npm:genesis-snap";
      
      // Attempt to install the snap
      await window.ethereum.request({
        method: "wallet_requestSnaps",
        params: {
          [snapId]: {},
        },
      });

      setIsInstalled(true);
      setInstallStep("done");
    } catch (err) {
      console.error("Snap installation failed:", err);
      alert(err instanceof Error ? err.message : "Installation failed. Please try again.");
      setInstallStep("intro");
    }
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black text-white">
          🔐 Get GENESIS Protection
        </h1>
        <p className="text-lg text-teal-200 max-w-2xl mx-auto">
          Install the MetaMask Snap to instantly check every transaction against our threat intelligence network before you sign.
        </p>
      </div>

      {/* Main Content */}
      <div className="grid md:grid-cols-2 gap-12 items-center">
        {/* Left: Benefits */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-white">Why GENESIS?</h2>
            <ul className="space-y-3">
              {[
                { icon: "⚡", title: "Instant Analysis", desc: "Analyzed in milliseconds, right in your wallet" },
                { icon: "🛡️", title: "Community Intelligence", desc: "Community-verified threat detection powered by collective security" },
                { icon: "📊", title: "Risk Score", desc: "Clear verdict: ALLOW, WARN, or BLOCK" },
                { icon: "🔄", title: "Always Updated", desc: "New threats added hourly from the community" },
                { icon: "🤝", title: "Community Powered", desc: "Help protect others by reporting threats" },
                { icon: "✅", title: "100% Private", desc: "Runs locally on your machine, no data tracking" },
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <h3 className="font-bold text-white">{item.title}</h3>
                    <p className="text-sm text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: Installation */}
        <div className="space-y-6">
          {installStep === "intro" && (
            <div className="bg-gradient-to-br from-teal-500/10 to-indigo-500/10 border-2 border-teal-500/30 rounded-2xl p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="text-6xl">🦊</div>
                <h3 className="text-xl font-bold text-white">MetaMask Snap</h3>
                <p className="text-sm text-slate-400">npm: genesis-snap v0.0.1</p>
                <p className="text-xs text-teal-400 mt-1">
                  <a href="https://www.npmjs.com/package/genesis-snap" target="_blank" rel="noopener noreferrer" className="underline hover:text-teal-300">
                    View on npm →
                  </a>
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex gap-2 items-start">
                  <span className="text-green-400 font-bold">✓</span>
                  <div>
                    <p className="font-semibold text-white">Works with MetaMask</p>
                    <p className="text-xs text-slate-400">Any version that supports Snaps</p>
                  </div>
                </div>
                <div className="flex gap-2 items-start">
                  <span className="text-green-400 font-bold">✓</span>
                  <div>
                    <p className="font-semibold text-white">Non-custodial</p>
                    <p className="text-xs text-slate-400">Your keys, your control, always</p>
                  </div>
                </div>
                <div className="flex gap-2 items-start">
                  <span className="text-green-400 font-bold">✓</span>
                  <div>
                    <p className="font-semibold text-white">Open Source</p>
                    <p className="text-xs text-slate-400">Audit it yourself on GitHub</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleInstallClick}
                className="w-full px-6 py-4 bg-gradient-to-r from-teal-500 to-teal-400 text-slate-950 font-bold rounded-xl hover:shadow-xl hover:shadow-teal-500/50 transition-all text-lg"
              >
                + Install GENESIS Snap
              </button>

              <p className="text-xs text-slate-500 text-center">
                You'll be prompted to approve the installation in MetaMask
              </p>
            </div>
          )}

          {installStep === "installing" && (
            <div className="bg-gradient-to-br from-indigo-500/10 to-teal-500/10 border-2 border-indigo-500/30 rounded-2xl p-8 space-y-6 text-center">
              <div className="space-y-3">
                <div className="inline-block">
                  <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto animate-spin">
                    <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white">Installing...</h3>
                <p className="text-slate-400">
                  Check your MetaMask popup to confirm installation
                </p>
              </div>
            </div>
          )}

          {installStep === "done" && (
            <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 border-2 border-green-500/30 rounded-2xl p-8 space-y-6">
              <div className="text-center space-y-3">
                <div className="text-6xl">✅</div>
                <h3 className="text-2xl font-bold text-white">All Set!</h3>
                <p className="text-slate-400">GENESIS is now protecting your transactions</p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 space-y-2 text-sm">
                <p className="text-white font-semibold">What happens next:</p>
                <ol className="space-y-2 text-slate-300">
                  <li>1. Try any transaction in any app (Uniswap, OpenSea, etc.)</li>
                  <li>2. MetaMask will show GENESIS's analysis before you sign</li>
                  <li>3. Get a clear verdict: ALLOW, WARN, or BLOCK</li>
                </ol>
              </div>

              <a
                href="/after-install"
                className="block px-6 py-3 bg-teal-500 text-slate-950 font-bold rounded-xl hover:bg-teal-400 transition-all text-center"
              >
                What's Next? →
              </a>

              <a
                href="/"
                className="block px-6 py-2 border-2 border-teal-500/30 text-teal-300 font-semibold rounded-xl hover:bg-teal-500/10 transition-all text-center"
              >
                Back to Home
              </a>
            </div>
          )}
        </div>
      </div>

      {/* How It Works - Visual Flow */}
      <div className="bg-slate-900/50 rounded-2xl border border-teal-500/20 p-12">
        <h2 className="text-2xl font-bold text-white text-center mb-12">How Protection Works</h2>
        <div className="grid md:grid-cols-4 gap-8">
          {[
            { num: "1", emoji: "📝", title: "You Sign", desc: "You're about to sign a transaction" },
            { num: "2", emoji: "🔍", title: "We Analyze", desc: "Checked against community threat intelligence in <200ms" },
            { num: "3", emoji: "📊", title: "We Score", desc: "Risk computed from community intel" },
            { num: "4", emoji: "✅", title: "You Decide", desc: "Clear verdict before you confirm" },
          ].map((step, i) => (
            <div key={i} className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-teal-500/20 border-2 border-teal-500 flex items-center justify-center mx-auto font-bold text-teal-300">
                {step.num}
              </div>
              <div className="text-3xl">{step.emoji}</div>
              <h3 className="font-bold text-white">{step.title}</h3>
              <p className="text-sm text-slate-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions Explained */}
      <div className="bg-indigo-500/10 border-2 border-indigo-500/30 rounded-2xl p-12">
        <h2 className="text-2xl font-bold text-white mb-6">🔐 About Snap Permissions</h2>
        <p className="text-slate-300 mb-8">
          When you install GENESIS, MetaMask asks for two permissions. Here's why we need them and how they keep you safe:
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="bg-slate-900/50 rounded-lg p-6 border border-indigo-500/20">
              <h3 className="text-lg font-bold text-white mb-3">🔍 Transaction Insight</h3>
              <p className="text-slate-300 mb-4">
                This lets GENESIS <strong>see transactions before you sign</strong> so it can analyze them for risks.
              </p>
              <div className="bg-slate-800/50 rounded p-3 text-sm text-slate-400 space-y-2">
                <p><strong>GENESIS sees:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Which address you're sending to</li>
                  <li>What function you're calling</li>
                  <li>Transaction amount</li>
                </ul>
                <p className="mt-3 pt-3 border-t border-slate-700"><strong>GENESIS does NOT see:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Your private key (impossible)</li>
                  <li>Your IP address or location</li>
                  <li>Other personal info</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900/50 rounded-lg p-6 border border-indigo-500/20">
              <h3 className="text-lg font-bold text-white mb-3">🌐 Network Access</h3>
              <p className="text-slate-300 mb-4">
                This lets GENESIS <strong>fetch the latest threat database</strong> from our servers so it has current threat intel.
              </p>
              <div className="bg-slate-800/50 rounded p-3 text-sm text-slate-400 space-y-2">
                <p><strong>Network access allows:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Download threat database (community-verified threats)</li>
                  <li>Check latest community reports</li>
                  <li>Send threat analysis (no personal data)</li>
                </ul>
                <p className="mt-3 pt-3 border-t border-slate-700"><strong>We never collect:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Your wallet addresses</li>
                  <li>Transaction history</li>
                  <li>Browsing data</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-teal-500/10 border border-teal-500/30 rounded-lg">
          <p className="text-teal-200">
            <strong>✅ Your security:</strong> GENESIS runs in MetaMask's sandbox. It can't access your keys, funds, or personal info. All analysis happens locally on your device.
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">FAQ</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              q: "Is it safe?",
              a: "Yes. The Snap runs locally in your MetaMask. We never see your private keys, addresses, or transaction data.",
            },
            {
              q: "Does it cost anything?",
              a: "No. GENESIS is free forever. Installation is free, usage is free, protection is free.",
            },
            {
              q: "Can I uninstall it?",
              a: "Yes, anytime. Just go to MetaMask Settings → Extensions → GENESIS → Remove.",
            },
            {
              q: "What if I find a false positive?",
              a: "Report it via /report page and help improve our threat intel. Your feedback trains the community.",
            },
            {
              q: "Works on mobile?",
              a: "Yes, MetaMask Mobile supports Snaps on both iOS and Android.",
            },
            {
              q: "How often is threat data updated?",
              a: "Hourly. New threats are added as the community reports them. You're always getting fresh intel.",
            },
          ].map((item, i) => (
            <div key={i} className="bg-slate-900/50 rounded-lg p-4 border border-teal-500/10 hover:border-teal-500/30 transition-all">
              <h3 className="font-bold text-white mb-2">{item.q}</h3>
              <p className="text-sm text-slate-400">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center space-y-4">
        <button
          onClick={handleInstallClick}
          disabled={isInstalled}
          className="px-8 py-4 bg-gradient-to-r from-teal-500 to-teal-400 text-slate-950 font-bold rounded-xl text-lg hover:shadow-xl hover:shadow-teal-500/50 transition-all disabled:opacity-50"
        >
          {isInstalled ? "✅ Installed" : "+ Add GENESIS to MetaMask"}
        </button>
      </div>
    </div>
  );
}
