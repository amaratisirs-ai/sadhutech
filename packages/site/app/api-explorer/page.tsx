"use client";

import { useState } from "react";

export default function APIExplorerPage() {
  const [gateUrl, setGateUrl] = useState("http://localhost:8787");
  const [request, setRequest] = useState(
    JSON.stringify(
      {
        tx: {
          chainId: 1,
          from: "0x1111111111111111111111111111111111111111",
          to: "0x2222222222222222222222222222222222222222",
          data: "0x095ea7b30000000000000000000000003333333333333333333333333333333333333333ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        },
      },
      null,
      2
    )
  );
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"editor" | "docs">("editor");

  const send = async () => {
    setLoading(true);
    setError("");
    setResponse("");
    try {
      const body = JSON.parse(request);
      const res = await fetch(`${gateUrl}/v1/analyze`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorData}`);
      }

      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const loadScenario = (scenario: any) => {
    setRequest(JSON.stringify(scenario, null, 2));
    setResponse("");
  };

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-5xl font-black text-white mb-4">🔌 API Explorer</h1>
        <p className="text-slate-400 text-lg">
          Interactive HTTP client to test GENESIS Gate endpoints. Perfect for developers and integrations.
        </p>
      </div>

      {/* Gate URL Config */}
      <div className="bg-slate-900 rounded-lg border-2 border-teal-500/50 p-6 space-y-3">
        <label className="block text-sm font-bold text-white">Gate Server URL</label>
        <input
          type="text"
          value={gateUrl}
          onChange={(e) => setGateUrl(e.target.value)}
          className="w-full px-4 py-3 border-2 border-teal-500/30 bg-slate-800 rounded-lg text-sm font-mono focus:border-teal-400 focus:ring-2 focus:ring-teal-500/30 text-white"
        />
        <p className="text-xs text-slate-400">
          💡 Development: <code className="bg-slate-800 px-2 py-1 rounded text-teal-400">http://localhost:8787</code>
          <br />
          Production: <code className="bg-slate-800 px-2 py-1 rounded text-teal-400">https://genesis-gate.onrender.com</code>
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b-2 border-slate-700">
        <button
          onClick={() => setActiveTab("editor")}
          className={`px-6 py-3 font-bold transition ${
            activeTab === "editor"
              ? "border-b-2 border-teal-500 text-teal-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          ✏️ Request Editor
        </button>
        <button
          onClick={() => setActiveTab("docs")}
          className={`px-6 py-3 font-bold transition ${
            activeTab === "docs"
              ? "border-b-2 border-teal-500 text-teal-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          📚 API Docs
        </button>
      </div>

      {/* Editor Tab */}
      {activeTab === "editor" && (
        <div className="space-y-6">
          {/* Quick Scenarios */}
          <div className="space-y-3">
            <p className="text-sm font-bold text-slate-900">⚡ Quick Test Scenarios:</p>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                {
                  name: "Safe Transfer",
                  desc: "Benign ERC-20 transfer",
                  tx: {
                    tx: {
                      chainId: 1,
                      from: "0x1111111111111111111111111111111111111111",
                      to: "0x2222222222222222222222222222222222222222",
                      data: "0xa9059cbb000000000000000000000000444444444444444444444444444444444444444400000000000000000000000000000000000000000000000000000000000003e8",
                    },
                  },
                },
                {
                  name: "Unlimited Approval",
                  desc: "Risky full permission grant",
                  tx: {
                    tx: {
                      chainId: 1,
                      from: "0x1111111111111111111111111111111111111111",
                      to: "0x2222222222222222222222222222222222222222",
                      data: "0x095ea7b30000000000000000000000003333333333333333333333333333333333333333ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
                    },
                  },
                },
                {
                  name: "NFT Approval",
                  desc: "setApprovalForAll for collection",
                  tx: {
                    tx: {
                      chainId: 1,
                      from: "0x1111111111111111111111111111111111111111",
                      to: "0x2222222222222222222222222222222222222222",
                      data: "0xa22cb46500000000000000000000000033333333333333333333333333333333333333330000000000000000000000000000000000000000000000000000000000000001",
                    },
                  },
                },
                {
                  name: "Known Drainer",
                  desc: "Approval to malicious address",
                  tx: {
                    tx: {
                      chainId: 1,
                      from: "0x1111111111111111111111111111111111111111",
                      to: "0x2222222222222222222222222222222222222222",
                      data: "0x095ea7b3000000000000000000000000000000000000000000000000000000000000deadffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
                    },
                  },
                },
              ].map((scenario) => (
                <button
                  key={scenario.name}
                  onClick={() => loadScenario(scenario.tx)}
                  className="text-left bg-white border-2 border-slate-200 hover:border-blue-300 hover:shadow-md rounded-lg p-3 transition"
                >
                  <p className="font-semibold text-slate-900 text-sm">{scenario.name}</p>
                  <p className="text-xs text-slate-600 mt-1">{scenario.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Two-Column Editor */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Request */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900">📤 Request Body</h3>
              <div className="bg-white rounded-lg border-2 border-slate-200 overflow-hidden">
                <div className="bg-indigo-50 px-4 py-2 border-b border-slate-200 text-xs font-mono text-slate-900 font-bold">
                  POST {gateUrl}/v1/analyze
                </div>
                <textarea
                  value={request}
                  onChange={(e) => setRequest(e.target.value)}
                  className="w-full p-4 font-mono text-xs resize-none focus:outline-none h-96 bg-white text-slate-900 placeholder-slate-400"
                  placeholder="Paste your transaction JSON here..."
                />
              </div>
            </div>

            {/* Response */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900">📥 Response</h3>
              <div className="bg-white rounded-lg border-2 border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-xs font-medium text-slate-900 font-bold flex justify-between items-center">
                  <span>Response Output</span>
                  {loading && <span className="text-blue-600 animate-spin">⟳</span>}
                </div>
                <div className="p-4 font-mono text-xs whitespace-pre-wrap break-all h-96 overflow-auto bg-white">
                  {error ? (
                    <span className="text-red-600">
                      ❌ {error}
                    </span>
                  ) : response ? (
                    <span className="text-green-600">{response}</span>
                  ) : (
                    <span className="text-slate-400">Response will appear here...</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={send}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 transition"
            >
              {loading ? "⏳ Sending..." : "🚀 Send Request"}
            </button>
            <button
              onClick={() => {
                setRequest(JSON.stringify({
                  tx: {
                    chainId: 1,
                    from: "",
                    to: "",
                    data: "0x",
                  },
                }, null, 2));
                setResponse("");
                setError("");
              }}
              className="px-8 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg font-semibold transition"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Docs Tab */}
      {activeTab === "docs" && (
        <div className="space-y-8">
          {/* POST /v1/analyze */}
          <div className="bg-white rounded-lg border-2 border-slate-200 p-6 space-y-4">
            <div>
              <p className="text-sm font-semibold text-indigo-600 uppercase mb-1">Main Endpoint</p>
              <h3 className="text-2xl font-bold text-slate-900">POST /v1/analyze</h3>
              <p className="text-slate-700 mt-2 font-medium">Analyze a transaction and receive a risk assessment with verdict and findings.</p>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-200">
              {/* Request */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">📤 Request Parameters</h4>
                <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm font-mono">
                  <p><span className="text-blue-700 font-bold">tx</span> (required) — Transaction object</p>
                  <div className="ml-4 space-y-1 text-slate-800">
                    <p><span className="text-slate-900">chainId</span>: number — EIP-155 chain ID (1=mainnet)</p>
                    <p><span className="text-slate-900">from</span>: string — Sender address (0x...)</p>
                    <p><span className="text-slate-900">to</span>: string — Target contract address</p>
                    <p><span className="text-slate-900">data</span>: string — Encoded calldata (0x...)</p>
                    <p><span className="text-slate-900">value</span>: string — ETH amount in wei (optional)</p>
                  </div>
                </div>
              </div>

              {/* Response */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">📥 Response Fields</h4>
                <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm font-mono">
                  <p><span className="text-green-700 font-bold">verdict</span>: "allow" | "warn" | "block"</p>
                  <p><span className="text-green-700 font-bold">score</span>: number — Risk score (0-100)</p>
                  <p><span className="text-green-700 font-bold">plainEnglish</span>: string — User-friendly explanation</p>
                  <p><span className="text-green-700 font-bold">findings</span>: Finding[] — Detailed findings with severity</p>
                  <p><span className="text-green-700 font-bold">simulation</span>: object — Decoded transaction details</p>
                </div>
              </div>

              {/* Example */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">💡 Example Response</h4>
                <div className="bg-slate-800 p-4 rounded-lg text-xs font-mono overflow-auto max-h-64 text-slate-100">
                  <pre className="text-slate-100">{`{
  "verdict": "warn",
  "score": 65,
  "summary": "Unlimited approval granted",
  "plainEnglish": "You're giving this contract permission to spend ALL your tokens. Make sure you trust it.",
  "findings": [
    {
      "id": "unlimited-approval",
      "severity": "high",
      "title": "Unlimited Approval",
      "description": "Detected approve() with max uint256"
    }
  ],
  "simulation": {
    "approvals": [{"spender": "0x...", "amount": "115792..."}],
    "method": "approve",
    "heuristic": true
  }
}`}</pre>
                </div>
              </div>
            </div>
          </div>

          {/* Health & Report Endpoints */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border-2 border-slate-200 p-6">
              <h4 className="font-bold text-slate-900 mb-3">GET /health</h4>
              <p className="text-sm text-slate-700 font-medium mb-3">Check if gate is running and ready.</p>
              <div className="bg-slate-800 p-3 rounded text-xs font-mono text-slate-100">
                <p className="text-slate-300">GET /health</p>
                <p className="mt-2 text-green-400">{"{ \"status\": \"ok\" }"}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg border-2 border-slate-200 p-6">
              <h4 className="font-bold text-slate-900 mb-3">POST /v1/report</h4>
              <p className="text-sm text-slate-700 font-medium mb-3">Report a malicious address (advanced).</p>
              <div className="bg-slate-800 p-3 rounded text-xs font-mono text-slate-100">
                <p className="text-orange-400">{"{ \"address\": \"0x...\", \"category\": \"drainer\" }"}</p>
              </div>
            </div>
          </div>

          {/* Integration Guide */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200 p-6 space-y-4">
            <h4 className="font-bold text-slate-900 mb-3">🔗 Integration Patterns</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="font-bold text-slate-900 mb-2">JavaScript/Web</p>
                <pre className="bg-slate-800 text-slate-100 p-3 rounded text-xs font-mono overflow-auto max-h-32">{`const tx = { chainId: 1, from: "...", to: "...", data: "0x..." };
const res = await fetch("http://localhost:8787/v1/analyze", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ tx })
});
const verdict = await res.json();`}</pre>
              </div>
              <div>
                <p className="font-bold text-slate-900 mb-2">cURL</p>
                <pre className="bg-slate-800 text-slate-100 p-3 rounded text-xs font-mono overflow-auto max-h-32">{`curl -X POST http://localhost:8787/v1/analyze \\
  -H "content-type: application/json" \\
  -d '{"tx":{"chainId":1,"from":"0x...","to":"0x...","data":"0x..."}}'`}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
