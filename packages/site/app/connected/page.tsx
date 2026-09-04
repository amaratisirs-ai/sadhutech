"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { resolveDecisionOutcome, type DecisionOutcome } from "../../src/decision";

const GATE_URL = process.env.NEXT_PUBLIC_GATE_URL || "https://genesis-gate.onrender.com";
const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const FALLBACK_FROM = "0x1111111111111111111111111111111111111111";

type Session = { wallet: string; account: string; chainId: number };

type CheckResult = {
  title: string;
  outcome?: DecisionOutcome;
  message?: string;
  error?: string;
};

const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum",
  137: "Polygon",
  42161: "Arbitrum",
  10: "Optimism",
  43114: "Avalanche",
};

function chainName(id: number) {
  return CHAIN_NAMES[id] ?? `Chain ${id}`;
}

function short(a: string) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
}

const EXAMPLES = [
  {
    key: "safe",
    label: "A normal token transfer",
    hint: "What a routine, safe action looks like",
    data: "0xa9059cbb000000000000000000000000444444444444444444444444444444444444444400000000000000000000000000000000000000000000000000000000000003e8",
  },
  {
    key: "approval",
    label: "An unlimited spending approval",
    hint: "Common in scams — grants access to all your tokens",
    data: "0x095ea7b30000000000000000000000003333333333333333333333333333333333333333ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
  },
  {
    key: "drainer",
    label: "Approval to a known drainer",
    hint: "An address the community has confirmed as malicious",
    data: "0x095ea7b3000000000000000000000000000000000000000000000000000000000000deadffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
  },
];

function VerdictCard({ result }: { result: CheckResult }) {
  if (result.error) {
    return (
      <div className="rounded-xl border border-rose-500/50 bg-rose-900/20 p-5">
        <p className="text-sm font-semibold text-white">{result.title}</p>
        <p className="mt-2 text-sm text-rose-200">❌ {result.error}</p>
      </div>
    );
  }

  const verdict = result.outcome?.verdict ?? "warn";
  const theme =
    verdict === "allow"
      ? { border: "border-emerald-500/50", bg: "bg-emerald-900/20", label: "text-emerald-300", icon: "✅", head: "Looks safe" }
      : verdict === "block"
        ? { border: "border-rose-500/50", bg: "bg-rose-900/20", label: "text-rose-300", icon: "🚫", head: "Do not proceed" }
        : { border: "border-amber-500/50", bg: "bg-amber-900/20", label: "text-amber-300", icon: "⚠️", head: "Be careful" };

  return (
    <div className={`rounded-xl border p-5 ${theme.border} ${theme.bg}`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-300">{result.title}</p>
          <h3 className="text-2xl font-black text-white">{theme.icon} {theme.head}</h3>
        </div>
        <span className={`rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold uppercase tracking-wide ${theme.label}`}>
          {verdict}
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-200">{result.message}</p>
    </div>
  );
}

function ConnectedContent() {
  const searchParams = useSearchParams();
  const [session, setSession] = useState<Session | null>(null);
  const [addressInput, setAddressInput] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);

  useEffect(() => {
    const wallet = searchParams.get("wallet");
    const account = searchParams.get("account");
    const chainId = Number(searchParams.get("chainId") ?? "");

    const stored = typeof window !== "undefined" ? localStorage.getItem("genesis_wallet_session") : null;
    const parsed = stored ? JSON.parse(stored) : null;

    const finalAccount = account || parsed?.account || "";
    const finalWallet = wallet || parsed?.wallet || "Your wallet";
    const finalChainId = Number(chainId || parsed?.chainId || 1);
    const status = parsed?.status ?? (finalAccount ? "connected" : null);

    if (finalAccount && status === "connected") {
      setSession({ wallet: finalWallet, account: finalAccount, chainId: finalChainId });
    } else {
      setSession(null);
    }
  }, [searchParams]);

  const analyzeTx = async (tx: Record<string, unknown>) => {
    const res = await fetch(`${GATE_URL}/v1/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tx }),
    });
    if (!res.ok) {
      throw new Error(`The safety checker is unavailable right now (HTTP ${res.status}). Please try again shortly.`);
    }
    return res.json();
  };

  const checkAddress = async () => {
    const addr = addressInput.trim();
    if (addr.toLowerCase().endsWith(".eth")) {
      setResult({ title: "Address check", error: "ENS names aren't supported yet — paste the 0x address it points to." });
      return;
    }
    if (!ADDRESS_RE.test(addr)) {
      const msg = addr.startsWith("0x")
        ? "That looks incomplete — an address is 0x followed by 40 characters."
        : "We currently check EVM addresses (Ethereum, Polygon, Arbitrum, Optimism, Avalanche). Paste a 0x… address.";
      setResult({ title: "Address check", error: msg });
      return;
    }
    setChecking(true);
    setResult(null);
    try {
      const data = await analyzeTx({
        chainId: session?.chainId ?? 1,
        from: session?.account || FALLBACK_FROM,
        to: addr,
        value: "1",
        data: "0x",
      });
      const outcome = resolveDecisionOutcome(data);
      const intel = (data.findings ?? []).find((f: { id?: string }) => String(f?.id).startsWith("intel."));
      const message = intel
        ? intel.description
        : outcome.verdict === "allow"
          ? "No known threats found for this address in the community feed. A clean result isn't a guarantee — stay cautious with new contracts."
          : outcome.reason;
      setResult({ title: `Safety check · ${short(addr)}`, outcome, message });
    } catch (e) {
      setResult({ title: "Address check", error: e instanceof Error ? e.message : "Check failed" });
    } finally {
      setChecking(false);
    }
  };

  const runExample = async (example: (typeof EXAMPLES)[number]) => {
    setChecking(true);
    setResult(null);
    try {
      const data = await analyzeTx({
        chainId: session?.chainId ?? 1,
        from: session?.account || FALLBACK_FROM,
        to: "0x2222222222222222222222222222222222222222",
        value: "0",
        data: example.data,
      });
      const outcome = resolveDecisionOutcome(data);
      setResult({ title: `Example · ${example.label}`, outcome, message: data.plainEnglish || outcome.reason });
    } catch (e) {
      setResult({ title: `Example · ${example.label}`, error: e instanceof Error ? e.message : "Check failed" });
    } finally {
      setChecking(false);
    }
  };

  const disconnect = () => {
    localStorage.removeItem("genesis_wallet_session");
    window.location.href = "/wallet-connect?change=1&disconnect=1";
  };

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 py-12">
        <div className="text-6xl">🔌</div>
        <h1 className="text-4xl font-black text-white">No wallet connected</h1>
        <p className="text-slate-300">Connect a wallet first to start checking transactions before you sign them.</p>
        <a href="/wallet-connect" className="inline-block px-6 py-3 rounded-lg bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 transition">
          Connect a wallet →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      {/* Success header */}
      <section className="bg-gradient-to-br from-emerald-900/40 to-slate-900 border-2 border-emerald-500/50 rounded-2xl p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-4">
          <div className="text-5xl">✅</div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white">You're connected</h1>
            <p className="text-emerald-200 text-sm">GENESIS is ready to check transactions before you sign them.</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <div className="bg-black/20 border border-emerald-500/30 rounded-lg p-3">
            <p className="text-emerald-300 text-xs uppercase">Wallet</p>
            <p className="text-white font-semibold mt-1">{session.wallet}</p>
          </div>
          <div className="bg-black/20 border border-emerald-500/30 rounded-lg p-3">
            <p className="text-emerald-300 text-xs uppercase">Account</p>
            <p className="text-white font-mono mt-1">{short(session.account)}</p>
          </div>
          <div className="bg-black/20 border border-emerald-500/30 rounded-lg p-3">
            <p className="text-emerald-300 text-xs uppercase">Network</p>
            <p className="text-white font-semibold mt-1">{chainName(session.chainId)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 pt-1">
          <a href="/wallet-connect?change=1" className="px-4 py-2 rounded-lg border border-emerald-500/40 text-emerald-100 bg-emerald-500/10 hover:bg-emerald-500/20 transition text-sm font-semibold">
            Change wallet
          </a>
          <button onClick={disconnect} className="px-4 py-2 rounded-lg border border-rose-500/40 text-rose-100 bg-rose-500/10 hover:bg-rose-500/20 transition text-sm font-semibold">
            Disconnect
          </button>
        </div>
      </section>

      {/* Primary tool: check an address */}
      <section className="bg-slate-900/60 border-2 border-teal-500/40 rounded-2xl p-6 space-y-4">
        <div>
          <h3 className="text-xl font-bold text-white">🔎 Check any address before you approve it</h3>
          <p className="text-sm text-slate-300 mt-1">
            About to approve a contract, connect to a dApp, or send funds? Paste that address here first and GENESIS screens
            it against community threat intel — before you sign anything in your wallet.
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Checking on <span className="text-teal-300 font-semibold">{chainName(session.chainId)}</span> · supports EVM chains (Ethereum, Polygon, Arbitrum, Optimism, Avalanche).
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && checkAddress()}
            placeholder="0x… address"
            className="flex-1 px-4 py-3 rounded-lg bg-slate-800 border-2 border-slate-600 focus:border-teal-400 text-white font-mono text-sm outline-none"
          />
          <button
            onClick={checkAddress}
            disabled={checking}
            className="px-6 py-3 rounded-lg bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 disabled:opacity-50 transition"
          >
            {checking ? "Checking…" : "Check address"}
          </button>
        </div>

        {result && <VerdictCard result={result} />}
      </section>

      {/* Examples */}
      <section className="space-y-3">
        <h3 className="text-lg font-bold text-white">See it in action</h3>
        <p className="text-sm text-slate-400">Run a sample check to see how GENESIS explains a verdict.</p>
        <div className="grid sm:grid-cols-3 gap-3">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.key}
              onClick={() => runExample(ex)}
              disabled={checking}
              className="text-left rounded-xl border-2 border-slate-700 bg-slate-800/50 hover:border-teal-500 p-4 transition disabled:opacity-50"
            >
              <p className="font-semibold text-white text-sm">{ex.label}</p>
              <p className="text-xs text-slate-400 mt-1">{ex.hint}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Honest roadmap note */}
      <section className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6 space-y-2">
        <h3 className="text-lg font-bold text-white">Coming soon: hands-free protection</h3>
        <p className="text-sm text-slate-300">
          Right now, paste-to-check keeps you safe before you approve anything. Automatic protection that pops up inside
          your wallet as you sign is in progress — we'll let you know when it's ready.
        </p>
      </section>
    </div>
  );
}

export default function ConnectedPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-300">Loading…</div>}>
      <ConnectedContent />
    </Suspense>
  );
}
