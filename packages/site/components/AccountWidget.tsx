"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useWallet } from "@/src/wallet/useWallet";

const GATE_URL = process.env.NEXT_PUBLIC_GATE_URL || "https://genesis-gate.onrender.com";
const CONSENT_VERSION = "2026-09";
const CONSENT_ACCEPTED_KEY = "genesis_consent_accepted";

function short(address: string) {
  return `${address.slice(0, 6)}\u2026${address.slice(-4)}`;
}

function postConsent(address: string | undefined, context: string, email?: string) {
  fetch(`${GATE_URL}/v1/consent`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ address, type: "wallet-connect", version: CONSENT_VERSION, context, email: email || undefined }),
  }).catch(() => {
    // Best-effort audit log — never block the connect flow on this.
  });
}

/** Persistent "logged in" pill shown in the nav once a wallet is connected — address + live credit balance. */
export function AccountWidget() {
  const { address, isConnected, connect, disconnect } = useWallet();
  const [credits, setCredits] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isConnected || !address) {
      setCredits(null);
      return;
    }
    let cancelled = false;
    fetch(`${GATE_URL}/v1/pro/status/${address}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (!cancelled) setCredits(typeof s?.credits === "number" ? s.credits : 0);
      })
      .catch(() => {
        if (!cancelled) setCredits(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isConnected, address]);

  // Once an address is known, record a durable, address-tagged consent event —
  // once per address ever, on this browser.
  useEffect(() => {
    if (!isConnected || !address) return;
    const key = `genesis_consent_addr:${address.toLowerCase()}`;
    if (typeof window === "undefined" || window.localStorage.getItem(key)) return;
    window.localStorage.setItem(key, "1");
    postConsent(address, "account-widget-connected", emailInput);
  }, [isConnected, address, emailInput]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleConnectClick = () => {
    if (typeof window !== "undefined" && window.localStorage.getItem(CONSENT_ACCEPTED_KEY)) {
      connect();
      return;
    }
    setShowConsent(true);
  };

  const handleAgreeAndConnect = () => {
    window.localStorage.setItem(CONSENT_ACCEPTED_KEY, "1");
    postConsent(undefined, "account-widget-pre-connect", emailInput);
    setShowConsent(false);
    connect();
  };

  const handleCopyAddress = () => {
    if (!address || typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {
      // clipboard access denied/unavailable — no-op, address is still visible
    });
  };

  if (!isConnected || !address) {
    return (
      <>
        <button
          type="button"
          onClick={handleConnectClick}
          className="inline-flex items-center px-2.5 sm:px-3 py-1.5 text-xs font-bold text-teal-200 border border-teal-500/50 hover:border-teal-400 hover:text-white rounded-full transition-all"
        >
          Connect
        </button>
        {showConsent && typeof document !== "undefined" && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={() => setShowConsent(false)}>
            <div
              className="w-full max-w-sm rounded-xl border border-teal-500/30 bg-slate-900 p-5 space-y-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-bold text-white">Before you connect</h3>
              <p className="text-sm text-slate-300">
                By connecting a wallet you agree to our{" "}
                <a href="/terms" target="_blank" className="text-teal-300 underline">Terms of Service</a> and{" "}
                <a href="/privacy" target="_blank" className="text-teal-300 underline">Privacy Policy</a>.
              </p>
              <div>
                <label htmlFor="consent-email" className="block text-xs font-semibold text-slate-300 mb-1.5">Email</label>
                <input
                  id="consent-email"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border-2 border-slate-600 focus:border-teal-400 text-white text-sm outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowConsent(false)}
                  className="flex-1 px-3 py-2 text-xs font-semibold text-slate-300 border border-slate-600 rounded-lg hover:border-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAgreeAndConnect}
                  className="flex-1 px-3 py-2 text-xs font-bold text-slate-950 bg-teal-400 rounded-lg hover:bg-teal-300"
                >
                  Agree &amp; Connect
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-slate-900 border border-teal-500/40 hover:border-teal-400 rounded-full transition-all"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="text-xs font-mono text-white">{short(address)}</span>
        {credits !== null && (
          <span className="hidden sm:inline text-xs font-bold text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded-full">
            {credits} credit{credits === 1 ? "" : "s"}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 max-w-[90vw] rounded-xl border border-teal-500/30 bg-slate-900 shadow-xl p-3 space-y-2 z-50">
          <p className="text-xs text-slate-400">Connected wallet</p>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-mono text-white">{short(address)}</p>
            <button
              type="button"
              onClick={handleCopyAddress}
              title="Copy address"
              aria-label="Copy address"
              className="p-1 rounded text-slate-400 hover:text-teal-300 hover:bg-teal-500/10 transition-colors"
            >
              {copied ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
          <div className="rounded-lg bg-teal-500/10 border border-teal-500/30 px-3 py-2 text-center">
            <p className="text-lg font-black text-white">{credits ?? "\u2014"}</p>
            <p className="text-[10px] uppercase tracking-wide text-teal-300">credits</p>
          </div>
          <a
            href="/pro"
            className="block text-center text-xs font-semibold text-teal-300 hover:text-white hover:underline"
            onClick={() => setOpen(false)}
          >
            Buy more credits →
          </a>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              disconnect();
            }}
            className="block w-full text-center text-xs font-semibold text-rose-300 hover:text-white hover:underline"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
