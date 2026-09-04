// @ts-nocheck
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Icon, type IconName } from "@/components/Icon";

// Only request what every EVM wallet can fulfil. Non-universal methods (eth_sign,
// typed-data, chain switching) go in optionalMethods so wallets like Trust Wallet
// don't reject the whole session proposal. wallet_requestSnaps is MetaMask-only and
// must never be required here.
const REQUIRED_METHODS = ["eth_sendTransaction", "personal_sign"];
const OPTIONAL_METHODS = [
  "eth_sign",
  "eth_signTypedData",
  "eth_signTypedData_v4",
  "eth_accounts",
  "eth_chainId",
  "wallet_switchEthereumChain",
  "wallet_addEthereumChain",
];

function getProviderAccount(provider: any): string | null {
  const accounts = Array.isArray(provider?.accounts) ? provider.accounts : [];
  if (accounts[0]) return accounts[0];
  const nsAccount = provider?.session?.namespaces?.eip155?.accounts?.[0];
  return nsAccount ? nsAccount.split(":").slice(-1)[0] : null;
}

function getProviderChainId(provider: any): number {
  const raw = provider?.chainId;
  const parsed = typeof raw === "string" ? parseInt(raw, 10) : raw;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  iconName: IconName;
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
  const selectedWalletRef = useRef<WalletOption | null>(null);
  const hasFinalizedRef = useRef(false);

  useEffect(() => {
    selectedWalletRef.current = selectedWallet;
  }, [selectedWallet]);

  const walletOptions: WalletOption[] = [
    { id: "trust", name: "Trust Wallet", icon: "Trust", iconName: "wallet", chain: "EVM" },
    { id: "argent", name: "Argent", icon: "Argent", iconName: "shield", chain: "EVM" },
    { id: "rainbow", name: "Rainbow", icon: "Rainbow", iconName: "sparkles", chain: "EVM" },
    { id: "wallet3", name: "Wallet3", icon: "Wallet3", iconName: "wallet", chain: "EVM" },
    { id: "walletio", name: "Wallet.io", icon: "Wallet.io", iconName: "wallet", chain: "EVM" },
    { id: "math", name: "Math Wallet", icon: "Math", iconName: "chart", chain: "Multi" },
    { id: "ledger", name: "Ledger Live", icon: "Ledger", iconName: "lock", chain: "EVM" },
    { id: "zerion", name: "Zerion", icon: "Zerion", iconName: "chart", chain: "EVM" },
    { id: "gnosis", name: "Safe (Gnosis)", icon: "Safe", iconName: "shield", chain: "EVM" },
    { id: "imtoken", name: "imToken", icon: "imToken", iconName: "wallet", chain: "Multi" },
    { id: "tokenpocket", name: "TokenPocket", icon: "TokenPocket", iconName: "wallet", chain: "Multi" },
    { id: "huobi", name: "Huobi Wallet", icon: "Huobi", iconName: "rocket", chain: "Multi" },
    { id: "hyperpay", name: "HyperPay", icon: "HyperPay", iconName: "bolt", chain: "Multi" },
    { id: "ambire", name: "Ambire", icon: "Ambire", iconName: "shieldAlert", chain: "EVM" },
    { id: "alphawallet", name: "AlphaWallet", icon: "Alpha", iconName: "wallet", chain: "EVM" },
    { id: "coinomi", name: "Coinomi", icon: "Coinomi", iconName: "wallet", chain: "Multi" },
  ];

  const getWalletLaunchUrl = (wallet: WalletOption, uri: string) => {
    const encodedUri = encodeURIComponent(uri);

    switch (wallet.id) {
      case "trust":
        return `https://link.trustwallet.com/wc?uri=${encodedUri}`;
      case "rainbow":
        return `rainbow://wc?uri=${encodedUri}`;
      case "metamask":
        return `https://metamask.app.link/wc?uri=${encodedUri}`;
      case "coinbase":
        return `cbwallet://wc?uri=${encodedUri}`;
      default:
        return uri;
    }
  };

  const supportsWalletDeepLink = (wallet: WalletOption) =>
    ["trust", "rainbow", "metamask", "coinbase"].includes(wallet.id);

  const getQrValue = (wallet: WalletOption | null, uri: string | null) => {
    // WalletConnect QR codes must contain the raw wc: URI so any wallet's built-in
    // scanner can parse it. Wallet-specific universal links are only for tap-to-open
    // deep linking on mobile, never for QR content.
    return uri;
  };

  const persistWalletSession = (wallet: WalletOption, account: string | null, chainId: number = 1, status: "pending" | "connected" = "connected") => {
    localStorage.setItem(
      "genesis_wallet_session",
      JSON.stringify({
        wallet: wallet.name,
        account: account ?? null,
        chainId,
        status,
        connectedAt: Date.now(),
      })
    );
  };

  const continueToExplorer = (wallet: WalletOption, account: string | null, chainId: number = 1) => {
    const returnTo = new URLSearchParams(window.location.search).get("returnTo");
    if (returnTo === "/pro") {
      router.push("/pro");
      return;
    }
    const connectedAccount = account ?? "";
    const target = `/connected?wallet=${encodeURIComponent(wallet.name)}&account=${encodeURIComponent(connectedAccount)}&chainId=${encodeURIComponent(chainId)}`;
    router.push(target);
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get("change") === "1") {
      // User explicitly asked to switch/reconnect: clear any stale session so this
      // page doesn't immediately bounce back to the explorer.
      localStorage.removeItem("genesis_wallet_session");
      return;
    }
    const stored = localStorage.getItem("genesis_wallet_session");
    const parsedStored = stored ? JSON.parse(stored) : null;
    if (parsedStored?.status === "connected" && parsedStored.account) {
      if (params.get("returnTo") === "/pro") {
        router.replace("/pro");
        return;
      }
      const walletName = parsedStored.wallet || "WalletConnect";
      const target = `/connected?wallet=${encodeURIComponent(walletName)}&account=${encodeURIComponent(parsedStored.account)}&chainId=${encodeURIComponent(parsedStored.chainId ?? 1)}`;
      router.replace(target);
    }
  }, [router]);

  const finalizeWalletConnection = (wallet: WalletOption, account: string | null, chainId: number = 1) => {
    if (hasFinalizedRef.current) {
      return;
    }
    hasFinalizedRef.current = true;
    persistWalletSession(wallet, account, chainId, "connected");
    setIsConnecting(false);
    setConnectionState((prev) => ({
      ...prev,
      connectionApproved: true,
      error: null,
    }));

    window.setTimeout(() => {
      continueToExplorer(wallet, account, chainId);
    }, 1000);
  };

  const handleDisconnect = async () => {
    try {
      if (provider?.session) {
        await provider.disconnect();
      }
    } catch {
      // Ignore disconnect errors; we still clear local state below.
    }
    hasFinalizedRef.current = false;
    localStorage.removeItem("genesis_wallet_session");
    setSelectedWallet(null);
    setIsConnecting(false);
    setConnectionState((prev) => ({ ...prev, uri: null, connectionApproved: false, error: null }));
  };

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
    let cleanup = () => {};

    const initWalletConnect = async () => {
      try {
        const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
        if (!projectId) {
          setConnectionState({
            uri: null,
            connectionApproved: false,
            error: "WalletConnect is not configured. Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID.",
            isInitialized: false,
          });
          return;
        }

        const { EthereumProvider } = await import("@walletconnect/ethereum-provider");

        const ethereumProvider = await EthereumProvider.init({
          projectId,
          // Require only Ethereum; the rest are optional so wallets that don't
          // support every chain still accept the session proposal.
          chains: [1],
          optionalChains: [137, 42161, 10, 43114],
          showQrModal: false,
          methods: REQUIRED_METHODS,
          optionalMethods: OPTIONAL_METHODS,
          events: ["chainChanged", "accountsChanged"],
          metadata: {
            name: "GENESIS Firewall",
            description: "Community-powered transaction security firewall",
            url: typeof window !== "undefined" ? window.location.origin : "https://sadhutech.com",
            icons: ["https://sadhutech.com/images/genesis-icon.png"],
          },
        });

        setProvider(ethereumProvider);

        // Tear down any lingering relay session when the user explicitly disconnected.
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          if (params.get("disconnect") === "1" && ethereumProvider.session) {
            try {
              await ethereumProvider.disconnect();
            } catch {
              // ignore; local session is already cleared
            }
          }
        }

        const handleConnect = () => {
          const account = getProviderAccount(ethereumProvider);
          const chainId = getProviderChainId(ethereumProvider);
          const wallet = selectedWalletRef.current ?? { id: "walletconnect", name: "WalletConnect", icon: "link", chain: "EVM" };
          if (account) {
            finalizeWalletConnection(wallet, account, chainId);
          } else {
            setConnectionState((prev) => ({ ...prev, connectionApproved: true, error: null }));
          }
        };

        const handleDisconnectEvent = () => {
          hasFinalizedRef.current = false;
          setIsConnecting(false);
          setConnectionState((prev) => ({ ...prev, uri: null, connectionApproved: false }));
        };

        const handleUri = (uri: string) => {
          setConnectionState((prev) => ({ ...prev, uri }));
        };

        const handleChainChanged = () => {
          const stored = localStorage.getItem("genesis_wallet_session");
          if (!stored) return;
          try {
            const parsed = JSON.parse(stored);
            parsed.chainId = getProviderChainId(ethereumProvider);
            localStorage.setItem("genesis_wallet_session", JSON.stringify(parsed));
          } catch {
            // ignore malformed session
          }
        };

        ethereumProvider.on("connect", handleConnect);
        ethereumProvider.on("disconnect", handleDisconnectEvent);
        ethereumProvider.on("display_uri", handleUri);
        ethereumProvider.on("chainChanged", handleChainChanged);

        cleanup = () => {
          ethereumProvider.removeListener("connect", handleConnect);
          ethereumProvider.removeListener("disconnect", handleDisconnectEvent);
          ethereumProvider.removeListener("display_uri", handleUri);
          ethereumProvider.removeListener("chainChanged", handleChainChanged);
        };

        setConnectionState((prev) => ({ ...prev, isInitialized: true, error: null }));
      } catch (error) {
        setConnectionState({
          uri: null,
          connectionApproved: false,
          error: error instanceof Error ? error.message : "Failed to initialize WalletConnect",
          isInitialized: false,
        });
      }
    };

    initWalletConnect();

    return () => cleanup();
  }, []);

  const handleWalletSelect = async (wallet: WalletOption) => {
    if (!provider || !connectionState.isInitialized) {
      setConnectionState((prev) => ({ ...prev, error: "WalletConnect is still initializing. Try again in a moment." }));
      return;
    }

    hasFinalizedRef.current = false;
    setSelectedWallet(wallet);
    setIsConnecting(true);
    setConnectionState((prev) => ({ ...prev, uri: null, connectionApproved: false, error: null }));
    persistWalletSession(wallet, null, 1, "pending");

    try {
      // Reuse an existing live session instead of proposing a new one.
      if (provider.session && getProviderAccount(provider)) {
        finalizeWalletConnection(wallet, getProviderAccount(provider), getProviderChainId(provider));
        return;
      }

      const accounts = await provider.enable();
      const connectedAccount = (Array.isArray(accounts) ? accounts[0] : null) ?? getProviderAccount(provider);
      const chainId = getProviderChainId(provider);

      if (connectedAccount) {
        finalizeWalletConnection(wallet, connectedAccount, chainId);
        return;
      }

      setIsConnecting(false);
      setConnectionState((prev) => ({
        ...prev,
        error: "Wallet connected but shared no account. Please reconnect and approve account access.",
      }));
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Connection failed";
      setConnectionState((prev) => ({ ...prev, error: msg }));
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    if (!isMobile || !selectedWallet || !connectionState.uri || connectionState.connectionApproved || isConnecting) {
      return;
    }

    window.location.href = getWalletLaunchUrl(selectedWallet, connectionState.uri);
  }, [isMobile, selectedWallet, connectionState.uri, connectionState.connectionApproved, isConnecting]);

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-5xl md:text-6xl font-black text-white">Connect your wallet</h1>
        <p className="text-xl text-teal-200 max-w-2xl mx-auto">
          {isMobile
            ? "Choose WalletConnect, pick your wallet, approve the session, then return to the browser to check the transaction." 
            : "Choose WalletConnect, pick your wallet, approve the session, then return to the browser to check the transaction."}
        </p>
      </div>

      <section className="bg-gradient-to-br from-slate-900 to-indigo-950 border-2 border-indigo-500/30 rounded-2xl p-6 max-w-4xl mx-auto space-y-4">
        <h2 className="text-2xl font-bold text-white">How the real flow works</h2>
        <div className="grid md:grid-cols-3 gap-3 text-sm text-slate-200">
          <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-4">
            <div className="text-xs uppercase tracking-wide text-teal-300 font-semibold mb-2">Step 1</div>
            <p className="font-bold text-white">Connect wallet</p>
            <p className="mt-1 text-slate-300">Establish the wallet session.</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-4">
            <div className="text-xs uppercase tracking-wide text-teal-300 font-semibold mb-2">Step 2</div>
            <p className="font-bold text-white">Review transaction</p>
            <p className="mt-1 text-slate-300">Prepare the tx you want to sign.</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-4">
            <div className="text-xs uppercase tracking-wide text-teal-300 font-semibold mb-2">Step 3</div>
            <p className="font-bold text-white">GENESIS checks it</p>
            <p className="mt-1 text-slate-300">Allow, warn, or block before signing.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">

          <a href="/snap-install" className="px-4 py-2 rounded-lg bg-slate-800 text-slate-100 border border-slate-600 hover:border-teal-400 transition text-sm font-semibold">
            MetaMask Snap →
          </a>
          <a href="/transaction-check" className="px-4 py-2 rounded-lg bg-slate-800 text-slate-100 border border-slate-600 hover:border-teal-400 transition text-sm font-semibold">
            Transaction Check →
          </a>
        </div>
      </section>

      <div className={`grid ${isMobile ? "grid-cols-1" : "md:grid-cols-2"} gap-8 max-w-5xl mx-auto`}>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white mb-4">Available Wallets</h2>
          <div className="mb-3 rounded-xl border border-teal-500/30 bg-teal-500/10 p-4 text-sm text-slate-100">
            <p className="font-semibold text-white">WalletConnect path</p>
            <p>Select your wallet below, approve the connection, and return to the browser to continue with transaction verification.</p>
          </div>
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
                <div className="flex justify-center text-teal-400"><Icon name={wallet.iconName} className="w-8 h-8" /></div>
                <div className="text-sm font-bold text-white">{wallet.name}</div>
                <div className="text-xs text-teal-300">{wallet.chain}</div>
              </button>
            ))}
          </div>
          <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4 mt-4 space-y-2">
            <p className="text-sm font-semibold text-blue-200">How it works:</p>
            <ol className="text-xs text-blue-100 space-y-1">
              {isMobile ? (
                <>
                  <li>1. Tap your wallet above</li>
                  <li>2. Tap Open in {selectedWallet?.name ?? "your wallet"} to launch the wallet</li>
                  <li>3. Approve the connection in the wallet</li>
                  <li>4. Return to this browser tab and continue to the transaction check</li>
                </>
              ) : (
                <>
                  <li>1. Tap a wallet or scan QR</li>
                  <li>2. {selectedWallet ? "Scan QR with your phone" : "Select a wallet to see options"}</li>
                  <li>3. Approve the connection in the wallet</li>
                  <li>4. Return here and continue to the transaction check</li>
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
                <div className="text-teal-400"><Icon name="wallet" className="w-16 h-16 mx-auto" /></div>
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
                      <QRCodeCanvas value={getQrValue(selectedWallet, connectionState.uri) || ""} size={200} level="H" includeMargin={true} />
                      <p className="text-slate-700 text-sm font-medium">Scan to open {selectedWallet.name}</p>
                      <p className="text-xs text-slate-500">{connectionState.connectionApproved ? "Connection approved." : "Waiting for approval..."}</p>
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
                  <div className="text-teal-400"><Icon name={selectedWallet.iconName} className="w-10 h-10" /></div>
                  <div>
                    <p className="font-bold text-white">{selectedWallet.name}</p>
                    <p className="text-xs text-teal-300">{selectedWallet.chain} • Connected via WalletConnect</p>
                  </div>
                </div>
                {isConnecting && !connectionState.connectionApproved && (
                  <p className="text-xs text-teal-200">Waiting for wallet approval... Return to this browser tab after approving the connection in {selectedWallet.name}.</p>
                )}
                {connectionState.connectionApproved && (
                    <div className="space-y-3">
                      <p className="text-xs text-teal-200">Wallet connected. Your next step is to check a real transaction before signing.</p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const saved = localStorage.getItem("genesis_wallet_session");
                            const parsed = saved ? JSON.parse(saved) : null;
                            continueToExplorer(selectedWallet, parsed?.account ?? null, parsed?.chainId ?? 1);
                          }}
                          className="flex-1 text-center px-4 py-2 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-500 transition"
                        >
                          Continue →
                        </button>
                        <button
                          type="button"
                          onClick={handleDisconnect}
                          className="px-4 py-2 rounded-lg border border-slate-500 bg-slate-800 text-slate-100 font-semibold hover:bg-slate-700 transition"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
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
            <div className="bg-green-900/40 border border-green-500/50 rounded-lg p-4 text-center space-y-3">
              <p className="text-green-200 font-semibold">Connection Approved.</p>
              <p className="text-xs text-green-300">Wallet connected. Check a real transaction before signing next.</p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const saved = localStorage.getItem("genesis_wallet_session");
                    const parsed = saved ? JSON.parse(saved) : null;
                    continueToExplorer(selectedWallet, parsed?.account ?? null, parsed?.chainId ?? 1);
                  }}
                  className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-semibold transition"
                >
                  Continue →
                </button>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold transition"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4 space-y-3">
                <p className="text-sm text-slate-200">
                  {supportsWalletDeepLink(selectedWallet)
                    ? `Tap the button below to open ${selectedWallet.name} directly.`
                    : `Tap the button below to open ${selectedWallet.name} and approve the connection.`}
                </p>
                <button
                  onClick={() => {
                    if (connectionState.uri) {
                      persistWalletSession(selectedWallet, null, 1, "pending");
                      window.location.href = getWalletLaunchUrl(selectedWallet, connectionState.uri);
                    }
                  }}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition"
                >
                  {supportsWalletDeepLink(selectedWallet) ? `Open in ${selectedWallet.name}` : `Open ${selectedWallet.name}`}
                </button>
                <p className="text-xs text-slate-300 text-center">After approving the connection in the wallet, return to this browser tab and continue to the transaction check.</p>
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
        <h3 className="text-xl font-bold text-white">Supported Networks</h3>
        <div className="grid md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2"><Icon name="link" className="w-5 h-5 text-teal-400" /><p className="text-sm text-slate-200">Ethereum</p></div>
          <div className="flex items-center gap-2"><Icon name="network" className="w-5 h-5 text-violet-400" /><p className="text-sm text-slate-200">Polygon</p></div>
          <div className="flex items-center gap-2"><Icon name="chart" className="w-5 h-5 text-blue-400" /><p className="text-sm text-slate-200">Arbitrum</p></div>
          <div className="flex items-center gap-2"><Icon name="warning" className="w-5 h-5 text-red-400" /><p className="text-sm text-slate-200">Optimism</p></div>
        </div>
        <p className="text-xs text-slate-400">+ 10+ more EVM chains supported</p>
      </section>

      <section className="bg-gradient-to-br from-green-900/30 to-slate-900 border-2 border-green-500/40 rounded-xl p-8 max-w-3xl mx-auto space-y-3">
        <h3 className="text-xl font-bold text-white">Connection Security</h3>
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
