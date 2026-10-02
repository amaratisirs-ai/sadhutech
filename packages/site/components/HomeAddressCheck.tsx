"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { addressCheckHandoff, addressCheckResult, addressInputError, addressProbe, type AddressAnalysis, type AddressCheckResult } from "@/src/address-check";

const GATE_URL = process.env.NEXT_PUBLIC_GATE_URL || "https://genesis-gate.onrender.com";
export default function HomeAddressCheck() {
  const [address, setAddress] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<AddressCheckResult | null>(null);
  const [checked, setChecked] = useState<{ address: string; analysis: AddressAnalysis } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleCheck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = address.trim();
    const invalid = addressInputError(target);
    if (invalid) {
      setResult(invalid);
      return;
    }

    setChecking(true);
    setResult(null);
    setChecked(null);
    try {
      const response = await fetch(`${GATE_URL}/v1/analyze`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tx: addressProbe(target) }),
      });
      if (!response.ok) throw new Error("The checker is unavailable right now. Please try again shortly.");

      const analysis: AddressAnalysis = await response.json();
      setResult(addressCheckResult(analysis));
      setChecked({ address: target, analysis });
    } catch (error) {
      setResult({ title: "Check unavailable", message: error instanceof Error ? error.message : "Please try again shortly." });
    } finally {
      setChecking(false);
    }
  }

  const resultStyle = result?.verdict === "block"
    ? "border-rose-400/50 bg-rose-950/40 text-rose-100"
    : result?.verdict === "warn"
      ? "border-amber-400/50 bg-amber-950/40 text-amber-100"
      : result?.verdict === "allow"
        ? "border-teal-400/50 bg-teal-950/40 text-teal-100"
        : "border-slate-500/50 bg-slate-900/85 text-slate-100";

  function checkAnother() {
    setAddress("");
    setResult(null);
    setChecked(null);
    inputRef.current?.focus();
  }

  function continueToDeepCheck() {
    if (!checked) return;
    try {
      sessionStorage.setItem("genesis_check_pending", JSON.stringify(addressCheckHandoff(checked.address, checked.analysis)));
    } catch {
      // The linked address still pre-fills /check if session storage is unavailable.
    }
  }

  return (
    <div className="w-full max-w-2xl border-t border-white/25 pt-5 sm:pt-6">
      <form onSubmit={handleCheck} className="flex flex-col overflow-hidden rounded-md border border-teal-300/50 bg-slate-950/85 shadow-[0_18px_48px_rgba(2,6,23,0.36)] focus-within:border-teal-200 sm:flex-row">
        <label htmlFor="home-address" className="sr-only">Wallet or contract address</label>
        <input
          id="home-address"
          ref={inputRef}
          value={address}
          onChange={(event) => { setAddress(event.target.value); setResult(null); setChecked(null); }}
          disabled={checking}
          placeholder="0x… wallet or contract address"
          autoComplete="off"
          spellCheck={false}
          className="min-h-14 min-w-0 flex-1 bg-transparent px-4 py-3 font-mono text-base text-white outline-none placeholder:font-sans placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-300/40 disabled:opacity-70 sm:px-5 sm:text-sm"
        />
        <button
          type="submit"
          disabled={checking}
          className="inline-flex min-h-14 items-center justify-center gap-2 border-t border-teal-300/50 bg-teal-300 px-6 font-bold text-slate-950 transition-colors hover:bg-teal-200 disabled:cursor-wait disabled:opacity-70 sm:border-l sm:border-t-0"
        >
          <Icon name="search" className="h-4 w-4" />
          {checking ? "Checking..." : "Check"}
        </button>
      </form>
      {result && (
        <div className={`mt-3 rounded-md border px-4 py-3 ${resultStyle}`}>
          <div role="status" aria-live="polite">
            <p className="text-sm font-bold">{result.title}</p>
            <p className="mt-1 text-sm leading-relaxed">{result.message}</p>
          </div>
          {result.signals && result.signals.length > 0 && (
            <details className="mt-3 border-t border-current/20 pt-2 text-xs">
              <summary className="w-fit cursor-pointer font-semibold">Why was it flagged?</summary>
              <ul className="mt-2 space-y-2">
                {result.signals.map((signal) => <li key={signal.title}><strong>{signal.title}:</strong> {signal.description}</li>)}
              </ul>
            </details>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-current/20 pt-3 text-sm font-bold">
            {checked && (
              <Link href={`/check?address=${encodeURIComponent(checked.address)}`} onClick={continueToDeepCheck} className="inline-flex items-center gap-1 underline underline-offset-4 hover:text-white">
                Continue to Deep check <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
            )}
            <button type="button" onClick={checkAnother} className="underline underline-offset-4 hover:text-white">Check another address</button>
          </div>
          {checked && <p className="mt-2 text-xs">Deep check costs 1 credit and requires wallet confirmation.</p>}
        </div>
      )}
      <p className="mt-4 text-xs font-medium text-slate-200">No sign-in <span aria-hidden="true" className="px-1 text-teal-300">·</span> No wallet connection <span aria-hidden="true" className="px-1 text-teal-300">·</span> No private keys</p>
      <details className="group mt-3 border-t border-white/15 pt-3 text-sm text-slate-200">
        <summary className="w-fit cursor-pointer list-none font-semibold text-teal-200 hover:text-teal-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 [&::-webkit-details-marker]:hidden">
          More about this check <span aria-hidden="true" className="inline-block transition-transform group-open:rotate-90">→</span>
        </summary>
        <div className="max-w-xl space-y-2 pt-3 text-sm leading-relaxed text-slate-200">
          <p>We compare an Ethereum-style address (starting with 0x) against available threat reports. Other wallet formats and names are not supported yet.</p>
          <p>No known reports does not mean an address or future transaction is safe. We process the address and basic request data to provide the check; some usage and security data may be retained. <a href="/privacy" className="font-semibold text-teal-200 underline underline-offset-4 hover:text-white">Privacy details</a></p>
          <a href="/threats" className="inline-flex font-semibold text-teal-200 underline underline-offset-4 hover:text-white">See live threats</a>
        </div>
      </details>
    </div>
  );
}