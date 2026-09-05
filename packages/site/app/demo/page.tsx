"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Genesis, withGenesisStyle } from "@/components/Genesis";

interface AnalyzeResponse {
  verdict: "allow" | "warn" | "block";
  score: number;
  summary: string;
  plainEnglish: string;
  findings: { id: string; severity: string; title: string; description: string }[];
  simulation: {
    approvals: unknown[];
    assetChanges: unknown[];
    method?: string;
  };
}

const scenarios = [
  {
    name: "Simple Token Transfer",
    desc: "Sending tokens to someone. Safe operation.",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    tx: {
      chainId: 1,
      from: "0x1111111111111111111111111111111111111111",
      to: "0x2222222222222222222222222222222222222222",
      data: "0xa9059cbb000000000000000000000000444444444444444444444444444444444444444400000000000000000000000000000000000000000000000000000000000003e8",
    },
  },
  {
    name: "Unlimited Approval",
    desc: "Giving an app permission to spend ALL your tokens. Risky!",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    tx: {
      chainId: 1,
      from: "0x1111111111111111111111111111111111111111",
      to: "0x2222222222222222222222222222222222222222",
      data: "0x095ea7b30000000000000000000000003333333333333333333333333333333333333333ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    },
  },
  {
    name: "NFT Collection Approval",
    desc: "Giving an app access to manage your entire NFT collection.",
    icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
    tx: {
      chainId: 1,
      from: "0x1111111111111111111111111111111111111111",
      to: "0x2222222222222222222222222222222222222222",
      data: "0xa22cb46500000000000000000000000033333333333333333333333333333333333333330000000000000000000000000000000000000000000000000000000000000001",
    },
  },
  {
    name: "Approve to Known Drainer",
    desc: "Approving to 0x000...dead, a known malicious address. GENESIS will block this!",
    icon: "M12 9v2m0 4v2m0 5v.01M7.08 6.24l1.41 1.41m2.83-2.83l1.41-1.41m4.24 4.24l1.41 1.41m2.83-2.83l1.41-1.41M7.08 17.76l1.41-1.41m2.83 2.83l1.41 1.41m4.24-4.24l1.41-1.41m2.83 2.83l1.41 1.41",
    tx: {
      chainId: 1,
      from: "0x1111111111111111111111111111111111111111",
      to: "0x2222222222222222222222222222222222222222",
      data: "0x095ea7b3000000000000000000000000000000000000000000000000000000000000deadffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    },
  },
];

export default function DemoPage() {
  const [response, setResponse] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gateUrl, setGateUrl] = useState(
    process.env.NEXT_PUBLIC_GATE_URL || "https://genesis-gate.onrender.com"
  );
  const [expandedHelp, setExpandedHelp] = useState<string | null>(null);

  const analyze = async (tx: unknown) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${gateUrl}/v1/analyze`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tx }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const verdictColor = {
    allow: "from-green-500 to-emerald-600",
    warn: "from-yellow-500 to-orange-600",
    block: "from-red-500 to-rose-600",
  };

  const verdictBgColor = {
    allow: "bg-green-50",
    warn: "bg-yellow-50",
    block: "bg-red-50",
  };

  const verdictTextColor = {
    allow: "text-green-900",
    warn: "text-yellow-900",
    block: "text-red-900",
  };

  const getRiskBarColor = (score: number) => {
    if (score < 33) return "bg-green-500";
    if (score < 66) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-5xl font-black text-white">Interactive Demo</h1>
        </div>
        <p className="text-slate-200 text-lg font-medium">
          Test <Genesis /> with sample transactions. Click a scenario to see how <Genesis /> analyzes it.
        </p>
      </div>

      {/* Configuration Card */}
      <div className="rounded-2xl backdrop-blur-xl bg-slate-900 border-2 border-teal-500/50 shadow-xl p-6 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-white">Gate Server URL</label>
            <button
              type="button"
              onClick={() => setExpandedHelp(expandedHelp === "gateUrl" ? null : "gateUrl")}
              className="text-teal-400 hover:text-teal-300 transition"
              title="What's the gate server?"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          {expandedHelp === "gateUrl" && (
            <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4 text-sm text-slate-200 space-y-3">
              <p><strong>What is it?</strong> The <Genesis /> Gate Server is the backend service that analyzes transactions. It decodes calldata, checks threats, and returns verdicts.</p>
              
              <p><strong>Default URL:</strong> This demo uses <code className="bg-slate-800 px-2 py-1 rounded text-teal-300 font-mono">https://genesis-gate.onrender.com</code> (production). For local testing, use <code className="bg-slate-800 px-2 py-1 rounded text-teal-300 font-mono">http://localhost:10000</code></p>
              
              <div>
                <p className="font-semibold text-slate-100 mb-2">To start the gate server (localhost):</p>
                <p className="bg-slate-800 px-3 py-2 rounded text-teal-300 font-mono text-xs break-all">
                  pnpm gate
                </p>
                <p className="text-xs text-slate-400 mt-2">Run this in a separate terminal from <code className="bg-slate-800 px-2 py-1 rounded text-teal-300">pnpm site dev</code></p>
              </div>

              <div>
                <p className="font-semibold text-slate-100 mb-2">Can I change the URL?</p>
                <p className="text-slate-300">Yes! If you're running <Genesis /> on a different server or port, update the URL here and it will use that instead.</p>
              </div>

              <div className="bg-slate-800/50 border border-slate-600 rounded p-3">
                <p className="text-xs font-bold text-yellow-300 mb-1">Common issue:</p>
                <p className="text-xs text-slate-300">"Connection failed" error? Make sure you ran <code className="bg-slate-800 px-1 py-0.5 rounded text-teal-300 font-mono">pnpm gate</code> in another terminal window, or check that the gate server is reachable.</p>
              </div>
            </div>
          )}

          <input
            type="text"
            value={gateUrl}
            onChange={(e) => setGateUrl(e.target.value)}
            className="w-full px-4 py-3 backdrop-blur-md bg-slate-800 border-2 border-teal-500/30 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-slate-400 transition font-mono"
            placeholder="https://genesis-gate.onrender.com"
          />
          <p className="text-xs text-slate-400">
            Click the <span className="text-teal-400">?</span> icon for help. Default: <code className="bg-slate-800 px-2 py-1 rounded text-teal-400 font-mono">https://genesis-gate.onrender.com</code>
          </p>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white">Sample Transactions</h2>
          <button
            type="button"
            onClick={() => setExpandedHelp(expandedHelp === "scenarios" ? null : "scenarios")}
            className="text-teal-400 hover:text-teal-300 transition"
            title="How do scenarios work?"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>

        {expandedHelp === "scenarios" && (
          <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4 text-sm text-slate-200 space-y-2">
            <p><strong>What are these?</strong> Pre-built sample transactions showing different real-world scenarios. Click "Run" on any scenario to see how <Genesis /> analyzes it.</p>
            <ul className="list-disc list-inside space-y-1 text-slate-300">
              <li><strong>Simple Token Transfer:</strong> A normal, safe transaction (ALLOW)</li>
              <li><strong>Unlimited Approval:</strong> Granting dangerous unlimited spending access (WARN)</li>
              <li><strong>NFT Collection Approval:</strong> Giving access to manage your whole NFT collection (WARN)</li>
              <li><strong>Approve to Known Drainer:</strong> Approving to a verified malicious address (BLOCK)</li>
            </ul>
            <p className="text-xs text-teal-300 pt-2">Use these to learn how <Genesis /> works before analyzing your own transactions.</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {scenarios.map((s, i) => (
            <button
              key={i}
              onClick={() => analyze(s.tx)}
              disabled={loading}
              className="text-left group relative overflow-hidden rounded-xl backdrop-blur-xl bg-slate-900 border-2 border-teal-500/30 hover:border-teal-400 hover:shadow-lg hover:shadow-teal-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed p-4"
            >
              <div className="relative">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-teal-400">Run →</span>
                </div>
                <p className="font-bold text-white group-hover:text-teal-300 transition">{s.name}</p>
                <p className="text-sm text-slate-400 mt-1">{withGenesisStyle(s.desc)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-xl backdrop-blur-xl bg-slate-900 border-l-4 border-red-500 border border-red-500/30 rounded-lg p-4">
          <div className="relative">
            <div className="flex items-start gap-3 mb-3">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className="font-bold text-red-300">Error</p>
            </div>
            <p className="text-sm text-red-200 mb-3">{error}</p>
            <p className="text-xs text-red-400 bg-red-500/20 backdrop-blur-md px-3 py-2 rounded inline-block">
              Make sure the gate is running: <code>pnpm gate</code>
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="rounded-xl backdrop-blur-xl bg-slate-900 border-2 border-teal-500/50 rounded-lg p-4 space-y-3">
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="animate-spin">
                <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-bold text-teal-300">Analyzing transaction...</p>
            </div>
            <div className="w-full bg-teal-900/50 h-2 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full animate-pulse" style={{ width: "60%" }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {response && (
        <div className="space-y-6">
          {/* Verdict Help Section */}
          <div className="flex items-center gap-2 pb-2">
            <h3 className="text-lg font-bold text-white">Analysis Result</h3>
            <button
              type="button"
              onClick={() => setExpandedHelp(expandedHelp === "verdict" ? null : "verdict")}
              className="text-teal-400 hover:text-teal-300 transition"
              title="What do these verdicts mean?"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          {expandedHelp === "verdict" && (
            <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4 text-sm text-slate-300 space-y-3">
              <div>
                <p className="font-semibold text-slate-300 flex items-center gap-2">
                  <Icon name="checkCircle" className="w-6 h-6 text-green-400" /> ALLOW (Safe)
                </p>
                <p className="text-slate-400 mt-1">Low risk. The transaction looks normal and safe to sign. No known threats detected.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-300 flex items-center gap-2">
                  <Icon name="warning" className="w-6 h-6 text-yellow-400" /> WARN (Caution)
                </p>
                <p className="text-slate-400 mt-1">Medium risk. Something unusual detected (risky permission, new contract, etc.). Review carefully before signing.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-300 flex items-center gap-2">
                  <Icon name="block" className="w-6 h-6 text-red-400" /> BLOCK (Danger)
                </p>
                <p className="text-slate-400 mt-1">High risk. Known scam, drainer, or exploit detected. <strong>DO NOT SIGN</strong>.</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-600 rounded p-3">
                <p className="text-xs font-bold text-slate-300 mb-1">Risk Score (0-100):</p>
                <p className="text-xs text-slate-400">0-33 = Safe, 33-66 = Caution, 66-100 = Danger. Higher scores mean more risk.</p>
              </div>
            </div>
          )}

          {/* Main Verdict Card */}
          <div
            className={`bg-gradient-to-br ${verdictColor[response.verdict]} text-white rounded-xl p-8 space-y-6 shadow-lg`}
          >
            <div className="grid md:grid-cols-2 gap-8">
              {/* Verdict */}
              <div>
                <p className="text-sm font-semibold opacity-90 mb-2">VERDICT</p>
                <p className="text-5xl font-bold">{response.verdict === "allow" ? <Icon name="checkCircle" className="w-12 h-12 text-white" /> : response.verdict === "warn" ? <Icon name="warning" className="w-12 h-12 text-white" /> : <Icon name="block" className="w-12 h-12 text-white" />}</p>
                <p className="text-3xl font-bold mt-2">{response.verdict.toUpperCase()}</p>
              </div>

              {/* Risk Score with Visual Bar */}
              <div>
                <p className="text-sm font-semibold opacity-90 mb-3">RISK SCORE</p>
                <div className="space-y-2">
                  <p className="text-4xl font-bold">{response.score}/100</p>
                  <div className="w-full bg-white/30 h-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getRiskBarColor(response.score)} transition-all duration-500`}
                      style={{ width: `${response.score}%` }}
                    ></div>
                  </div>
                  <p className="text-xs opacity-75">
                    {response.score < 33 && "Safe to sign"}
                    {response.score >= 33 && response.score < 66 && "Review before signing"}
                    {response.score >= 66 && "Do not sign"}
                  </p>
                </div>
              </div>
            </div>

            {/* Summary & Plain English */}
            <div className="space-y-3 border-t border-white/30 pt-6">
              <p className="text-sm font-semibold opacity-90">What this means:</p>
              <p className="text-lg leading-relaxed">{response.plainEnglish}</p>
              <p className="text-sm opacity-90 italic">{response.summary}</p>
            </div>
          </div>

          {/* Findings */}
          {response.findings.length > 0 && (
            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                  <Icon name="search" className="w-5 h-5 text-slate-700" /> Findings ({response.findings.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setExpandedHelp(expandedHelp === "findings" ? null : "findings")}
                  className="text-slate-600 hover:text-slate-800 transition"
                  title="What do these findings mean?"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>

              {expandedHelp === "findings" && (
                <div className="bg-slate-100 border border-slate-300 rounded-lg p-4 text-sm text-slate-700 space-y-2">
                  <p><strong>What are findings?</strong> Specific issues detected in the transaction. Each has a severity level:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    <li><strong>🔴 Critical:</strong> Major red flag. Very high confidence this is dangerous.</li>
                    <li><strong>🟠 High:</strong> Strong indication of risk. Highly suspicious pattern.</li>
                    <li><strong>🟡 Medium:</strong> Noteworthy issue. Not necessarily bad, but worth reviewing.</li>
                    <li><strong>🔵 Info:</strong> Informational. Just letting you know something interesting about the transaction.</li>
                  </ul>
                </div>
              )}

              <div className="space-y-3">
                {response.findings.map((f) => {
                  const severityColors = {
                    critical: "border-red-400 bg-red-50",
                    high: "border-orange-400 bg-orange-50",
                    medium: "border-yellow-400 bg-yellow-50",
                    info: "border-blue-400 bg-blue-50",
                  };
                  const severityEmoji = {
                    critical: "🔴",
                    high: "🟠",
                    medium: "🟡",
                    info: "🔵",
                  };
                  const color = severityColors[f.severity as keyof typeof severityColors] || "border-slate-400 bg-slate-50";
                  const emoji = severityEmoji[f.severity as keyof typeof severityEmoji] || "⚪";

                  return (
                    <div key={f.id} className={`border-l-4 p-4 rounded-lg ${color}`}>
                      <p className="font-semibold text-slate-900">
                        {emoji} {f.severity.toUpperCase()}  -  {f.title}
                      </p>
                      <p className="text-sm text-slate-700 mt-2">{f.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Simulation Details (Collapsible) */}
          <details className="bg-white rounded-xl border-2 border-slate-200 p-6 group">
            <summary className="font-bold text-slate-900 cursor-pointer flex items-center gap-2 group-open:text-blue-600">
              <span className="group-open:rotate-180 inline-block transition">▶</span>
              🔬 Detailed Analysis (for developers)
            </summary>
            <div className="mt-4 space-y-3 pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-600 font-mono bg-slate-50 p-3 rounded whitespace-pre-wrap overflow-auto max-h-96">
                {JSON.stringify(response.simulation, null, 2)}
              </p>
            </div>
          </details>

          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setResponse(null)}
              className="px-6 py-3 bg-slate-200 text-slate-900 rounded-lg font-medium hover:bg-slate-300 transition"
            >
              Clear Results
            </button>
            <a
              href="/threats"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              View Threat Feed →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
