"use client";

import { useEffect, useState } from "react";

const GATE_URL = process.env.NEXT_PUBLIC_GATE_URL || "https://genesis-gate.onrender.com";
const PAYMENT_ADDRESS = (process.env.NEXT_PUBLIC_PAYMENT_ADDRESS || "").toLowerCase();
const PRICE = process.env.NEXT_PUBLIC_PRO_PRICE_USDC || "20";
const USDC_BASE = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const BASE_CHAIN_HEX = "0x2105"; // 8453

function short(a: string) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
}

export default function ProPage() {
  const [account, setAccount] = useState<string | null>(null);
  const [status, setStatus] = useState<{ pro: boolean; expiresAt: string | null } | null>(null);
  const [busy, setBusy] = useState<"idle" | "connecting" | "paying" | "verifying">("idle");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const eth = () => (typeof window !== "undefined" ? (window as any).ethereum : undefined);

  const loadStatus = async (addr: string) => {
    try {
      const r = await fetch(`${GATE_URL}/v1/pro/status/${addr}`);
      if (r.ok) setStatus(await r.json());
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const e = eth();
    if (!e) return;
    e.request?.({ method: "eth_accounts" })
      .then((accts: string[]) => {
        if (accts?.[0]) {
          setAccount(accts[0].toLowerCase());
          loadStatus(accts[0].toLowerCase());
        }
      })
      .catch(() => {});
  }, []);

  const connect = async () => {
    const e = eth();
    if (!e) {
      setError("No wallet found. Open this page in your wallet's browser, or install MetaMask / Coinbase Wallet.");
      return;
    }
    setBusy("connecting");
    setError("");
    try {
      const accts: string[] = await e.request({ method: "eth_requestAccounts" });
      const addr = (accts?.[0] || "").toLowerCase();
      setAccount(addr);
      await loadStatus(addr);
    } catch (err: any) {
      setError(err?.message || "Couldn't connect wallet.");
    } finally {
      setBusy("idle");
    }
  };

  const ensureBase = async () => {
    const e = eth();
    try {
      await e.request({ method: "wallet_switchEthereumChain", params: [{ chainId: BASE_CHAIN_HEX }] });
    } catch (err: any) {
      if (err?.code === 4902) {
        await e.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: BASE_CHAIN_HEX,
            chainName: "Base",
            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://mainnet.base.org"],
            blockExplorerUrls: ["https://basescan.org"],
          }],
        });
      } else {
        throw err;
      }
    }
  };

  const pollVerify = async (addr: string) => {
    for (let i = 0; i < 6; i++) {
      const r = await fetch(`${GATE_URL}/v1/pro/verify`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: addr }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.ok) {
        setStatus({ pro: true, expiresAt: d.expiresAt });
        setMessage("✅ You're Pro! Access is active.");
        return true;
      }
      await new Promise((res) => setTimeout(res, 8000));
    }
    return false;
  };

  const pay = async () => {
    const e = eth();
    if (!e || !account) return;
    if (!PAYMENT_ADDRESS) {
      setError("Payments aren't configured yet. Please check back soon.");
      return;
    }
    setError("");
    setMessage("");
    setBusy("paying");
    try {
      await ensureBase();
      const amount = Number(PRICE) * 1_000_000; // USDC has 6 decimals; prices are small, safe as Number
      const data =
        "0xa9059cbb" +
        PAYMENT_ADDRESS.replace("0x", "").padStart(64, "0") +
        amount.toString(16).padStart(64, "0");
      await e.request({
        method: "eth_sendTransaction",
        params: [{ from: account, to: USDC_BASE, data, value: "0x0" }],
      });
      setBusy("verifying");
      setMessage("Payment sent — confirming on-chain (this can take ~30s)…");
      const ok = await pollVerify(account);
      if (!ok) {
        setMessage("Payment sent. If it hasn't confirmed yet, tap “Verify payment” in a moment.");
      }
    } catch (err: any) {
      setError(err?.code === 4001 ? "Payment cancelled." : err?.message || "Payment failed.");
    } finally {
      setBusy("idle");
    }
  };

  const verifyNow = async () => {
    if (!account) return;
    setBusy("verifying");
    setError("");
    setMessage("Checking for your payment…");
    const ok = await pollVerify(account);
    if (!ok) setMessage("No confirmed payment found yet. If you just paid, wait a moment and try again.");
    setBusy("idle");
  };

  const isPro = status?.pro;

  return (
    <div className="max-w-xl mx-auto space-y-8 py-8">
      <header className="text-center space-y-3">
        <h1 className="text-4xl font-black text-white">Go Pro</h1>
        <p className="text-slate-300">
          Deeper, cross-chain protection powered by ChainAbuse. Pay {PRICE} USDC on Base for 30 days — no subscription,
          no account, just your wallet.
        </p>
      </header>

      {!account ? (
        <div className="bg-slate-900/60 border-2 border-teal-500/40 rounded-2xl p-6 text-center space-y-4">
          <p className="text-slate-300 text-sm">Connect your wallet to continue.</p>
          <button
            onClick={connect}
            disabled={busy === "connecting"}
            className="px-6 py-3 rounded-lg bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 disabled:opacity-50 transition"
          >
            {busy === "connecting" ? "Connecting…" : "Connect wallet"}
          </button>
        </div>
      ) : (
        <div className="bg-slate-900/60 border-2 border-teal-500/40 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Wallet</span>
            <span className="font-mono text-white text-sm">{short(account)}</span>
          </div>

          {isPro ? (
            <div className="rounded-xl border border-emerald-500/50 bg-emerald-900/20 p-4 text-center space-y-1">
              <p className="text-2xl">✅</p>
              <p className="text-white font-bold">You're Pro</p>
              <p className="text-xs text-emerald-200">
                Active until {status?.expiresAt ? new Date(status.expiresAt).toLocaleDateString() : "—"}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Plan</span><span className="text-white">Pro — 30 days</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Price</span><span className="text-white">{PRICE} USDC</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Network</span><span className="text-white">Base</span></div>
              </div>
              <p className="text-xs text-slate-400">
                One tap pays and activates Pro automatically — just make sure your wallet holds USDC on Base.
              </p>
              <button
                onClick={pay}
                disabled={busy !== "idle"}
                className="w-full py-3 rounded-lg bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 disabled:opacity-50 transition"
              >
                {busy === "paying" ? "Confirm in your wallet…" : busy === "verifying" ? "Activating…" : `Pay ${PRICE} USDC & go Pro`}
              </button>
              <button
                onClick={verifyNow}
                disabled={busy !== "idle"}
                className="w-full text-xs text-slate-400 hover:text-teal-300 underline disabled:opacity-50 transition"
              >
                Already paid? Verify
              </button>
            </>
          )}

          {message && <p className="text-sm text-teal-200">{message}</p>}
          {error && <p className="text-sm text-rose-300">❌ {error}</p>}
        </div>
      )}

      <p className="text-xs text-slate-500 text-center">
        Payment goes directly to GENESIS on Base. Your pass is tied to your wallet address. No custody, no card, no
        recurring charge.
      </p>
    </div>
  );
}
