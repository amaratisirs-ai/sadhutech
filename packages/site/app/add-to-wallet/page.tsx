"use client";

import { useRouter } from "next/navigation";

export default function AddToWallet() {
  const router = useRouter();

  const wallets = [
    {
      id: "metamask",
      name: "MetaMask Snap",
      description: "Install GENESIS inside MetaMask on desktop so verdicts appear before signing.",
      icon: "🦊",
      badge: "MetaMask only",
      status: "ready",
      action: () => router.push("/snap-install"),
      details: [
        "Best for desktop MetaMask users",
        "Shows verdicts inside the wallet",
        "No wallet switching required",
        "Fastest way to get protected",
      ],
    },
    {
      id: "wallet-connect",
      name: "WalletConnect",
      description: "Connect supported mobile wallets using WalletConnect and test the real production flow.",
      icon: "🔗",
      badge: "Recommended",
      status: "ready",
      action: () => router.push("/wallet-connect"),
      details: [
        "Primary production path for non-MetaMask users",
        "Works with supported mobile wallets",
        "Use the API Explorer to test real requests",
        "No MetaMask required",
      ],
    },
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl md:text-6xl font-black text-white">� Connect Wallet</h1>
        <p className="text-xl text-teal-200 max-w-2xl mx-auto">
          Choose how you want to connect. MetaMask for desktop or WalletConnect for supported mobile wallets.
        </p>
      </div>

      <section className="bg-gradient-to-br from-indigo-900/30 to-slate-900 border-2 border-indigo-500/40 rounded-2xl p-6 max-w-4xl mx-auto space-y-3">
        <h2 className="text-2xl font-bold text-white">Select your wallet path</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-200">
          <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-4 space-y-2">
            <p className="font-bold text-white">MetaMask</p>
            <p>Best for desktop MetaMask users who want GENESIS inside the wallet.</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-4 space-y-2">
            <p className="font-bold text-white">WalletConnect</p>
            <p>Best for mobile wallets like Trust Wallet, Rainbow, and other supported wallets.</p>
          </div>
        </div>
      </section>

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
        <h2 className="text-2xl font-bold text-white">What you get after onboarding</h2>
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

      <section className="bg-slate-900/60 border border-teal-500/30 rounded-2xl p-6 max-w-3xl mx-auto space-y-3">
        <h2 className="text-2xl font-bold text-white">Recommended production flow</h2>
        <p className="text-sm text-slate-200">
          Use WalletConnect to connect your mobile wallet, then open the API Explorer to test transaction analysis and confirm the verdict before signing.
        </p>
      </section>
    </div>
  );
}
