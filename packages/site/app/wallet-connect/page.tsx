// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  chain: string;
}

interface ConnectionState {
  uri: string | null;
  connectionApproved: boolean;
  error: string | null;
  isInitialized: boolean;
}

export default function WalletConnect() {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletOption | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    uri: null,
    connectionApproved: false,
    error: null,
    isInitialized: false,
  });
  const [provider, setProvider] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);

  const walletOptions: WalletOption[] = [
    { id: "trust", name: "Trust Wallet", icon: "🔵", chain: "EVM" },
    { id: "argent", name: "Argent", icon: "🔐", chain: "EVM" },
    { id: "rainbow", name: "Rainbow", icon: "🌈", chain: "EVM" },
    { id: "wallet3", name: "Wallet3", icon: "3️⃣", chain: "EVM" },
    { id: "walletio", name: "Wallet.io", icon: "💳", chain: "EVM" },
    { id: "math", name: "Math Wallet", icon: "➕", chain: "Multi" },
    { id: "ledger", name: "Ledger Live", icon: "🔑", chain: "EVM" },
    { id: "zerion", name: "Zerion", icon: "🎯", chain: "EVM" },
    { id: "gnosis", name: "Safe (Gnosis)", icon: "📦", chain: "EVM" },
    { id: "imtoken", name: "imToken", icon: "🪙", chain: "Multi" },
    { id: "tokenpocket", name: "TokenPocket", icon: "👝", chain: "Multi" },
    { id: "huobi", name: "Huobi Wallet", icon: "🚀", chain: "Multi" },
    { id: "hyperpay", name: "HyperPay", icon: "⚡", chain: "Multi" },
    { id: "ambire", name: "Ambire", icon: "🎭", chain: "EVM" },
    { id: "alphawallet", name: "AlphaWallet", icon: "Ⓐ", chain: "EVM" },
    { id: "coinomi", name: "Coinomi", icon: "🪙", chain: "Multi" },
  ];

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /iPhone|iPad|iPod|Android|Windows Phone/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const initWalletConnect = async () => {
      try {
        const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
        if (!projectId) {
          setConnectionState({
            uri: null,
            connectionApproved: false,
            error: "WalletConnect Project ID not configured",
            isInitialized: false,
          });
          return;
        }

        console.log("Initializing WalletConnect EthereumProvider...");
        const { EthereumProvider } = await import("@walletconnect/ethereum-provider");

        const ethereumProvider = await EthereumProvider.init({
          projectId,
          chains: [1, 137, 42161, 10, 43114],
          showQrModal: false,
          methods: ["eth_sendTransaction", "eth_signMessage", "eth_sign", "wallet_requestSnaps"],
          events: ["chainChanged", "accountsChanged"],
          metadata: {
            name: "GENESIS Firewall",
            description: "Community-powered transaction security firewall",
            url: "https://sadhutech.com",
            icons: ["https://sadhutech.com/images/genesis-icon.png"],
          },
        });

        setProvider(ethereumProvider);

        ethereumProvider.on("connect", () => {
          console.log("✅ Provider connected");
          setConnectionState((prev) => ({ ...prev, connectionApproved: true }));
        });

        ethereumProvider.on("disconnect", () => {
          console.log("❌ Provider disconnected");
          setIsConnecting(false);
        });

        ethereumProvider.on("display_uri", (uri: string) => {
          console.log("📱 QR URI:", uri);
          setConnectionState((prev) => ({ ...prev, uri }));
          
          // On mobile, automatically try to open wallet deep link
          if (isMobile && uri) {
            setTimeout(() => {
              window.location.href = uri;
            }, 500);
          }
        });

        setConnectionState((prev) => ({ ...prev, isInitialized: true }));
        console.log("✅ WalletConnect initialized");
      } catch (error) {
        console.error("❌ Init failed:", error);
        setConnectionState({
          uri: null,
          connectionApproved: false,
          error: error instanceof Error ? error.message : "Failed to initialize",
          isInitialized: false,
        });
      }
    };

    initWalletConnect();
  }, [isMobile]);

  const handleWalletSelect = async (wallet: WalletOption) => {
    if (!provider || !connectionState.isInitialized) {
      setConnectionState((prev) => ({ ...prev, error: "Not initialized" }));
      return;
    }

    setSelectedWallet(wallet);
    setIsConnecting(true);
    setConnectionState((prev) => ({ ...prev, uri: null, connectionApproved: false, error: null }));

    try {
      console.log(`Connecting with ${wallet.name}...`);
      const accounts = await provider.connect();
      console.log("Connected:", accounts);
      
      setTimeout(() => router.push(`/snap-install?wallet=${wallet.id}`), 1500);
    } catch (error) {
      console.error("Connect error:", error);
      const msg = error instanceof Error ? error.message : "Connection failed";
      setConnectionState((prev) => ({ ...prev, error: msg }));
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-5xl md:text-6xl font-black text-white">🔗 Connect Your Wallet</h1>
        <p className="text-xl text-teal-200 max-w-2xl mx-auto">
          {isMobile 
            ? "Tap your wallet to connect instantly" 
            : "Choose from 50+ wallets. Scan QR code or add wallet."}
        </p>
      </div>

      <div className={`grid ${isMobile ? "grid-cols-1" : "md:grid-cols-2"} gap-8 max-w-5xl mx-auto`}>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white mb-4">📱 Available Wallets</h2>
          <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
            {walletOptions.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleWalletSelect(wallet)}
                disabled={isConnecting}
                className={`p-4 rounded-lg border-2 transition-all text-center space-y-2 ${
                  selectedWallet?.id === wallet.id ? "border-teal-400 bg-teal-900/40" : "border-slate-600 bg-slate-800/50 hover:border-teal-500"
                } ${isConnecting && selectedWallet?.id !== wallet.id ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="text-3xl">{wallet.icon}</div>
                <div className="text-sm font-bold text-white">{wallet.name}</div>
                <div className="text-xs text-teal-300">{wallet.chain}</div>
              </button>
            ))}
          </div>
          <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4 mt-4 space-y-2">
            <p className="text-sm font-semibold text-blue-200">💡 How it works:</p>
            <ol className="text-xs text-blue-100 space-y-1">
              {isMobile ? (
                <>
                  <li>1. Tap your wallet above</li>
                  <li>2. App opens automatically</li>
                  <li>3. Approve connection in wallet</li>
                  <li>4. GENESIS installs automatically</li>
                </>
              ) : (
                <>
                  <li>1. Tap a wallet or scan QR</li>
                  <li>2. {selectedWallet ? "Scan QR with your phone" : "Select a wallet to see options"}</li>
                  <li>3. Approve connection in wallet</li>
                  <li>4. GENESIS installs automatically</li>
                </>
              )}
            </ol>
          </div>
        </div>

        {!isMobile && (
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
              {connectionState.error && (
                <div className="bg-red-900/40 border border-red-500/50 rounded-lg p-4">
                  <p className="text-sm text-red-200">{connectionState.error}</p>
                </div>
              )}
              <div className="bg-white p-6 rounded-lg flex items-center justify-center h-72 border-2 border-teal-400">
                <div className="text-center space-y-3">
                  {isConnecting && !connectionState.uri ? (
                    <>
                      <div className="animate-spin text-5xl">⏳</div>
                      <p className="text-slate-700 font-semibold">Connecting to {selectedWallet.name}...</p>
                      <p className="text-xs text-slate-500">Generating QR code...</p>
                    </>
                  ) : connectionState.uri ? (
                    <>
                      <QRCodeCanvas value={connectionState.uri} size={200} level="H" includeMargin={true} />
                      <p className="text-slate-700 text-sm font-medium">Scan with {selectedWallet.name}</p>
                      <p className="text-xs text-slate-500">{connectionState.connectionApproved ? "✅ Connection approved!" : "Waiting for approval..."}</p>
                    </>
                  ) : (
                    <>
                      <div className="text-slate-400 text-sm">No QR code generated</div>
                      <p className="text-xs text-slate-500">Try selecting another wallet</p>
                    </>
                  )}
                </div>
              </div>
              <div className="bg-teal-900/30 border border-teal-500/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{selectedWallet.icon}</div>
                  <div>
                    <p className="font-bold text-white">{selectedWallet.name}</p>
                    <p className="text-xs text-teal-300">{selectedWallet.chain} • WalletConnect</p>
                  </div>
                </div>
                {isConnecting && !connectionState.connectionApproved && (
                  <p className="text-xs text-teal-200">Waiting for wallet approval... Check your {selectedWallet.name} mobile app.</p>
                )}
                {connectionState.connectionApproved && (
                  <p className="text-xs text-teal-200">✅ Connected! Redirecting to snap installation...</p>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedWallet(null);
                  setIsConnecting(false);
                  setConnectionState((prev) => ({ ...prev, uri: null, connectionApproved: false, error: null }));
                }}
                disabled={isConnecting}
                className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
              >
                ← Choose Different Wallet
              </button>
            </div>
          )}
        </div>
        )}
      </div>

      {isMobile && selectedWallet && (
        <div className="bg-gradient-to-br from-teal-900/40 to-slate-900 border-2 border-teal-500/50 rounded-xl p-8 max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="text-6xl animate-bounce">{selectedWallet.icon}</div>
            <div>
              <h3 className="text-2xl font-bold text-white">{selectedWallet.name}</h3>
              <p className="text-teal-300 text-sm">Opening wallet...</p>
            </div>
          </div>

          {connectionState.error ? (
            <div className="bg-red-900/40 border border-red-500/50 rounded-lg p-4">
              <p className="text-sm text-red-200 mb-4">{connectionState.error}</p>
              <button
                onClick={() => {
                  setSelectedWallet(null);
                  setIsConnecting(false);
                  setConnectionState((prev) => ({ ...prev, uri: null, connectionApproved: false, error: null }));
                }}
                className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold transition"
              >
                Try Another Wallet
              </button>
            </div>
          ) : connectionState.connectionApproved ? (
            <div className="bg-green-900/40 border border-green-500/50 rounded-lg p-4 text-center space-y-2">
              <p className="text-green-200 font-semibold">✅ Connection Approved!</p>
              <p className="text-xs text-green-300">Installing GENESIS snap...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4 space-y-3">
                <p className="text-sm text-slate-200">
                  Your {selectedWallet.name} app should open automatically. If it doesn't, tap the button below.
                </p>
                <button
                  onClick={() => {
                    if (connectionState.uri) {
                      window.location.href = connectionState.uri;
                    }
                  }}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition"
                >
                  Open {selectedWallet.name}
                </button>
              </div>
              <button
                onClick={() => {
                  setSelectedWallet(null);
                  setIsConnecting(false);
                  setConnectionState((prev) => ({ ...prev, uri: null, connectionApproved: false, error: null }));
                }}
                className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold transition"
              >
                ← Choose Different Wallet
              </button>
            </div>
          )}
        </div>
      )}

      <section className="bg-gradient-to-r from-slate-900 to-slate-950 border-2 border-slate-700 rounded-xl p-8 max-w-3xl mx-auto space-y-4">
        <h3 className="text-xl font-bold text-white">🌍 Supported Networks</h3>
        <div className="grid md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2"><span className="text-lg">⛓️</span><p className="text-sm text-slate-200">Ethereum</p></div>
          <div className="flex items-center gap-2"><span className="text-lg">🟣</span><p className="text-sm text-slate-200">Polygon</p></div>
          <div className="flex items-center gap-2"><span className="text-lg">🔵</span><p className="text-sm text-slate-200">Arbitrum</p></div>
          <div className="flex items-center gap-2"><span className="text-lg">🔴</span><p className="text-sm text-slate-200">Optimism</p></div>
        </div>
        <p className="text-xs text-slate-400">+ 10+ more EVM chains supported</p>
      </section>

      <section className="bg-gradient-to-br from-green-900/30 to-slate-900 border-2 border-green-500/40 rounded-xl p-8 max-w-3xl mx-auto space-y-3">
        <h3 className="text-xl font-bold text-white">🔒 Connection Security</h3>
        <ul className="space-y-2 text-sm text-slate-200">
          <li className="flex gap-2"><span className="text-green-400">✓</span><span>WalletConnect uses industry-standard encryption</span></li>
          <li className="flex gap-2"><span className="text-green-400">✓</span><span>Your private keys never leave your wallet</span></li>
          <li className="flex gap-2"><span className="text-green-400">✓</span><span>GENESIS only receives transaction data</span></li>
          <li className="flex gap-2"><span className="text-green-400">✓</span><span>You approve each transaction before signing</span></li>
        </ul>
      </section>
    </div>
  );
}
