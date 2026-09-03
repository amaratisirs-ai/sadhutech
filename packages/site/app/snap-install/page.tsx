"use client";

import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any }) => Promise<any>;
      isMetaMask?: boolean;
    };
  }
}

type Platform = "desktop" | "mobile";
type State = "detecting" | "ready" | "installing" | "done" | "error";

export default function SnapInstallPage() {
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [state, setState] = useState<State>("detecting");
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent;
    const isMobile = /iPhone|iPad|Android/i.test(userAgent);
    setPlatform(isMobile ? "mobile" : "desktop");

    // Detect MetaMask availability
    const checkMetaMask = () => {
      if (typeof window !== "undefined" && window.ethereum?.isMetaMask) {
        setHasMetaMask(true);
        setState("ready");
      } else {
        setHasMetaMask(false);
        setState("ready");
      }
    };

    // Check immediately and on a slight delay for slower injections
    checkMetaMask();
    const timer = setTimeout(checkMetaMask, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleInstallClick = async () => {
    if (!window.ethereum?.isMetaMask) {
      setState("error");
      setErrorMsg("MetaMask not detected. Please install MetaMask extension first.");
      return;
    }

    setState("installing");
    try {
      const snapId = "npm:genesis-snap";
      await window.ethereum.request({
        method: "wallet_requestSnaps",
        params: {
          [snapId]: {},
        },
      });
      setState("done");
    } catch (err) {
      setState("error");
      setErrorMsg(
        err instanceof Error && err.message.includes("User rejected")
          ? "You cancelled the installation. Try again if you change your mind."
          : err instanceof Error
            ? err.message
            : "Installation failed. Please try again."
      );
    }
  };

  // ============================================================
  // DESKTOP FLOW
  // ============================================================
  if (platform === "desktop") {
    return (
      <div className="space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-black text-white">🔐 Get GENESIS Protection</h1>
          <p className="text-lg text-teal-200 max-w-2xl mx-auto">
            Install the MetaMask Snap to instantly check every transaction against our threat intelligence network before you sign.
          </p>
        </div>

        {/* Main Two-Column Layout */}
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Left: Benefits */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Why GENESIS?</h2>
            <div className="space-y-4">
              {[
                { icon: "⚡", title: "Instant Analysis", desc: "<200ms transaction analysis" },
                { icon: "🛡️", title: "Community Powered", desc: "4,122+ verified threats in database" },
                { icon: "📊", title: "Clear Verdicts", desc: "ALLOW, WARN, or BLOCK in plain English" },
                { icon: "🔄", title: "Always Updated", desc: "New threats added hourly" },
                { icon: "100", title: "100% Private", desc: "Runs locally, zero data tracking" },
                { icon: "✅", title: "Non-Custodial", desc: "Your keys, your control, always" },
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-2xl flex-shrink-0">{item.icon}</span>
                  <div>
                    <h3 className="font-bold text-white">{item.title}</h3>
                    <p className="text-sm text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Installation CTA */}
          <div className="space-y-6">
            {/* State: Detecting MetaMask */}
            {state === "detecting" && (
              <div className="bg-gradient-to-br from-slate-500/10 to-indigo-500/10 border-2 border-slate-400/30 rounded-2xl p-8 space-y-6 text-center">
                <div className="animate-pulse">
                  <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-indigo-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Checking for MetaMask...</h3>
                  <p className="text-slate-400 text-sm mt-2">Please wait a moment</p>
                </div>
              </div>
            )}

            {/* State: MetaMask Ready */}
            {state === "ready" && hasMetaMask && (
              <div className="bg-gradient-to-br from-teal-500/10 to-indigo-500/10 border-2 border-teal-500/30 rounded-2xl p-8 space-y-6">
                <div className="text-center space-y-2">
                  <div className="text-6xl">🦊</div>
                  <h3 className="text-xl font-bold text-white">Ready to Install</h3>
                  <p className="text-sm text-teal-300">MetaMask detected ✓</p>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex gap-2 items-start">
                    <span className="text-green-400 font-bold">✓</span>
                    <div>
                      <p className="font-semibold text-white">Works with MetaMask</p>
                      <p className="text-xs text-slate-400">Any version supporting Snaps</p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-start">
                    <span className="text-green-400 font-bold">✓</span>
                    <div>
                      <p className="font-semibold text-white">Non-custodial</p>
                      <p className="text-xs text-slate-400">Your keys, your control</p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-start">
                    <span className="text-green-400 font-bold">✓</span>
                    <div>
                      <p className="font-semibold text-white">Open Source</p>
                      <p className="text-xs text-slate-400">View on GitHub anytime</p>
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
                  You'll be prompted to approve in MetaMask
                </p>
              </div>
            )}

            {/* State: Installing */}
            {state === "installing" && (
              <div className="bg-gradient-to-br from-indigo-500/10 to-teal-500/10 border-2 border-indigo-500/30 rounded-2xl p-8 space-y-6 text-center">
                <div className="inline-block">
                  <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto animate-spin">
                    <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Installing GENESIS...</h3>
                  <p className="text-slate-400">Look at your MetaMask popup to approve</p>
                </div>
              </div>
            )}

            {/* State: Done */}
            {state === "done" && (
              <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 border-2 border-green-500/30 rounded-2xl p-8 space-y-6">
                <div className="text-center space-y-3">
                  <div className="text-6xl">✅</div>
                  <h3 className="text-2xl font-bold text-white">All Set!</h3>
                  <p className="text-slate-400">GENESIS is now protecting your transactions</p>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4 space-y-2 text-sm">
                  <p className="text-white font-semibold">What's next:</p>
                  <ol className="space-y-2 text-slate-300">
                    <li>1. Try any transaction in any app (Uniswap, OpenSea, etc.)</li>
                    <li>2. MetaMask will show GENESIS's analysis before you sign</li>
                    <li>3. Get a clear verdict: ALLOW, WARN, or BLOCK</li>
                  </ol>
                </div>

                <div className="flex gap-3">
                  <a
                    href="/after-install"
                    className="flex-1 px-6 py-3 bg-teal-500 text-slate-950 font-bold rounded-xl hover:bg-teal-400 transition-all text-center"
                  >
                    What's Next? →
                  </a>
                  <a
                    href="/"
                    className="flex-1 px-6 py-3 border-2 border-teal-500/30 text-teal-300 font-semibold rounded-xl hover:bg-teal-500/10 transition-all text-center"
                  >
                    Back Home
                  </a>
                </div>
              </div>
            )}

            {/* State: MetaMask Not Installed */}
            {state === "ready" && !hasMetaMask && (
              <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-2 border-orange-500/30 rounded-2xl p-8 space-y-6">
                <div className="text-center space-y-2">
                  <div className="text-5xl">🦊</div>
                  <h3 className="text-xl font-bold text-white">MetaMask Not Found</h3>
                  <p className="text-sm text-orange-300">Install the extension first</p>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
                  <p className="text-white font-semibold">3 Easy Steps:</p>
                  <ol className="space-y-2 text-sm text-slate-300">
                    <li className="flex gap-2">
                      <span className="font-bold text-orange-400 flex-shrink-0">1️⃣</span>
                      <span>
                        Visit{" "}
                        <a
                          href="https://metamask.io"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-300 hover:text-teal-200 underline"
                        >
                          metamask.io
                        </a>
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-orange-400 flex-shrink-0">2️⃣</span>
                      <span>Click "Get Chrome Extension" (or your browser)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-orange-400 flex-shrink-0">3️⃣</span>
                      <span>Come back to this page and refresh</span>
                    </li>
                  </ol>
                </div>

                <a
                  href="https://metamask.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all text-center"
                >
                  Download MetaMask →
                </a>

                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-6 py-2 border-2 border-slate-600 text-slate-300 font-semibold rounded-xl hover:bg-slate-800/50 transition-all"
                >
                  ↻ Refresh This Page
                </button>
              </div>
            )}

            {/* State: Error */}
            {state === "error" && (
              <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-2 border-red-500/30 rounded-2xl p-8 space-y-6">
                <div className="text-center space-y-2">
                  <div className="text-5xl">❌</div>
                  <h3 className="text-xl font-bold text-white">Installation Failed</h3>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4">
                  <p className="text-red-300 text-sm">{errorMsg}</p>
                </div>

                <button
                  onClick={() => {
                    setState("ready");
                    setErrorMsg(null);
                  }}
                  className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* QR Code for Mobile */}
            <div className="border-t border-slate-700 pt-6">
              <button
                onClick={() => setShowQR(!showQR)}
                className="w-full px-4 py-2 text-sm text-teal-300 hover:text-teal-200 font-semibold flex items-center justify-center gap-2"
              >
                {showQR ? "✕ Hide" : "📱 Install on Mobile?"} QR Code
              </button>
              {showQR && (
                <div className="mt-4 p-4 bg-slate-900/50 rounded-lg flex flex-col items-center gap-3">
                  <p className="text-xs text-slate-400">Scan with your phone camera</p>
                  <div className="bg-white p-3 rounded-lg">
                    <QRCodeCanvas
                      value={typeof window !== "undefined" ? window.location.href : "https://sadhutech-site.vercel.app/snap-install"}
                      size={160}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <p className="text-xs text-slate-400">Opens this page on your mobile</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-slate-900/50 rounded-2xl border border-teal-500/20 p-12">
          <h2 className="text-2xl font-bold text-white text-center mb-12">How Protection Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: "1", emoji: "📝", title: "You Sign", desc: "You're about to sign a transaction" },
              { num: "2", emoji: "🔍", title: "We Analyze", desc: "Checked against threat intelligence in <200ms" },
              { num: "3", emoji: "📊", title: "We Score", desc: "Risk computed from community intel" },
              { num: "4", emoji: "✅", title: "You Decide", desc: "Clear verdict before you confirm" },
            ].map((step) => (
              <div key={step.num} className="text-center space-y-3">
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

        {/* Permissions Section */}
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
                  <p>
                    <strong>GENESIS sees:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Which address you're sending to</li>
                    <li>What function you're calling</li>
                    <li>Transaction amount</li>
                  </ul>
                  <p className="mt-3 pt-3 border-t border-slate-700">
                    <strong>GENESIS does NOT see:</strong>
                  </p>
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
                  <p>
                    <strong>Network access allows:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Download threat database (community-verified threats)</li>
                    <li>Check latest community reports</li>
                    <li>Send threat analysis (no personal data)</li>
                  </ul>
                  <p className="mt-3 pt-3 border-t border-slate-700">
                    <strong>We never collect:</strong>
                  </p>
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
      </div>
    );
  }

  // ============================================================
  // MOBILE FLOW
  // ============================================================
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-black text-white">🔐 GENESIS Protection</h1>
        <p className="text-sm text-teal-200">Install the MetaMask Snap for transaction safety</p>
      </div>

      {/* Mobile Instructions - Always Visible */}
      <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-2 border-orange-500 rounded-lg p-5 space-y-4">
        <div className="flex gap-3 items-start">
          <span className="text-3xl">📱</span>
          <div className="flex-1">
            <h2 className="font-bold text-white text-lg">Open in MetaMask App</h2>
            <p className="text-xs text-orange-100 mt-1">MetaMask Snaps only work in the app's browser</p>

            <div className="bg-slate-900/60 rounded-lg p-4 mt-3 space-y-3">
              <div className="flex gap-3 text-xs">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-slate-900 font-bold flex items-center justify-center text-xs">
                  1
                </div>
                <div className="text-orange-100">
                  Open the <strong>MetaMask mobile app</strong>
                </div>
              </div>
              <div className="flex gap-3 text-xs">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-slate-900 font-bold flex items-center justify-center text-xs">
                  2
                </div>
                <div className="text-orange-100">
                  Tap menu <strong>(≡)</strong> at <strong>bottom right</strong>
                </div>
              </div>
              <div className="flex gap-3 text-xs">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-slate-900 font-bold flex items-center justify-center text-xs">
                  3
                </div>
                <div className="text-orange-100">
                  Select <strong>'Browser'</strong>
                </div>
              </div>
              <div className="flex gap-3 text-xs">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-slate-900 font-bold flex items-center justify-center text-xs">
                  4
                </div>
                <div className="text-orange-100">
                  Paste URL: <code className="bg-slate-800 px-1 py-0.5 rounded text-orange-300 text-xs font-mono block mt-1">sadhutech-site.vercel.app</code>
                </div>
              </div>
              <div className="flex gap-3 text-xs">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-slate-900 font-bold flex items-center justify-center text-xs">
                  5
                </div>
                <div className="text-orange-100">
                  Refresh & tap <strong>'Install GENESIS Snap'</strong>
                </div>
              </div>
            </div>

            <div className="mt-3 p-3 bg-slate-800/50 rounded text-xs text-orange-200 border border-orange-500/30">
              <strong>💡 Tip:</strong> After opening in MetaMask Browser, the install button will work because MetaMask injects ethereum object.
            </div>
          </div>
        </div>
      </div>

      {/* Install Button - Shows when in MetaMask app */}
      {hasMetaMask && (
        <div className="bg-gradient-to-br from-teal-500/10 to-indigo-500/10 border-2 border-teal-500/30 rounded-lg p-6 space-y-4">
          {state === "ready" && (
            <>
              <div className="text-center">
                <p className="text-sm text-green-300 font-semibold mb-3">✓ MetaMask Browser Detected</p>
                <button
                  onClick={handleInstallClick}
                  className="w-full px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-400 text-slate-950 font-bold rounded-lg hover:shadow-lg transition-all text-base"
                >
                  + Install GENESIS Snap
                </button>
              </div>
            </>
          )}

          {state === "installing" && (
            <div className="text-center space-y-3">
              <div className="inline-block">
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center animate-spin">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-white font-semibold">Installing...</p>
              <p className="text-xs text-slate-400">Check MetaMask for approval prompt</p>
            </div>
          )}

          {state === "done" && (
            <div className="text-center space-y-3">
              <div className="text-4xl">✅</div>
              <h3 className="font-bold text-white">Installation Complete!</h3>
              <p className="text-xs text-slate-400">GENESIS is now protecting your transactions</p>
              <a href="/after-install" className="block mt-3 px-4 py-2 bg-teal-500 text-slate-950 font-bold rounded-lg text-center text-sm">
                What's Next?
              </a>
            </div>
          )}

          {state === "error" && (
            <div className="text-center space-y-3">
              <div className="text-3xl">❌</div>
              <p className="text-red-300 text-sm">{errorMsg}</p>
              <button
                onClick={() => {
                  setState("ready");
                  setErrorMsg(null);
                }}
                className="w-full px-4 py-2 bg-red-600 text-white font-bold rounded-lg text-sm"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Don't Have MetaMask */}
      {!hasMetaMask && (
        <div className="bg-red-500/10 border-2 border-red-500/30 rounded-lg p-5">
          <p className="text-sm text-red-300 mb-3">Don't have MetaMask? Get it free:</p>
          <a
            href="https://metamask.io"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-center text-sm"
          >
            Download MetaMask App
          </a>
        </div>
      )}

      {/* Why GENESIS - Quick Card */}
      <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
        <h3 className="font-bold text-white text-sm">Why GENESIS?</h3>
        <div className="space-y-2 text-xs text-slate-300">
          <div className="flex gap-2">
            <span>⚡</span>
            <span>Instant analysis in milliseconds</span>
          </div>
          <div className="flex gap-2">
            <span>🛡️</span>
            <span>Community-powered threat detection</span>
          </div>
          <div className="flex gap-2">
            <span>📊</span>
            <span>Clear verdict: ALLOW, WARN, BLOCK</span>
          </div>
          <div className="flex gap-2">
            <span>✅</span>
            <span>100% private, runs locally on your device</span>
          </div>
        </div>
      </div>
    </div>
  );
}
