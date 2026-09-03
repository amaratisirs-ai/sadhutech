"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  chain: string;
}

/**
 * WalletConnect integration page
 * Shows list of 50+ supported wallets and QR code for connection
 * 
 * Flow:
 * 1. User sees wallet list (Trust, Argent, Rainbow, etc)
 * 2. Scans QR or clicks wallet name
 * 3. Wallet opens WalletConnect URI
 * 4. Desktop & mobile approve connection
 * 5. GENESIS snap installs via wallet connection
 */
export default function WalletConnect() {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletOption | null>(null);

  // Popular WalletConnect-supported wallets
  const walletOptions: WalletOption[] = [
    // Mobile wallets (primary for WC)
    { id: "trust", name: "Trust Wallet", icon: "🔵", chain: "EVM" },
    { id: "argent", name: "Argent", icon: "🔐", chain: "EVM" },
    { id: "rainbow", name: "Rainbow", icon: "🌈", chain: "EVM" },
    { id: "wallet3", name: "Wallet3", icon: "3️⃣", chain: "EVM" },
    { id: "walletio", name: "Wallet.io", icon: "💳", chain: "EVM" },
    { id: "math", name: "Math Wallet", icon: "➕", chain: "Multi" },
    { id: "ledger", name: "Ledger Live", icon: "🔑", chain: "EVM" },
    { id: "zerion", name: "Zerion", icon: "🎯", chain: "EVM" },
    
    // Desktop wallets with mobile support
    { id: "gnosis", name: "Safe (Gnosis)", icon: "📦", chain: "EVM" },
    { id: "imtoken", name: "imToken", icon: "🪙", chain: "Multi" },
    { id: "tokenpocket", name: "TokenPocket", icon: "👝", chain: "Multi" },
    { id: "huobi", name: "Huobi Wallet", icon: "🚀", chain: "Multi" },
    
    // More options
    { id: "hyperpay", name: "HyperPay", icon: "⚡", chain: "Multi" },
    { id: "ambire", name: "Ambire", icon: "🎭", chain: "EVM" },
    { id: "alphawallet", name: "AlphaWallet", icon: "Ⓐ", chain: "EVM" },
    { id: "coinomi", name: "Coinomi", icon: "🪙", chain: "Multi" },
  ];

  useEffect(() => {
    // TODO: Initialize WalletConnect SDK
    // const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
    // if (!projectId) {
    //   console.error("WalletConnect project ID not configured");
    // }
  }, []);

  const handleWalletSelect = async (wallet: WalletOption) => {
    setSelectedWallet(wallet);
    setIsConnecting(true);

    try {
      // TODO: Implement WalletConnect connection
      // 1. Create WalletConnect session
      // 2. Generate URI
      // 3. Show QR code or deep link
      // 4. Wait for wallet approval
      // 5. Install snap through connected wallet
      
      console.log(`Connecting to ${wallet.name}...`);
      
      // Simulated connection flow
      // In production, this would use @walletconnect/web3wallet SDK
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // After successful connection, proceed to snap installation
      // router.push(`/after-install?wallet=${wallet.id}`);
    } catch (error) {
      console.error("Connection failed:", error);
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl md:text-6xl font-black text-white">
          🔗 Connect Your Wallet
        </h1>
        <p className="text-xl text-teal-200 max-w-2xl mx-auto">
          Choose from 50+ wallets. Scan QR code or tap your wallet to connect.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Left: Wallet List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white mb-4">📱 Available Wallets</h2>
          <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
            {walletOptions.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleWalletSelect(wallet)}
                disabled={isConnecting}
                className={`p-4 rounded-lg border-2 transition-all text-center space-y-2 ${
                  selectedWallet?.id === wallet.id
                    ? "border-teal-400 bg-teal-900/40"
                    : "border-slate-600 bg-slate-800/50 hover:border-teal-500"
                } ${isConnecting && selectedWallet?.id !== wallet.id ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="text-3xl">{wallet.icon}</div>
                <div className="text-sm font-bold text-white">{wallet.name}</div>
                <div className="text-xs text-teal-300">{wallet.chain}</div>
              </button>
            ))}
          </div>

          {/* Info Box */}
          <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4 mt-4 space-y-2">
            <p className="text-sm font-semibold text-blue-200">💡 How it works:</p>
            <ol className="text-xs text-blue-100 space-y-1">
              <li>1. Tap your wallet above</li>
              <li>2. Scan QR code with your phone</li>
              <li>3. Approve connection in wallet</li>
              <li>4. GENESIS installs automatically</li>
            </ol>
          </div>
        </div>

        {/* Right: QR Code / Status */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white mb-4">📲 Scan to Connect</h2>
          
          {!selectedWallet ? (
            <div className="bg-slate-800 border-2 border-dashed border-slate-600 rounded-lg p-12 flex items-center justify-center h-72">
              <div className="text-center space-y-2">
                <div className="text-6xl">📱</div>
                <p className="text-slate-300 font-medium">Select a wallet to begin</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* QR Code Placeholder */}
              <div className="bg-white p-6 rounded-lg flex items-center justify-center h-72 border-2 border-teal-400">
                <div className="text-center space-y-3">
                  {isConnecting ? (
                    <>
                      <div className="inline-block">
                        <div className="animate-spin text-5xl">⏳</div>
                      </div>
                      <p className="text-slate-700 font-semibold">Connecting to {selectedWallet.name}...</p>
                      <p className="text-xs text-slate-500">Scan the QR code with your wallet</p>
                    </>
                  ) : (
                    <>
                      <div className="bg-gradient-to-br from-slate-300 to-slate-200 p-4 rounded-lg inline-block w-48 h-48">
                        {/* QR code would render here via qrcode.react */}
                        <div className="text-slate-400 text-sm h-full flex items-center justify-center">
                          QR Code<br />({selectedWallet.name})
                        </div>
                      </div>
                      <p className="text-slate-700 text-sm">Scan with {selectedWallet.name}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Selected Wallet Info */}
              <div className="bg-teal-900/30 border border-teal-500/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{selectedWallet.icon}</div>
                  <div>
                    <p className="font-bold text-white">{selectedWallet.name}</p>
                    <p className="text-xs text-teal-300">{selectedWallet.chain} • WalletConnect</p>
                  </div>
                </div>
                {isConnecting && (
                  <p className="text-xs text-teal-200">
                    Waiting for wallet approval... Check your {selectedWallet.name} mobile app.
                  </p>
                )}
              </div>

              {/* Back Button */}
              <button
                onClick={() => {
                  setSelectedWallet(null);
                  setIsConnecting(false);
                }}
                disabled={isConnecting}
                className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
              >
                ← Choose Different Wallet
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Network Support */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-950 border-2 border-slate-700 rounded-xl p-8 max-w-3xl mx-auto space-y-4">
        <h3 className="text-xl font-bold text-white">🌍 Supported Networks</h3>
        <div className="grid md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">⛓️</span>
            <p className="text-sm text-slate-200">Ethereum</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🟣</span>
            <p className="text-sm text-slate-200">Polygon</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🔵</span>
            <p className="text-sm text-slate-200">Arbitrum</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🔴</span>
            <p className="text-sm text-slate-200">Optimism</p>
          </div>
        </div>
        <p className="text-xs text-slate-400">+ 10+ more EVM chains supported</p>
      </section>

      {/* Security Info */}
      <section className="bg-gradient-to-br from-green-900/30 to-slate-900 border-2 border-green-500/40 rounded-xl p-8 max-w-3xl mx-auto space-y-3">
        <h3 className="text-xl font-bold text-white">🔒 Connection Security</h3>
        <ul className="space-y-2 text-sm text-slate-200">
          <li className="flex gap-2">
            <span className="text-green-400">✓</span>
            <span>WalletConnect uses industry-standard encryption</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-400">✓</span>
            <span>Your private keys never leave your wallet</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-400">✓</span>
            <span>GENESIS only receives transaction data for analysis</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-400">✓</span>
            <span>You approve each transaction before signing</span>
          </li>
        </ul>
      </section>

      {/* Alternative */}
      <div className="text-center space-y-4">
        <p className="text-slate-400">Don't see your wallet? Try the demo:</p>
        <a
          href="/post"
          className="inline-block px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg font-semibold transition border border-slate-700"
        >
          Try Demo Without Installing →
        </a>
      </div>
    </div>
  );
}
