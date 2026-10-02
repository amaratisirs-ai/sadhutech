"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "@/components/Icon";
import { addressCheckResult, addressInputError, type AddressCheckResult } from "@/src/address-check";

const GATE_URL = process.env.NEXT_PUBLIC_GATE_URL || "https://genesis-gate.onrender.com";
const PROBE_FROM = "0x1111111111111111111111111111111111111111";

export default function HomeAddressCheck() {
  const [address, setAddress] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<AddressCheckResult | null>(null);

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
    try {
      const response = await fetch(`${GATE_URL}/v1/analyze`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tx: { chainId: 1, from: PROBE_FROM, to: target, value: "1", data: "0x" } }),
      });
      if (!response.ok) throw new Error("The checker is unavailable right now. Please try again shortly.");

      const analysis = await response.json();
      setResult(addressCheckResult(analysis));
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

  return (
    <div className="w-full max-w-2xl border-t border-teal-300/50 pt-4 sm:pt-5">
      <h2 className="mb-3 text-base font-bold text-white sm:text-lg">Check an address</h2>
      <form onSubmit={handleCheck} className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="home-address" className="sr-only">Wallet or contract address</label>
        <input
          id="home-address"
          value={address}
          onChange={(event) => { setAddress(event.target.value); setResult(null); }}
          disabled={checking}
          placeholder="Paste an address starting with 0x"
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-md border border-white/30 bg-slate-950/80 px-4 py-3 font-mono text-sm text-white outline-none placeholder:font-sans placeholder:text-slate-400 focus:border-teal-300 focus:ring-2 focus:ring-teal-300/25 disabled:opacity-70"
        />
        <button
          type="submit"
          disabled={checking}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-teal-300 px-5 font-bold text-slate-950 transition-colors hover:bg-teal-200 disabled:cursor-wait disabled:opacity-70"
        >
          <Icon name="search" className="h-4 w-4" />
          {checking ? "Checking..." : "Check address"}
        </button>
      </form>
      {result && (
        <div role="status" aria-live="polite" className={`mt-3 rounded-md border px-4 py-3 ${resultStyle}`}>
          <p className="text-sm font-bold">{result.title}</p>
          <p className="mt-1 text-sm leading-relaxed">{result.message}</p>
        </div>
      )}
      <p className="mt-3 text-xs font-medium text-slate-200">No sign-in <span aria-hidden="true" className="px-1 text-teal-300">·</span> No wallet connection <span aria-hidden="true" className="px-1 text-teal-300">·</span> No private keys</p>
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