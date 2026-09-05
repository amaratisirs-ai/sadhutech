"use client";

import { useState } from "react";

const GATE_URL = process.env.NEXT_PUBLIC_GATE_URL || "https://genesis-gate.onrender.com";

const SCENARIOS: Record<string, string> = {
  "Safe transfer": JSON.stringify(
    { tx: { chainId: 1, from: "0x1111111111111111111111111111111111111111", to: "0x2222222222222222222222222222222222222222", value: "1000000000000000000", data: "0x" } },
    null,
    2
  ),
  "Unlimited approval": JSON.stringify(
    {
      tx: {
        chainId: 1,
        from: "0x1111111111111111111111111111111111111111",
        to: "0x2222222222222222222222222222222222222222",
        value: "0",
        data: "0x095ea7b30000000000000000000000003333333333333333333333333333333333333333ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      },
    },
    null,
    2
  ),
  "Known drainer": JSON.stringify(
    {
      tx: {
        chainId: 1,
        from: "0x1111111111111111111111111111111111111111",
        to: "0x2222222222222222222222222222222222222222",
        value: "0",
        data: "0x095ea7b3000000000000000000000000000000000000000000000000000000000000deadffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      },
    },
    null,
    2
  ),
};

export function DeveloperTryIt() {
  const [request, setRequest] = useState(SCENARIOS["Unlimited approval"]);
  const [response, setResponse] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  const send = async () => {
    setStatus("loading");
    setResponse("");
    try {
      const body = JSON.parse(request);
      const res = await fetch(`${GATE_URL}/v1/analyze`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      setResponse(text);
      setStatus(res.ok ? "ok" : "error");
    } catch (e) {
      setResponse(e instanceof Error ? e.message : "Request failed");
      setStatus("error");
    }
  };

  return (
    <div id="try-it" className="rounded-xl border border-slate-700 bg-slate-900 overflow-hidden scroll-mt-24">
      <div className="border-b border-slate-700 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-bold text-white">Try it live</span>
        <div className="flex flex-wrap gap-2">
          {Object.keys(SCENARIOS).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                setRequest(SCENARIOS[name]);
                setResponse("");
                setStatus("idle");
              }}
              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 border border-slate-600 text-slate-300 hover:border-teal-400 hover:text-white transition"
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-700">
        <div className="p-5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">POST /v1/analyze</p>
          <textarea
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            spellCheck={false}
            className="w-full h-64 rounded-lg bg-slate-950 border border-slate-700 focus:border-teal-400 p-3 font-mono text-xs text-teal-200 outline-none resize-none"
          />
          <button
            onClick={send}
            disabled={status === "loading"}
            className="px-5 py-2.5 rounded-lg bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 disabled:opacity-50 transition"
          >
            {status === "loading" ? "Sending…" : "Send request"}
          </button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Response</p>
          <pre
            className={`w-full h-64 overflow-auto rounded-lg bg-slate-950 border p-3 font-mono text-xs whitespace-pre-wrap ${
              status === "error" ? "border-rose-600 text-rose-300" : "border-slate-700 text-emerald-200"
            }`}
          >
            {response || "// Response will appear here"}
          </pre>
        </div>
      </div>
    </div>
  );
}
