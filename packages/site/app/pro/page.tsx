"use client";

import { useEffect, useState } from "react";
import { encodeFunctionData, erc20Abi } from "viem";
import { base } from "@reown/appkit/networks";
import { useSendTransaction, useSwitchChain } from "wagmi";
import { useWallet } from "@/src/wallet/useWallet";
import { friendlyWalletError } from "@/src/wallet/errors";
import { DEEP_CHECK_ENABLED } from "@/src/pro-status";

const GATE_URL = process.env.NEXT_PUBLIC_GATE_URL || "https://genesis-gate.onrender.com";
const PAYMENT_ADDRESS = (process.env.NEXT_PUBLIC_PAYMENT_ADDRESS || "").toLowerCase() as `0x${string}`;
const MIN_USDC = Math.max(1, Number(process.env.NEXT_PUBLIC_PRO_MIN_USDC || "1"));
const CREDITS_PER_USDC = Math.max(1, Number(process.env.NEXT_PUBLIC_PRO_CREDITS_PER_USDC || "1"));
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;

function short(a: string) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
}

export default function ProPage() {
  const { address, isConnected, chainId, connect, disconnect } = useWallet();
  const { switchChainAsync } = useSwitchChain();
  const { sendTransactionAsync } = useSendTransaction();

  const [credits, setCredits] = useState<number>(0);
  const [amount, setAmount] = useState<number>(MIN_USDC);
  const [busy, setBusy] = useState<"idle" | "paying" | "verifying">("idle");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [verifyAttempt, setVerifyAttempt] = useState(0);

  const loadCredits = async (addr: string) => {
    try {
      const r = await fetch(`${GATE_URL}/v1/pro/status/${addr}`);
      if (r.ok) setCredits((await r.json()).credits ?? 0);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (address) loadCredits(address);
    else setCredits(0);
  }, [address]);

  const pollVerify = async (addr: string) => {
    for (let i = 0; i < 4; i++) {
      setVerifyAttempt(i + 1);
      const r = await fetch(`${GATE_URL}/v1/pro/verify`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: addr }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.ok) {
        setVerifyAttempt(0);
        setCredits(d.balance ?? credits);
        setMessage(`Added ${d.credited} check${d.credited === 1 ? "" : "s"} — you now have ${d.balance}.`);
        return true;
      }
      if (i < 3) await new Promise((res) => setTimeout(res, 6000));
    }
    setVerifyAttempt(0);
    return false;
  };

  const pay = async () => {
    if (!DEEP_CHECK_ENABLED) {
      setError("");
      setMessage("Payments are launching soon — check back shortly.");
      return;
    }
    if (!address) return;
    const amt = Math.max(MIN_USDC, Math.floor(amount || 0));
    setError("");
    setMessage("");
    setBusy("paying");
    try {
      if (chainId !== base.id) {
        await switchChainAsync({ chainId: base.id });
      }
      const units = BigInt(Math.round(amt * 1_000_000)); // USDC has 6 decimals
      const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [PAYMENT_ADDRESS, units],
      });
      await sendTransactionAsync({ to: USDC_BASE, data, value: BigInt(0), chainId: base.id });
      setBusy("verifying");
      setMessage("Payment sent — adding your checks (this can take ~30s)…");
      const ok = await pollVerify(address);
      if (!ok) setMessage("Payment sent. If your checks haven't appeared, tap “Already paid? Add checks” shortly.");
    } catch (err: any) {
      setError(friendlyWalletError(err));
    } finally {
      setBusy("idle");
    }
  };

  const verifyNow = async () => {
    if (!address) return;
    setBusy("verifying");
    setError("");
    setMessage("Checking for your payment…");
    const ok = await pollVerify(address);
    if (!ok) setMessage("No new payment found yet. If you just paid, wait a moment and try again.");
    setBusy("idle");
  };

  const buyChecks = Math.floor(Math.max(MIN_USDC, amount) * CREDITS_PER_USDC);

  return (
    <div className="max-w-xl mx-auto space-y-8 py-8">
      <header className="text-center space-y-3">
        <h1 className="text-4xl font-black text-white">Deep checks, pay-as-you-go</h1>
        <p className="text-slate-300">
          Pay what you like (min {MIN_USDC} USDC) in USDC on Base — {CREDITS_PER_USDC} check{CREDITS_PER_USDC === 1 ? "" : "s"} per
          USDC. No subscription, no account, just your wallet.
        </p>
      </header>

      {!isConnected || !address ? (
        <div className="bg-slate-900/60 border-2 border-teal-500/40 rounded-2xl p-6 text-center space-y-4">
          <p className="text-slate-300 text-sm">Connect your wallet to buy checks.</p>
          <button
            onClick={connect}
            className="px-6 py-3 rounded-lg bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 transition"
          >
            Connect wallet
          </button>
        </div>
      ) : (
        <div className="bg-slate-900/60 border-2 border-teal-500/40 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Wallet</span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-white">{short(address)}</span>
              <button type="button" onClick={connect} className="text-xs font-semibold text-teal-300 hover:text-white hover:underline">Change wallet</button>
              <button type="button" onClick={() => disconnect()} className="text-xs font-semibold text-rose-300 hover:text-white hover:underline">Disconnect</button>
            </div>
          </div>
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-900/15 p-4 text-center">
            <p className="text-3xl font-black text-white">{credits}</p>
            <p className="text-xs text-emerald-200">deep checks available</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-slate-300">Add checks — pay what you like:</p>
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
              = {buyChecks} check{buyChecks === 1 ? "" : "s"}. Paid on Base — make sure your wallet holds USDC on Base.
            </p>
          </div>

          <button
            onClick={pay}
            disabled={busy !== "idle"}
            className="w-full py-3 rounded-lg bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 disabled:opacity-50 transition"
          >
            {!DEEP_CHECK_ENABLED
              ? "Coming soon"
              : busy === "paying"
                ? "Confirm in your wallet…"
                : busy === "verifying"
                  ? "Adding checks…"
                  : `Pay ${Math.max(MIN_USDC, amount)} USDC`}
          </button>
          <button
            onClick={verifyNow}
            disabled={busy !== "idle"}
            className="w-full text-xs text-slate-400 hover:text-teal-300 underline disabled:opacity-50 transition"
          >
            {busy === "verifying" && verifyAttempt > 0 ? `Checking payment (attempt ${verifyAttempt}/4)…` : "Already paid? Add checks"}
          </button>

          {message && <p className="text-sm text-teal-200">{message}</p>}
          {error && <p className="text-sm text-rose-300">{error}</p>}
          {credits > 0 && (
            <a href="/check" className="block text-center text-sm font-semibold text-teal-300 hover:text-white hover:underline">
              Continue to Check →
            </a>
          )}
        </div>
      )}

      <p className="text-xs text-slate-500 text-center">
        Payment goes directly to GENESIS on Base. Checks are tied to your wallet. No custody, no card, no recurring charge.
      </p>
    </div>
  );
}
