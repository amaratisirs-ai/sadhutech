"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";

const GATE_URL = process.env.NEXT_PUBLIC_GATE_URL || "https://genesis-gate.onrender.com";
const PAYMENT_ADDRESS = (process.env.NEXT_PUBLIC_PAYMENT_ADDRESS || "").toLowerCase();
const MIN_USDC = Math.max(1, Number(process.env.NEXT_PUBLIC_PRO_MIN_USDC || "1"));
const CREDITS_PER_USDC = Math.max(1, Number(process.env.NEXT_PUBLIC_PRO_CREDITS_PER_USDC || "1"));
const USDC_BASE = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const BASE_CHAIN_HEX = "0x2105"; // 8453
const CONFIGURED = PAYMENT_ADDRESS.length === 42;

function short(a: string) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
}

export default function ProPage() {
  const [account, setAccount] = useState<string | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [amount, setAmount] = useState<number>(MIN_USDC);
  const [busy, setBusy] = useState<"idle" | "connecting" | "paying" | "verifying">("idle");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const eth = () => (typeof window !== "undefined" ? (window as any).ethereum : undefined);

  const loadCredits = async (addr: string) => {
    try {
      const r = await fetch(`${GATE_URL}/v1/pro/status/${addr}`);
      if (r.ok) setCredits((await r.json()).credits ?? 0);
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
          loadCredits(accts[0].toLowerCase());
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
      await loadCredits(addr);
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
        setCredits(d.balance ?? credits);
        setMessage(`Added ${d.credited} check${d.credited === 1 ? "" : "s"}  -  you now have ${d.balance}.`);
        return true;
      }
      await new Promise((res) => setTimeout(res, 8000));
    }
    return false;
  };

  const pay = async () => {
    const e = eth();
    if (!e || !account) return;
    const amt = Math.max(MIN_USDC, Math.floor(amount || 0));
    setError("");
    setMessage("");
    setBusy("paying");
    try {
      await ensureBase();
      const units = amt * 1_000_000; // USDC 6 decimals; small whole amounts safe as Number
      const data =
        "0xa9059cbb" +
        PAYMENT_ADDRESS.replace("0x", "").padStart(64, "0") +
        units.toString(16).padStart(64, "0");
      await e.request({
        method: "eth_sendTransaction",
        params: [{ from: account, to: USDC_BASE, data, value: "0x0" }],
      });
      setBusy("verifying");
      setMessage("Payment sent  -  adding your checks (this can take ~30s)…");
      const ok = await pollVerify(account);
      if (!ok) setMessage("Payment sent. If your checks haven't appeared, tap “Already paid? Add checks” shortly.");
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
    if (!ok) setMessage("No new payment found yet. If you just paid, wait a moment and try again.");
    setBusy("idle");
  };

  if (!CONFIGURED) {
    return (
      <div className="max-w-xl mx-auto text-center space-y-6 py-16">
        <div className="flex justify-center text-teal-400"><Icon name="bolt" className="w-16 h-16" /></div>
        <h1 className="text-4xl font-black text-white">Pro is coming soon</h1>
        <p className="text-slate-300">
          Pay-as-you-go deep checks  -  pay only for what you use, straight from your wallet, powered by ChainAbuse for
          cross-chain coverage. We'll flip it on shortly.
        </p>
        <a href="/check" className="inline-block px-6 py-3 rounded-lg bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 transition">
          Try a free check
        </a>
      </div>
    );
  }

  const buyChecks = Math.floor(Math.max(MIN_USDC, amount) * CREDITS_PER_USDC);

  return (
    <div className="max-w-xl mx-auto space-y-8 py-8">
      <header className="text-center space-y-3">
        <h1 className="text-4xl font-black text-white">Deep checks, pay-as-you-go</h1>
        <p className="text-slate-300">
          Pay what you like (min {MIN_USDC} USDC) in USDC on Base  -  {CREDITS_PER_USDC} check{CREDITS_PER_USDC === 1 ? "" : "s"} per
          USDC. No subscription, no account, just your wallet.
        </p>
      </header>

      {!account ? (
        <div className="bg-slate-900/60 border-2 border-teal-500/40 rounded-2xl p-6 text-center space-y-4">
          <p className="text-slate-300 text-sm">Connect your wallet to buy checks.</p>
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
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Wallet</span>
            <span className="font-mono text-white">{short(account)}</span>
          </div>
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-900/15 p-4 text-center">
            <p className="text-3xl font-black text-white">{credits}</p>
            <p className="text-xs text-emerald-200">deep checks available</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-slate-300">Add checks  -  pay what you like:</p>
            <div className="flex gap-2">
              {[1, 5, 10].map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(v)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition ${
                    amount === v ? "border-teal-400 bg-teal-900/40 text-white" : "border-slate-600 text-slate-300 hover:border-teal-500"
                  }`}
                >
                  {v} USDC
                </button>
              ))}
              <input
                type="number"
                min={MIN_USDC}
                value={amount}
                onChange={(e) => setAmount(Math.max(MIN_USDC, Math.floor(Number(e.target.value) || MIN_USDC)))}
                className="w-24 px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 focus:border-teal-400 text-white text-sm outline-none"
                aria-label="Custom USDC amount"
              />
            </div>
            <p className="text-xs text-slate-400">
              = {buyChecks} check{buyChecks === 1 ? "" : "s"}. Paid on Base  -  make sure your wallet holds USDC on Base.
            </p>
          </div>

          <button
            onClick={pay}
            disabled={busy !== "idle"}
            className="w-full py-3 rounded-lg bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 disabled:opacity-50 transition"
          >
            {busy === "paying" ? "Confirm in your wallet…" : busy === "verifying" ? "Adding checks…" : `Pay ${Math.max(MIN_USDC, amount)} USDC`}
          </button>
          <button
            onClick={verifyNow}
            disabled={busy !== "idle"}
            className="w-full text-xs text-slate-400 hover:text-teal-300 underline disabled:opacity-50 transition"
          >
            Already paid? Add checks
          </button>

          {message && <p className="text-sm text-teal-200">{message}</p>}
          {error && <p className="text-sm text-rose-300">{error}</p>}
        </div>
      )}

      <p className="text-xs text-slate-500 text-center">
        Payment goes directly to GENESIS on Base. Checks are tied to your wallet. No custody, no card, no recurring charge.
      </p>
    </div>
  );
}
