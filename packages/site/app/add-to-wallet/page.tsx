"use client";

import { useRouter } from "next/navigation";

export default function AddToWallet() {
  const router = useRouter();

  const wallets = [
    {
      id: "metamask",
      name: "MetaMask",
      description: "Browser extension (Chrome, Firefox, Safari, Brave)",
      icon: "🦊",
      badge: "Most Popular",
      status: "ready",
      action: () => router.push("/snap-install"),
      details: [
        "Desktop browsers only",
        "Browser extension required",
        "Instant installation",
        "Auto-protection on every transaction",
      ],
    },
    {
      id: "coinbase",
      name: "Coinbase Wallet",
      description: "Browser extension & mobile app",
      icon: "◇",
      badge: "Coming Soon",
      status: "coming",
      details: [
        "Desktop & mobile support",
        "Native dapp browser",
        "Enhanced security",
      ],
    },
    {
      id: "wallet-connect",
      name: "WalletConnect Compatible",
      description: "Trust Wallet, Argent, Rainbow, and 50+ others",
      icon: "🔗",
      badge: "Coming Soon",
      status: "coming",
      details: [
        "Multi-wallet support",
        "Mobile-first approach",
        "Unified threat detection",
      ],
    },
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl md:text-6xl font-black text-white">🛡️ Add GENESIS to Your Wallet</h1>
        <p className="text-xl text-teal-200 max-w-2xl mx-auto">
          Select your wallet to get transaction security. Real-time threat detection, one-click installation.
        </p>
      </div>

      {/* Wallet Cards */}
      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto w-full">
        {wallets.map((wallet) => (
          <div
            key={wallet.id}
            className={`group rounded-2xl border-2 p-8 space-y-6 transition-all ${
              wallet.status === "ready"
                ? "bg-gradient-to-br from-teal-900/50 to-slate-900 border-teal-400 hover:shadow-2xl hover:shadow-teal-500/40"
                : "bg-gradient-to-br from-slate-800/50 to-slate-900 border-slate-600 opacity-75"
            }`}
          >
            {/* Badge */}
            {wallet.badge && (
              <div className="flex justify-between items-start">
                <div className="text-5xl">{wallet.icon}</div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    wallet.status === "ready"
                      ? "bg-teal-500/30 text-teal-200"
                      : "bg-slate-600/50 text-slate-300"
                  }`}
                >
                  {wallet.badge}
                </span>
              </div>
            )}

            {/* Content */}
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-white">{wallet.name}</h3>
              <p className="text-sm text-slate-200">{wallet.description}</p>
            </div>

            {/* Features */}
            <div className="space-y-2 py-4 border-y border-slate-700">
              {wallet.details.map((detail, i) => (
                <div key={i} className="flex gap-2 text-sm">
                  <span className="text-teal-400 flex-shrink-0">✓</span>
                  <span className="text-slate-200">{detail}</span>
                </div>
              ))}
            </div>

            {/* Button */}
            <button
              onClick={wallet.action}
              disabled={wallet.status !== "ready"}
              className={`w-full py-3 rounded-lg font-bold transition-all ${
                wallet.status === "ready"
                  ? "bg-teal-600 hover:bg-teal-500 text-white shadow-lg hover:shadow-teal-500/50"
                  : "bg-slate-700 text-slate-400 cursor-not-allowed"
              }`}
            >
              {wallet.status === "ready" ? (
                <>Add {wallet.name.split(" ")[0]} →</>
              ) : (
                <>Coming Soon</>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Info Section */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-slate-700 rounded-2xl p-8 max-w-3xl mx-auto w-full space-y-4">
        <h2 className="text-2xl font-bold text-white">Why add GENESIS?</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex gap-3">
            <span className="text-2xl text-teal-400">⚡</span>
            <div>
              <p className="font-semibold text-white text-sm">Instant Protection</p>
              <p className="text-xs text-slate-300">Real-time threat detection on every transaction</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-2xl text-teal-400">🎯</span>
            <div>
              <p className="font-semibold text-white text-sm">Clear Verdicts</p>
              <p className="text-xs text-slate-300">ALLOW, WARN, or BLOCK decisions</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-2xl text-teal-400">🔒</span>
            <div>
              <p className="font-semibold text-white text-sm">100% Private</p>
              <p className="text-xs text-slate-300">Runs locally on your device</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-2xl text-teal-400">✓</span>
            <div>
              <p className="font-semibold text-white text-sm">Community-Powered</p>
              <p className="text-xs text-slate-300">Threat data verified by the community</p>
            </div>
          </div>
        </div>
      </section>

      {/* Alternative: Just Test */}
      <div className="text-center space-y-4">
        <p className="text-slate-400">Want to test first without installing?</p>
        <a
          href="/post"
          className="inline-block px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg font-semibold transition border border-slate-700"
        >
          Try the Demo →
        </a>
      </div>
    </div>
  );
}
