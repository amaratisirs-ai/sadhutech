"use client";

import { useState } from "react";
import { resolveDecisionOutcome, type DecisionOutcome } from "../../src/decision";

const GATE_URL = process.env.NEXT_PUBLIC_GATE_URL || "https://genesis-gate.onrender.com";
const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
// Neutral sender used only so the gate can decode the call; no wallet is connected.
const PROBE_FROM = "0x1111111111111111111111111111111111111111";
const PROBE_TO = "0x2222222222222222222222222222222222222222";

type Mode = "address" | "advanced";

type Result = {
  title: string;
  outcome?: DecisionOutcome;
  message?: string;
  findings?: { id: string; title: string; description: string; severity: string }[];
  error?: string;
};

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
    hint: "Grants access to ALL your tokens — a common scam",
    data: "0x095ea7b30000000000000000000000003333333333333333333333333333333333333333ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
  },
  {
    key: "drainer",
    label: "Approval to a known drainer",
    hint: "An address the community has confirmed as malicious",
    data: "0x095ea7b3000000000000000000000000000000000000000000000000000000000000deadffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
  },
];

function short(a: string) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
}

function VerdictCard({ result }: { result: Result }) {
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
        ? { border: "border-rose-500/50", bg: "bg-rose-900/20", label: "text-rose-300", icon: "🚫", head: "Do not sign" }
        : { border: "border-amber-500/50", bg: "bg-amber-900/20", label: "text-amber-300", icon: "⚠️", head: "Be careful" };

  return (
    <div className={`rounded-xl border p-5 space-y-3 ${theme.border} ${theme.bg}`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-300">{result.title}</p>
          <h3 className="text-2xl font-black text-white">{theme.icon} {theme.head}</h3>
        </div>
        <span className={`rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold uppercase tracking-wide ${theme.label}`}>
          {verdict}
        </span>
      </div>
      <p className="text-sm text-slate-200">{result.message}</p>
      {result.findings && result.findings.length > 0 && (
        <ul className="space-y-2 pt-1">
          {result.findings.map((f, i) => (
            <li key={i} className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-sm font-semibold text-white">{f.title}</p>
              <p className="text-xs text-slate-300 mt-1">{f.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function CheckPage() {
  const [mode, setMode] = useState<Mode>("address");
  const [addressInput, setAddressInput] = useState("");
  const [dataInput, setDataInput] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const analyzeTx = async (tx: Record<string, unknown>) => {
    const res = await fetch(`${GATE_URL}/v1/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tx }),
    });
    if (!res.ok) {
      throw new Error(`The checker is unavailable right now (HTTP ${res.status}). Please try again shortly.`);
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
      const data = await analyzeTx({ chainId: 1, from: PROBE_FROM, to: addr, value: "1", data: "0x" });
      const outcome = resolveDecisionOutcome(data);
      const intel = (data.findings ?? []).find((f: { id?: string }) => String(f?.id).startsWith("intel."));
      const message = intel
        ? intel.description
        : outcome.verdict === "allow"
          ? "No known threats found for this address in the community feed. A clean result isn't a guarantee — stay cautious with new contracts."
          : outcome.reason;
      setResult({ title: `Safety check · ${short(addr)}`, outcome, message, findings: intel ? [intel] : [] });
    } catch (e) {
      setResult({ title: "Address check", error: e instanceof Error ? e.message : "Check failed" });
    } finally {
      setChecking(false);
    }
  };

  const checkTransaction = async (rawData: string, title: string) => {
    const data = rawData.trim();
    if (!/^0x[0-9a-fA-F]*$/.test(data) || data.length < 10) {
      setResult({ title, error: "Paste valid transaction data — 0x followed by the encoded call (at least a 4-byte method)." });
      return;
    }
    setChecking(true);
    setResult(null);
    try {
      const res = await analyzeTx({ chainId: 1, from: PROBE_FROM, to: PROBE_TO, value: "0", data });
      const outcome = resolveDecisionOutcome(res);
      setResult({ title, outcome, message: res.plainEnglish || outcome.reason, findings: res.findings ?? [] });
    } catch (e) {
      setResult({ title, error: e instanceof Error ? e.message : "Check failed" });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-10 max-w-3xl mx-auto">
      <header className="text-center space-y-3">
        <h1 className="text-4xl md:text-5xl font-black text-white">Check before you sign</h1>
        <p className="text-slate-300 max-w-xl mx-auto">
          Paste a crypto address or a transaction and GENESIS screens it against community threat intel — a plain-English
          verdict in seconds. No wallet connection, no signup.
        </p>
      </header>

      {/* Mode toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-slate-700 bg-slate-900 p-1">
          <button
            onClick={() => { setMode("address"); setResult(null); }}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition ${mode === "address" ? "bg-teal-500 text-slate-950" : "text-slate-300 hover:text-white"}`}
          >
            Check an address
          </button>
          <button
            onClick={() => { setMode("advanced"); setResult(null); }}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition ${mode === "advanced" ? "bg-teal-500 text-slate-950" : "text-slate-300 hover:text-white"}`}
          >
            Check a transaction
          </button>
        </div>
      </div>

      {mode === "address" ? (
        <section className="bg-slate-900/60 border-2 border-teal-500/40 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white">🔎 Is this address safe?</h2>
            <p className="text-sm text-slate-300 mt-1">
              About to approve a contract, connect to a dApp, or send funds? Paste that address first.
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
          <p className="text-xs text-slate-400">Supports EVM chains: Ethereum, Polygon, Arbitrum, Optimism, Avalanche.</p>
        </section>
      ) : (
        <section className="bg-slate-900/60 border-2 border-teal-500/40 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white">🧾 Check transaction data</h2>
            <p className="text-sm text-slate-300 mt-1">
              Paste the transaction data (calldata) your wallet is about to sign.
            </p>
          </div>
          <textarea
            value={dataInput}
            onChange={(e) => setDataInput(e.target.value)}
            placeholder="0x095ea7b3…"
            className="w-full h-28 px-4 py-3 rounded-lg bg-slate-800 border-2 border-slate-600 focus:border-teal-400 text-white font-mono text-xs outline-none resize-none"
          />
          <button
            onClick={() => checkTransaction(dataInput, "Transaction check")}
            disabled={checking}
            className="px-6 py-3 rounded-lg bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 disabled:opacity-50 transition"
          >
            {checking ? "Checking…" : "Check transaction"}
          </button>
        </section>
      )}

      {result && <VerdictCard result={result} />}

      {/* Examples */}
      <section className="space-y-3">
        <h3 className="text-lg font-bold text-white">See it in action</h3>
        <p className="text-sm text-slate-400">Run a sample check to see how GENESIS explains a verdict.</p>
        <div className="grid sm:grid-cols-3 gap-3">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.key}
              onClick={() => checkTransaction(ex.data, `Example · ${ex.label}`)}
              disabled={checking}
              className="text-left rounded-xl border-2 border-slate-700 bg-slate-800/50 hover:border-teal-500 p-4 transition disabled:opacity-50"
            >
              <p className="font-semibold text-white text-sm">{ex.label}</p>
              <p className="text-xs text-slate-400 mt-1">{ex.hint}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Trust + report */}
      <section className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-5 space-y-2">
          <h3 className="text-sm font-bold text-white">Why trust the verdict?</h3>
          <p className="text-xs text-slate-300">
            Threats are community-reported and confirmed by multiple independent reporters before they count — no single
            person can flag an address alone. See the <a href="/threats" className="text-teal-300 hover:underline">live threat feed</a>.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-5 space-y-2">
          <h3 className="text-sm font-bold text-white">Found a scam?</h3>
          <p className="text-xs text-slate-300">
            Help protect everyone — <a href="/report" className="text-teal-300 hover:underline">report a malicious address</a>.
            The more reports, the stronger the shield.
          </p>
        </div>
      </section>
    </div>
  );
}
