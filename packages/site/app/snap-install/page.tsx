"use client";

import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { SNAP_CONFIG } from "@/config/snap-config";
import { Icon } from "@/components/Icon";
import { Genesis } from "@/components/Genesis";

declare global {
  interface Window {
    ethereum?: Record<string, unknown>;
  }
}

type MetaMaskEthereum = {
  request: (args: { method: string; params?: any }) => Promise<any>;
  isMetaMask?: boolean;
};

function getMetaMask(): MetaMaskEthereum | undefined {
  return typeof window !== "undefined" ? (window.ethereum as MetaMaskEthereum | undefined) : undefined;
}

type Platform = "desktop" | "mobile";
type State = "detecting" | "ready" | "installing" | "done" | "error";

const GATE_URL = process.env.NEXT_PUBLIC_GATE_URL || "https://genesis-gate.onrender.com";
const CONSENT_VERSION = "2026-09";

export default function SnapInstallPage() {
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [state, setState] = useState<State>("detecting");
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [permissionsDetailsOpen, setPermissionsDetailsOpen] = useState(false);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const copyInstallLink = async () => {
    try {
      await navigator.clipboard.writeText("https://sadhutech.com/snap-install");
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // clipboard access denied - the URL is already shown as plain text
    }
  };

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent;
    const isMobile = /iPhone|iPad|Android/i.test(userAgent);
    setPlatform(isMobile ? "mobile" : "desktop");

    // Detect MetaMask availability
    const checkMetaMask = () => {
      if (typeof window !== "undefined" && getMetaMask()?.isMetaMask) {
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
    if (!agreedToTerms) return;
    if (!getMetaMask()?.isMetaMask) {
      setState("error");
      setErrorMsg("MetaMask not detected. Please install MetaMask extension first.");
      return;
    }

    // Best-effort consent record — never blocks install if it fails or the wallet isn't unlocked yet.
    try {
      const accounts = (await getMetaMask()!.request({ method: "eth_accounts" })) as string[] | undefined;
      fetch(`${GATE_URL}/v1/consent`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          address: accounts?.[0],
          type: "snap-install",
          version: CONSENT_VERSION,
          context: "snap-install-page",
        }),
      }).catch(() => {});
    } catch {
      // no accounts available yet — still record the acceptance itself, just without an address.
      fetch(`${GATE_URL}/v1/consent`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "snap-install", version: CONSENT_VERSION, context: "snap-install-page" }),
      }).catch(() => {});
    }

    setState("installing");
    try {
      // Use environment-configurable snap ID
      // NEXT_PUBLIC_USE_REGISTRY_SNAP=true → uses npm:genesis-snap (production after registry approval)
      // NEXT_PUBLIC_USE_REGISTRY_SNAP=false/unset → uses direct bundle URL (testing)
      const snapId = typeof window !== "undefined"
        ? SNAP_CONFIG.getSnapId(window.location.origin)
        : SNAP_CONFIG.bundleUrl();
      
      await getMetaMask()!.request({
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
          <h1 className="text-5xl font-black text-white flex items-center justify-center gap-3"><Icon name="lock" className="w-12 h-12 text-teal-400" /> Get <Genesis /> Protection in MetaMask</h1>
        </div>

        {/* Main Two-Column Layout */}
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Left: Benefits */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Why <Genesis />?</h2>
            <div className="space-y-4">
              {[
                { icon: <Icon name="bolt" className="w-6 h-6" />, title: "Instant Analysis", desc: "<200ms transaction analysis" },
                { icon: <Icon name="shield" className="w-6 h-6" />, title: "Community Powered", desc: "4k+ verified threats and growing" },
                { icon: <Icon name="chart" className="w-6 h-6" />, title: "Clear Verdicts", desc: "ALLOW, WARN, or BLOCK" },
                { icon: <Icon name="refresh" className="w-6 h-6" />, title: "Always Updated", desc: "New threats added hourly" },
                { icon: <Icon name="lock" className="w-6 h-6" />, title: "100% Private", desc: "Runs locally, zero data tracking" },
                { icon: <Icon name="checkCircle" className="w-6 h-6" />, title: "Non-Custodial", desc: "Your keys, your control, always" },
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-teal-500 flex-shrink-0">{item.icon}</span>
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
                  <div className="flex justify-center text-teal-400"><Icon name="shield" className="w-16 h-16" /></div>
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

                <label className="flex items-start gap-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 accent-teal-400"
                  />
                  <span>
                    I have read and agree to the{" "}
                    <a href="/terms" target="_blank" className="text-teal-300 underline">Terms of Service</a> and{" "}
                    <a href="/privacy" target="_blank" className="text-teal-300 underline">Privacy Policy</a>.
                  </span>
                </label>

                <button
                  onClick={handleInstallClick}
                  disabled={!agreedToTerms}
                  className="w-full px-6 py-4 bg-gradient-to-r from-teal-500 to-teal-400 text-slate-950 font-bold rounded-xl hover:shadow-xl hover:shadow-teal-500/50 transition-all text-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                  + Install <Genesis /> Snap
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
                  <h3 className="text-xl font-bold text-white">Installing <Genesis />...</h3>
                  <p className="text-slate-400">Look at your MetaMask popup to approve</p>
                </div>
              </div>
            )}

            {/* State: Done */}
            {state === "done" && (
              <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 border-2 border-green-500/30 rounded-2xl p-8 space-y-6">
                <div className="text-center space-y-3">
                  <div className="flex justify-center text-green-400"><Icon name="checkCircle" className="w-16 h-16" /></div>
                  <h3 className="text-2xl font-bold text-white">All Set!</h3>
                  <p className="text-slate-400"><Genesis /> is now protecting your transactions</p>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4 space-y-2 text-sm">
                  <p className="text-white font-semibold">What's next:</p>
                  <ol className="space-y-2 text-slate-300">
                    <li>1. Try any transaction in any app (Uniswap, OpenSea, etc.)</li>
                    <li>2. MetaMask will show <Genesis />'s analysis before you sign</li>
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
              <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-2 border-orange-500/30 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Icon name="warning" className="w-8 h-8 text-orange-400 shrink-0" />
                  <h3 className="text-base font-bold text-white">MetaMask Extension Required</h3>
                </div>

                <p className="text-sm text-slate-300">
                  Snaps only run inside the MetaMask browser extension (Chrome, Firefox, Edge, or Brave) - not the
                  mobile app, and not any other wallet. Install it below, then refresh this page.
                </p>

                <a
                  href="https://metamask.io/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all text-center"
                >
                  Get MetaMask →
                </a>

                <a
                  href="/check"
                  className="block w-full px-6 py-3 bg-teal-500 text-slate-950 font-bold rounded-xl hover:bg-teal-400 transition-all text-center"
                >
                  Or use GENESIS Check instead (any wallet) →
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
                  <div className="flex justify-center text-red-400"><Icon name="block" className="w-14 h-14" /></div>
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
                {showQR ? "Hide" : "Install on Mobile?"} QR Code
              </button>
              {showQR && (
                <div className="mt-4 p-4 bg-slate-900/50 rounded-lg flex flex-col items-center gap-3">
                  <p className="text-xs text-slate-400">Scan with your phone camera</p>
                  <div className="bg-white p-3 rounded-lg">
                    <QRCodeCanvas
                      value={typeof window !== "undefined" ? window.location.href : "https://sadhutech.com/snap-install"}
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
              { num: "1", icon: "document", title: "You Sign", desc: "You're about to sign a transaction" },
              { num: "2", icon: "search", title: "We Analyze", desc: "Checked against threat intelligence in <200ms" },
              { num: "3", icon: "chart", title: "We Score", desc: "Risk computed from community intel" },
              { num: "4", icon: "checkCircle", title: "You Decide", desc: "Clear verdict before you confirm" },
            ].map((step) => (
              <div key={step.num} className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-teal-500/20 border-2 border-teal-500 flex items-center justify-center mx-auto font-bold text-teal-300">
                  {step.num}
                </div>
                <div className="flex justify-center text-teal-400"><Icon name={step.icon as any} className="w-8 h-8" /></div>
                <h3 className="font-bold text-white">{step.title}</h3>
                <p className="text-sm text-slate-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Permissions Section */}
        <div className="bg-indigo-500/10 border-2 border-indigo-500/30 rounded-2xl p-12">
          <h2 className="text-2xl font-bold text-white mb-6">About Snap Permissions</h2>
          <p className="text-slate-300 mb-4">
            When you install <Genesis />, MetaMask asks for 3 permissions: to see transactions and signature requests
            before you sign them (so it can screen for risk), and network access to fetch the latest threat data. It
            can't access your keys, funds, or personal info — full breakdown below if you want it.
          </p>
          <button
            type="button"
            onClick={() => setPermissionsDetailsOpen((v) => !v)}
            className="text-sm font-semibold text-teal-300 hover:text-teal-200 underline mb-8"
          >
            {permissionsDetailsOpen ? "Hide details" : "Show details"}
          </button>

          {permissionsDetailsOpen && (
          <>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="bg-slate-900/50 rounded-lg p-6 border border-indigo-500/20">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><Icon name="search" className="w-5 h-5 text-teal-400" /> Transaction Insight</h3>
                <p className="text-slate-300 mb-4">
                  This lets <Genesis /> <strong>see transactions before you sign</strong> so it can analyze them for risks.
                </p>
                <div className="bg-slate-800/50 rounded p-3 text-sm text-slate-400 space-y-2">
                  <p>
                    <strong><Genesis /> sees:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Which address you're sending to</li>
                    <li>What function you're calling</li>
                    <li>Transaction amount</li>
                  </ul>
                  <p className="mt-3 pt-3 border-t border-slate-700">
                    <strong><Genesis /> does NOT see:</strong>
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
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><Icon name="shield" className="w-5 h-5 text-teal-400" /> Signature Insight</h3>
                <p className="text-slate-300 mb-4">
                  This lets <Genesis /> <strong>screen signature requests</strong> too — not just transactions. Most modern
                  drainers steal funds through a blind signature (a "permit" or marketplace order) rather than an
                  on-chain transaction, so this closes that gap.
                </p>
                <div className="bg-slate-800/50 rounded p-3 text-sm text-slate-400 space-y-2">
                  <p>
                    <strong><Genesis /> checks:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Gasless "permit" approvals (EIP-2612, Permit2)</li>
                    <li>Marketplace orders (e.g. Seaport/OpenSea)</li>
                    <li>Whether the requesting site is a known phishing domain</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-8">

            <div className="space-y-4">
              <div className="bg-slate-900/50 rounded-lg p-6 border border-indigo-500/20">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><Icon name="globe" className="w-5 h-5 text-teal-400" /> Network Access</h3>
                <p className="text-slate-300 mb-4">
                  This lets <Genesis /> <strong>fetch the latest threat database</strong> from our servers so it has current threat intel.
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
              <strong>Your security:</strong> <Genesis /> runs in MetaMask's sandbox. It can't access your keys, funds, or personal info. Risk analysis is performed by the <Genesis /> gate service over the network (that's what Network Access is for) — nothing is analyzed by a third party beyond that.
            </p>
          </div>

          <div className="mt-6 p-6 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
            <p className="text-slate-300">
              <strong>Optional: deeper checks.</strong> If you've bought deep-check credits at
              <a href="/pro" className="text-teal-300 hover:underline"> sadhutech.com/pro</a>, opening the Snap's home page
              once lets you authorize automatic deeper screening (an extra ChainAbuse lookup) — no repeated prompts
              after that. This is entirely optional and only spends credits you've already purchased.
            </p>
          </div>
          </>
          )}
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
        <h1 className="text-3xl font-black text-white"><Genesis /> Protection</h1>
        <p className="text-sm text-teal-200">MetaMask Snap for MetaMask users. WalletConnect users should use the connect flow instead.</p>
      </div>

      {/* Primary guide - simple, 2 clear options */}
      <div className="bg-gradient-to-r from-indigo-500/20 to-blue-500/20 border-2 border-indigo-500 rounded-lg p-5 space-y-4">
        <div className="flex gap-3 items-start">
          <span className="text-teal-400"><Icon name="monitor" className="w-8 h-8" /></span>
          <div className="flex-1">
            <h2 className="font-bold text-white text-lg">Desktop Required for Snaps</h2>
            <p className="text-xs text-indigo-100 mt-1">Not supported on mobile yet (MetaMask has this on their roadmap, no confirmed date), regardless of which wallet app you have installed - here's what to do instead:</p>
          </div>
        </div>

        <div className="space-y-3">
          <a
            href="/check"
            className="block w-full px-4 py-3 bg-teal-500 text-slate-950 font-bold rounded-lg text-center text-sm"
          >
            Continue on GENESIS Check → (works now, any wallet)
          </a>

          <div className="bg-slate-900/60 rounded-lg p-4 space-y-2">
            <p className="text-xs text-indigo-200">To install the Snap, open this page on a desktop browser with MetaMask:</p>
            <div className="flex items-center gap-2 bg-slate-800 rounded px-3 py-2">
              <code className="text-xs text-teal-300 truncate flex-1">sadhutech.com/snap-install</code>
              <button
                type="button"
                onClick={copyInstallLink}
                className="text-xs font-semibold text-teal-300 hover:text-teal-200 shrink-0"
              >
                {linkCopied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileDetailsOpen((v) => !v)}
          className="text-xs font-semibold text-teal-300 hover:text-teal-200 underline"
        >
          {mobileDetailsOpen ? "Hide details" : "Show details"}
        </button>

        {mobileDetailsOpen && (
          <div className="bg-slate-900/60 rounded-lg p-4 space-y-3">
            <div className="space-y-2 text-xs text-indigo-200">
              <p><strong>What Works:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Desktop browsers: Chrome, Firefox, Safari, Brave</li>
                <li>MetaMask browser extension installed</li>
                <li>Visit this site and click "Install <Genesis /> Snap"</li>
              </ul>
            </div>

            <div className="space-y-2 text-xs text-slate-400 pt-3 border-t border-slate-700">
              <p><strong>Doesn't Work on Mobile:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>MetaMask mobile app (no Snap support yet)</li>
                <li>Safari / Chrome on iPhone or Android</li>
                <li>Any mobile browser</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Why GENESIS - Quick Card */}
      <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
        <h3 className="font-bold text-white text-sm">Why <Genesis />?</h3>
        <div className="space-y-2 text-xs text-slate-300">
          <div className="flex gap-2 items-center"><Icon name="bolt" className="w-4 h-4 text-teal-400" /><span>Instant analysis in milliseconds</span></div>
          <div className="flex gap-2 items-center"><Icon name="shield" className="w-4 h-4 text-teal-400" /><span>Community-powered threat detection</span></div>
          <div className="flex gap-2 items-center"><Icon name="chart" className="w-4 h-4 text-teal-400" /><span>Clear verdict: ALLOW, WARN, BLOCK</span></div>
          <div className="flex gap-2 items-center"><Icon name="checkCircle" className="w-4 h-4 text-teal-400" /><span>100% private, runs locally on your device</span></div>
        </div>
      </div>
    </div>
  );
}
