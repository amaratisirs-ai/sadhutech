"use client";

import { useEffect, useState } from "react";
import { useSignMessage } from "wagmi";
import { resolveDecisionOutcome, type DecisionOutcome } from "../../src/decision";
import { Icon } from "@/components/Icon";
import { useWallet } from "@/src/wallet/useWallet";
import { friendlyWalletError } from "@/src/wallet/errors";
import { DEEP_CHECK_ENABLED } from "@/src/pro-status";
import { useGateStatus } from "@/src/gate-status";
import { Genesis, withGenesisStyle } from "@/components/Genesis";

const GATE_URL = process.env.NEXT_PUBLIC_GATE_URL || "https://genesis-gate.onrender.com";
const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
// Neutral sender used only so the gate can decode the call; no wallet is connected.
const PROBE_FROM = "0x1111111111111111111111111111111111111111";
const PROBE_TO = "0x2222222222222222222222222222222222222222";

type Mode = "address" | "advanced" | "bulk";

const MAX_BULK_ADDRESSES = 5;

type BulkResult = { address: string; outcome: DecisionOutcome; message: string };

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
    hint: "Grants access to ALL your tokens  -  a common scam",
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

// Splits on newlines/commas/whitespace, trims, drops empties, de-dupes, caps at the max.
function parseBulkAddresses(raw: string): string[] {
  const seen = new Set<string>();
  for (const part of raw.split(/[\s,]+/)) {
    const addr = part.trim();
    if (addr) seen.add(addr);
  }
  return Array.from(seen).slice(0, MAX_BULK_ADDRESSES);
}

// Best-effort detection so non-EVM users get an honest "not covered yet" message.
function detectNonEvmChain(addr: string): string | null {
  if (/^(bc1|tb1)[a-z0-9]{20,}$/i.test(addr)) return "Bitcoin";
  if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(addr)) return "Bitcoin";
  if (/^D[5-9A-HJ-NP-U][1-9A-HJ-NP-Za-km-z]{32,34}$/.test(addr)) return "Dogecoin";
  if (/^L[a-km-zA-HJ-NP-Z1-9]{26,33}$/.test(addr)) return "Litecoin";
  if (/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(addr)) return "Tron";
  if (/^(bnb1|cosmos1|osmo1)[a-z0-9]{20,}$/i.test(addr)) return "Cosmos";
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr)) return "Solana";
  return null;
}

function VerdictCard({ result }: { result: Result }) {
  if (result.error) {
    return (
      <div className="rounded-xl border border-rose-500/50 bg-rose-900/20 p-5">
        <p className="text-sm font-semibold text-white">{result.title}</p>
        <div className="mt-2 flex items-center gap-2 text-sm text-rose-200">
          <Icon name="block" className="w-4 h-4" />
          <span>{withGenesisStyle(result.error)}</span>
        </div>
      </div>
    );
  }

  const verdict = result.outcome?.verdict ?? "warn";
  const theme =
    verdict === "allow"
      ? { border: "border-emerald-500/50", bg: "bg-emerald-900/20", label: "text-emerald-300", icon: "checkCircle" as const, head: "Looks safe" }
      : verdict === "block"
        ? { border: "border-rose-500/50", bg: "bg-rose-900/20", label: "text-rose-300", icon: "block" as const, head: "Do not sign" }
        : { border: "border-amber-500/50", bg: "bg-amber-900/20", label: "text-amber-300", icon: "warning" as const, head: "Be careful" };

  return (
    <div className={`rounded-xl border p-5 space-y-3 ${theme.border} ${theme.bg}`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-300">{result.title}</p>
          <h3 className="text-2xl font-black text-white flex items-center gap-2">
            <Icon name={theme.icon} className="w-6 h-6" />
            <span>{theme.head}</span>
          </h3>
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
  const { address, isConnected, connect } = useWallet();
  const gateStatus = useGateStatus();
  const { signMessageAsync } = useSignMessage();
  const [mode, setMode] = useState<Mode>("address");
  const [addressInput, setAddressInput] = useState("");
  const [dataInput, setDataInput] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [lastTx, setLastTx] = useState<Record<string, unknown> | null>(null);
  const [deepBusy, setDeepBusy] = useState(false);
  const [deepMsg, setDeepMsg] = useState<string | null>(null);
  const [pendingDeepCheck, setPendingDeepCheck] = useState(false);
  const [bulkInput, setBulkInput] = useState("");
  const [bulkResults, setBulkResults] = useState<BulkResult[] | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);
  const [pendingBulkCheck, setPendingBulkCheck] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("genesis_check_pending");
    if (!raw) return;
    sessionStorage.removeItem("genesis_check_pending");
    try {
      const saved = JSON.parse(raw);
      if (saved.mode) setMode(saved.mode);
      if (saved.addressInput) setAddressInput(saved.addressInput);
      if (saved.dataInput) setDataInput(saved.dataInput);
      if (saved.lastTx) setLastTx(saved.lastTx);
      if (saved.result) setResult(saved.result);
    } catch {
      // ignore malformed restore payload
    }
  }, []);

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
    if (!addr) {
      setResult({ title: "Address check", error: "Paste an EVM address before checking it." });
      return;
    }
    if (addr.toLowerCase().endsWith(".eth")) {
      setResult({ title: "Address check", error: "ENS names aren't supported yet  -  paste the 0x address it points to." });
      return;
    }
    if (!ADDRESS_RE.test(addr)) {
      if (addr.startsWith("0x")) {
        setResult({ title: "Address check", error: "That looks incomplete  -  an address is 0x followed by 40 characters." });
        return;
      }
      const chain = detectNonEvmChain(addr);
      const msg = chain
        ? `That looks like a ${chain} address. GENESIS currently covers EVM chains (Ethereum, Polygon, Arbitrum, Optimism, Avalanche)  -  ${chain} support is on the roadmap, so we can't verify it yet.`
        : "We currently check EVM addresses (Ethereum, Polygon, Arbitrum, Optimism, Avalanche). Paste a 0x… address.";
      setResult({ title: "Address check", error: msg });
      return;
    }
    setChecking(true);
    setResult(null);
    setDeepMsg(null);
    try {
      const tx = { chainId: 1, from: PROBE_FROM, to: addr, value: "1", data: "0x" };
      setLastTx(tx);
      const data = await analyzeTx(tx);
      const outcome = resolveDecisionOutcome(data);
      const intel = (data.findings ?? []).find((f: { id?: string }) => String(f?.id).startsWith("intel."));
      const message = intel
        ? intel.description
        : outcome.verdict === "allow"
          ? "No known threats found for this address in the community feed. A clean result isn't a guarantee  -  stay cautious with new contracts."
          : outcome.reason;
      setResult({ title: `Safety check · ${short(addr)}`, outcome, message, findings: intel ? [intel] : [] });
    } catch (e) {
      setResult({ title: "Address check", error: e instanceof Error ? e.message : "Check failed" });
    } finally {
      setChecking(false);
    }
  };

  const checkTransaction = async (rawData: string, title: string) => {
    // Strip all whitespace, not just leading/trailing - pasted calldata often wraps with spaces/newlines.
    const data = rawData.replace(/\s+/g, "");
    if (!/^0x[0-9a-fA-F]*$/.test(data) || data.length < 10) {
      setResult({ title, error: "Paste valid transaction data  -  0x followed by the encoded call (at least a 4-byte method)." });
      return;
    }
    setChecking(true);
    setResult(null);
    setDeepMsg(null);
    try {
      const tx = { chainId: 1, from: PROBE_FROM, to: PROBE_TO, value: "0", data };
      setLastTx(tx);
      const res = await analyzeTx(tx);
      const outcome = resolveDecisionOutcome(res);
      setResult({ title, outcome, message: res.plainEnglish || outcome.reason, findings: res.findings ?? [] });
    } catch (e) {
      setResult({ title, error: e instanceof Error ? e.message : "Check failed" });
    } finally {
      setChecking(false);
    }
  };

  const refreshStatus = async (addr: string) => {
    try {
      const r = await fetch(`${GATE_URL}/v1/pro/status/${addr}`);
      if (!r.ok) return null;
      const s = await r.json();
      setCredits(typeof s.credits === "number" ? s.credits : 0);
      return s as { credits?: number; premium?: boolean };
    } catch {
      return null;
    }
  };

  const runDeepCheck = async () => {
    setDeepMsg(null);
    if (!lastTx || !address) return;
    if (!DEEP_CHECK_ENABLED) {
      setDeepMsg("Deep checks are launching soon — check back shortly.");
      return;
    }
    setDeepBusy(true);
    try {
      const s = await refreshStatus(address);
      if (!s?.premium) { setDeepMsg("Deep checks (global ChainAbuse intel) are launching soon."); return; }
      if (!s.credits || s.credits < 1) { setDeepMsg("no-credits"); return; }
      const message = `SadhuTech deep check\nwallet: ${address}\nts: ${new Date().toISOString()}`;
      const signature = await signMessageAsync({ message });
      const res = await fetch(`${GATE_URL}/v1/analyze`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tx: lastTx, pro: { wallet: address, message, signature } }),
      });
      if (res.status === 402) { await refreshStatus(address); setDeepMsg("no-credits"); return; }
      if (!res.ok) { setDeepMsg(`Deep check failed (HTTP ${res.status}). Please try again.`); return; }
      const data = await res.json();
      const outcome = resolveDecisionOutcome(data);
      setResult((prev) => ({
        title: prev ? `${prev.title.replace(/ · deep$/, "")} · deep` : "Deep check",
        outcome,
        message: data.plainEnglish || outcome.reason,
        findings: data.findings ?? [],
      }));
      if (typeof data.creditsLeft === "number") setCredits(data.creditsLeft);
    } catch (e: any) {
      setDeepMsg(friendlyWalletError(e));
    } finally {
      setDeepBusy(false);
    }
  };

  const startDeepCheck = () => {
    if (!isConnected || !address) {
      setPendingDeepCheck(true);
      connect();
      return;
    }
    runDeepCheck();
  };

  const runBulkCheck = async () => {
    setBulkMsg(null);
    if (!address) return;
    const addresses = parseBulkAddresses(bulkInput);
    if (addresses.length === 0) {
      setBulkMsg("Paste at least one EVM address (one per line).");
      return;
    }
    const invalid = addresses.filter((a) => !ADDRESS_RE.test(a));
    if (invalid.length > 0) {
      setBulkMsg(`Not a valid EVM address: ${invalid[0]}`);
      return;
    }
    if (!DEEP_CHECK_ENABLED) {
      setBulkMsg("Bulk check is launching soon — check back shortly.");
      return;
    }
    setBulkBusy(true);
    setBulkResults(null);
    try {
      const s = await refreshStatus(address);
      if (!s?.premium) { setBulkMsg("Bulk check (like deep checks) is launching soon."); return; }
      if (!s.credits || s.credits < addresses.length) { setBulkMsg("no-credits"); return; }
      const message = `SadhuTech bulk check\nwallet: ${address}\nts: ${new Date().toISOString()}`;
      const signature = await signMessageAsync({ message });
      const res = await fetch(`${GATE_URL}/v1/analyze/bulk`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ addresses, pro: { wallet: address, message, signature } }),
      });
      if (res.status === 402) { await refreshStatus(address); setBulkMsg("no-credits"); return; }
      if (!res.ok) { setBulkMsg(`Bulk check failed (HTTP ${res.status}). Please try again.`); return; }
      const data = await res.json();
      const results: BulkResult[] = (data.results ?? []).map((r: any) => {
        const outcome = resolveDecisionOutcome(r);
        const intel = (r.findings ?? []).find((f: { id?: string }) => String(f?.id).startsWith("intel."));
        return { address: r.address, outcome, message: intel ? intel.description : r.plainEnglish || outcome.reason };
      });
      setBulkResults(results);
      if (typeof data.creditsLeft === "number") setCredits(data.creditsLeft);
    } catch (e: any) {
      setBulkMsg(friendlyWalletError(e));
    } finally {
      setBulkBusy(false);
    }
  };

  const startBulkCheck = () => {
    if (!isConnected || !address) {
      setPendingBulkCheck(true);
      connect();
      return;
    }
    runBulkCheck();
  };

  const goBuyChecks = () => {
    try {
      sessionStorage.setItem("genesis_check_pending", JSON.stringify({ mode, addressInput, dataInput, lastTx, result }));
    } catch {
      // ignore storage failures; worst case the user re-runs the check
    }
    window.location.href = "/pro";
  };

  useEffect(() => {
    if (!pendingDeepCheck || !isConnected || !address) return;
    setPendingDeepCheck(false);
    runDeepCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingDeepCheck, isConnected, address]);

  useEffect(() => {
    if (!pendingBulkCheck || !isConnected || !address) return;
    setPendingBulkCheck(false);
    runBulkCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingBulkCheck, isConnected, address]);

  return (
    <div className="space-y-10 max-w-3xl mx-auto">
      <header className="text-center space-y-3">
        <h1 className="text-4xl md:text-5xl font-black text-white">Check before you sign</h1>
        <p className="text-slate-300 max-w-xl mx-auto">
          Paste a crypto address or a transaction and <Genesis /> screens it against community threat intel  -  a plain-English
          verdict in seconds. No wallet connection, no signup.
        </p>
        {gateStatus === "waking" && (
          <p className="text-xs text-amber-300">The checker is waking up from idle — your first check may take up to a minute.</p>
        )}
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
          <button
            onClick={() => { setMode("bulk"); setResult(null); }}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition ${mode === "bulk" ? "bg-teal-500 text-slate-950" : "text-slate-300 hover:text-white"}`}
          >
            Bulk check
          </button>
        </div>
      </div>

      {mode === "address" ? (
        <section className="bg-slate-900/60 border-2 border-teal-500/40 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Icon name="search" className="w-5 h-5 text-teal-400" /> Is this address safe?</h2>
            <p className="text-sm text-slate-300 mt-1">
              About to approve a contract, connect to a dApp, or send funds? Paste that address first.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                value={addressInput}
                onChange={(e) => { setAddressInput(e.target.value); setResult(null); }}
                onKeyDown={(e) => e.key === "Enter" && checkAddress()}
                placeholder="0x… address"
                className="w-full px-4 py-3 pr-10 rounded-lg bg-slate-800 border-2 border-slate-600 focus:border-teal-400 text-white font-mono text-sm outline-none"
              />
              {addressInput && (
                <button
                  type="button"
                  onClick={() => { setAddressInput(""); setResult(null); }}
                  aria-label="Clear address"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition"
                >
                  ✕
                </button>
              )}
            </div>
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
      ) : mode === "advanced" ? (
        <section className="bg-slate-900/60 border-2 border-teal-500/40 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Icon name="document" className="w-5 h-5 text-teal-400" /> Check transaction data</h2>
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
      ) : (
        <section className="bg-slate-900/60 border-2 border-teal-500/40 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Icon name="shieldAlert" className="w-5 h-5 text-teal-400" /> Bulk check (up to {MAX_BULK_ADDRESSES})</h2>
            <p className="text-sm text-slate-300 mt-1">
              Paste up to {MAX_BULK_ADDRESSES} addresses, one per line. Costs 1 Pro credit per address  -  requires a
              connected wallet.
            </p>
          </div>
          <textarea
            value={bulkInput}
            onChange={(e) => { setBulkInput(e.target.value); setBulkMsg(null); }}
            placeholder={"0x1111…\n0x2222…\n0x3333…"}
            className="w-full h-32 px-4 py-3 rounded-lg bg-slate-800 border-2 border-slate-600 focus:border-teal-400 text-white font-mono text-xs outline-none resize-none"
          />
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-slate-400">
              {parseBulkAddresses(bulkInput).length} of {MAX_BULK_ADDRESSES} addresses parsed
              {credits !== null && <> · {credits} credit{credits === 1 ? "" : "s"} left</>}
            </p>
            <button
              onClick={startBulkCheck}
              disabled={bulkBusy}
              className="px-6 py-3 rounded-lg bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 disabled:opacity-50 transition"
            >
              {bulkBusy ? "Checking…" : isConnected ? `Bulk check (${parseBulkAddresses(bulkInput).length || 1} credit${parseBulkAddresses(bulkInput).length === 1 ? "" : "s"})` : "Connect & bulk check"}
            </button>
          </div>
          {bulkMsg && bulkMsg !== "no-credits" && <p className="text-xs text-amber-300">{bulkMsg}</p>}
          {bulkMsg === "no-credits" && (
            <p className="text-xs text-amber-300">Not enough credits for {parseBulkAddresses(bulkInput).length} addresses. <a href="/pro" className="underline font-semibold">Buy credits →</a></p>
          )}
          {bulkResults && (
            <ul className="space-y-2 pt-1">
              {bulkResults.map((r) => {
                const v = r.outcome.verdict;
                const color = v === "allow" ? "border-emerald-500/50 bg-emerald-900/10 text-emerald-300" : v === "block" ? "border-rose-500/50 bg-rose-900/10 text-rose-300" : "border-amber-500/50 bg-amber-900/10 text-amber-300";
                return (
                  <li key={r.address} className={`rounded-lg border p-3 ${color}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-white">{short(r.address)}</span>
                      <span className="text-xs font-bold uppercase tracking-wide">{v}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{r.message}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {result && <VerdictCard result={result} />}

      {result && !result.error && lastTx && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-900/10 p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            <p className="text-sm font-semibold text-white flex items-center gap-1.5"><Icon name="lock" className="w-4 h-4" /> Deep check <span className="text-xs font-normal text-amber-300/80">· Pro</span></p>
            <p className="text-xs text-slate-400 mt-0.5">Cross-checks this address against ChainAbuse&apos;s global scam reports. Costs 1 credit.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {credits !== null && <span className="text-xs text-slate-400">{credits} left</span>}
            <button
              onClick={startDeepCheck}
              disabled={deepBusy}
              className="px-4 py-2 rounded-lg bg-amber-400 text-slate-950 text-sm font-bold hover:bg-amber-300 disabled:opacity-50 transition whitespace-nowrap"
            >
              {deepBusy ? "Working…" : isConnected ? "Deep check (1 credit)" : "Connect & deep check"}
            </button>
          </div>
        </div>
      )}
      {deepMsg && deepMsg !== "no-credits" && (
        <p className="text-xs text-amber-300 text-center">{deepMsg}</p>
      )}
      {deepMsg === "no-credits" && (
        <p className="text-xs text-amber-300 text-center">You&apos;re out of credits. <button type="button" onClick={goBuyChecks} className="underline font-semibold">Buy credits →</button></p>
      )}

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
            Threats are community-reported and confirmed by multiple independent reporters before they count  -  no single
            person can flag an address alone. See the <a href="/threats" className="text-teal-300 hover:underline">live threat feed</a>.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-5 space-y-2">
          <h3 className="text-sm font-bold text-white">Found a scam?</h3>
          <p className="text-xs text-slate-300">
            Help protect everyone  -  <a href="/report" className="text-teal-300 hover:underline">report a malicious address</a>.
            The more reports, the stronger the shield.
          </p>
        </div>
      </section>
    </div>
  );
}
