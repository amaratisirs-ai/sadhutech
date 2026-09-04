"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { resolveDecisionOutcome } from "../../src/decision";

function APIExplorerContent() {
  const searchParams = useSearchParams();
  // Configurable for local dev via env, but not exposed in the UI (adds no user value).
  const gateUrl = process.env.NEXT_PUBLIC_GATE_URL || "https://genesis-gate.onrender.com";
  const [connectedWallet, setConnectedWallet] = useState<{ wallet: string; account: string; chainId: number } | null>(null);
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
  const [decision, setDecision] = useState<ReturnType<typeof resolveDecisionOutcome> | null>(null);
  const [signatureState, setSignatureState] = useState<"idle" | "ready" | "signed">("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"editor" | "docs">("editor");

  useEffect(() => {
    const wallet = searchParams.get("wallet");
    const account = searchParams.get("account");
    const chainId = Number(searchParams.get("chainId") ?? "1");

    const stored = typeof window !== "undefined" ? localStorage.getItem("genesis_wallet_session") : null;
    const parsedStored = stored ? JSON.parse(stored) : null;

    const finalWallet = wallet || parsedStored?.wallet || "WalletConnect";
    const finalAccount = account || parsedStored?.account || "";
    const finalChainId = Number(chainId || parsedStored?.chainId || 1);
    const finalStatus = parsedStored?.status || "connected";

    if (finalAccount && finalStatus === "connected") {
      setConnectedWallet({ wallet: finalWallet, account: finalAccount, chainId: finalChainId });
      setRequest(
        JSON.stringify(
          {
            tx: {
              chainId: finalChainId,
              from: finalAccount,
              to: "0x2222222222222222222222222222222222222222",
              data: "0x095ea7b30000000000000000000000003333333333333333333333333333333333333333ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
            },
          },
          null,
          2
        )
      );
      setResponse("");
      setError("");
      return;
    }

    if (parsedStored && parsedStored.status === "pending") {
      if (parsedStored.account) {
        setConnectedWallet({ wallet: finalWallet, account: parsedStored.account, chainId: finalChainId });
        setRequest(
          JSON.stringify(
            {
              tx: {
                chainId: finalChainId,
                from: parsedStored.account,
                to: "0x2222222222222222222222222222222222222222",
                data: "0x095ea7b30000000000000000000000003333333333333333333333333333333333333333ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
              },
            },
            null,
            2
          )
        );
        setResponse("");
        setError("");
        return;
      }

      setConnectedWallet(null);
      setError("Wallet approval is still pending. Please return to your wallet and approve the connection, then come back here.");
      return;
    }

    setConnectedWallet(null);
    setError("No wallet session detected. Connect a wallet first to continue to the transaction check.");
  }, [searchParams]);

  const handleDisconnect = () => {
    localStorage.removeItem("genesis_wallet_session");
    setConnectedWallet(null);
    setDecision(null);
    setSignatureState("idle");
    setResponse("");
    // Route through the connect page so the live WalletConnect session is torn down too.
    window.location.href = "/wallet-connect?change=1&disconnect=1";
  };

  const applyConnectedWalletToRequest = () => {
    if (!connectedWallet) {
      setError("Connect a wallet before sending a transaction for review.");
      return;
    }

    try {
      const parsed = JSON.parse(request);
      const nextRequest = {
        ...parsed,
        tx: {
          ...(parsed.tx ?? {}),
          chainId: connectedWallet.chainId,
          from: connectedWallet.account,
        },
      };
      setRequest(JSON.stringify(nextRequest, null, 2));
      setError("");
      setResponse("");
    } catch {
      setError("The current request JSON is invalid. Fix the transaction payload and try again.");
    }
  };

  const send = async () => {
    setLoading(true);
    setError("");
    setResponse("");
    try {
      const body = JSON.parse(request);
      if (!body?.tx?.from && connectedWallet) {
        body.tx = { ...(body.tx ?? {}), from: connectedWallet.account, chainId: connectedWallet.chainId };
      }
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
      const nextDecision = resolveDecisionOutcome(data);
      setDecision(nextDecision);
      setSignatureState(nextDecision.canContinue ? "ready" : "idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setDecision(null);
      setSignatureState("idle");
    } finally {
      setLoading(false);
    }
  };

  const loadScenario = (scenario: any) => {
    const scenarioWithWallet = connectedWallet
      ? {
          ...scenario,
          tx: {
            ...(scenario.tx ?? {}),
            chainId: connectedWallet.chainId,
            from: connectedWallet.account,
          },
        }
      : scenario;
    setRequest(JSON.stringify(scenarioWithWallet, null, 2));
    setResponse("");
    setDecision(null);
    setSignatureState("idle");
    setError("");
  };

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-5xl font-black text-white mb-4">🔒 Transaction Review</h1>
        <p className="text-slate-300 text-lg">
          Connect your wallet, review the transaction, and let GENESIS check it before signing.
        </p>
      </div>

      <div className="bg-gradient-to-r from-indigo-900/40 to-slate-900 border-2 border-indigo-500/40 rounded-xl p-5 space-y-3">
        <p className="text-xs uppercase tracking-wide text-indigo-300 font-semibold">Real flow</p>
        <div className="grid md:grid-cols-3 gap-3 text-sm text-slate-200">
          <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-3">
            <span className="font-bold text-white">1. Connect wallet</span>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-3">
            <span className="font-bold text-white">2. Send tx to GENESIS</span>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-3">
            <span className="font-bold text-white">3. Sign only after the verdict</span>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-emerald-900/40 to-slate-900 border-2 border-emerald-500/50 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-300 font-semibold">Connected wallet</p>
            <h2 className="text-2xl font-bold text-white">{connectedWallet ? connectedWallet.wallet : "No wallet connected"}</h2>
          </div>
          {connectedWallet ? (
            <div className="flex gap-2 flex-wrap">
              <a href="/wallet-connect?change=1" className="px-4 py-2 rounded-lg border border-emerald-500/50 text-emerald-100 bg-emerald-500/10 hover:bg-emerald-500/20 transition text-sm font-semibold">
                Change wallet
              </a>
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-4 py-2 rounded-lg border border-rose-500/50 text-rose-100 bg-rose-500/10 hover:bg-rose-500/20 transition text-sm font-semibold"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <a href="/wallet-connect" className="px-4 py-2 rounded-lg border border-slate-500 text-slate-100 bg-slate-800 hover:bg-slate-700 transition text-sm font-semibold">
              Connect wallet
            </a>
          )}
        </div>

        {connectedWallet ? (
          <div className="grid md:grid-cols-3 gap-3 text-sm text-emerald-100">
            <div className="bg-black/10 border border-emerald-500/30 rounded-lg p-3">
              <p className="text-emerald-300 text-xs uppercase">Account</p>
              <p className="font-mono break-all mt-1">{connectedWallet.account}</p>
            </div>
            <div className="bg-black/10 border border-emerald-500/30 rounded-lg p-3">
              <p className="text-emerald-300 text-xs uppercase">Chain</p>
              <p className="mt-1">{connectedWallet.chainId === 1 ? "Ethereum" : `Chain ${connectedWallet.chainId}`}</p>
            </div>
            <div className="bg-black/10 border border-emerald-500/30 rounded-lg p-3">
              <p className="text-emerald-300 text-xs uppercase">Next step</p>
              <p className="mt-1">Analyze the transaction before signing</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-300">Connect a wallet to prefill the request and test a real transaction against GENESIS.</p>
        )}
      </div>

      {connectedWallet && (
        <div className="bg-teal-900/20 border border-teal-500/40 rounded-xl p-4 text-sm text-teal-100">
          <p className="font-semibold text-white">Wallet ready for a transaction check.</p>
          <p className="mt-1 text-teal-200">The connected account is being used as the sender for transaction review, so you can test a real wallet-to-signing flow without leaving the browser.</p>
        </div>
      )}

      {decision && (
        <div
          className={`rounded-xl border p-5 ${
            decision.verdict === "allow"
              ? "border-emerald-500/50 bg-emerald-900/20"
              : decision.verdict === "block"
                ? "border-rose-500/50 bg-rose-900/20"
                : "border-amber-500/50 bg-amber-900/20"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-300">Current verdict</p>
              <h3 className="text-2xl font-black text-white">{decision.label}</h3>
            </div>
            <div className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-100">
              {decision.verdict}
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-200">{decision.reason}</p>

          <div className="mt-4 flex flex-wrap gap-3">
            {decision.canContinue ? (
              <button
                onClick={() => setSignatureState("signed")}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500 transition"
              >
                {signatureState === "signed" ? "Transaction approved" : "Continue to sign"}
              </button>
            ) : (
              <button
                disabled
                className="cursor-not-allowed rounded-lg bg-slate-700 px-4 py-2 text-sm font-bold text-slate-300"
              >
                Review before signing
              </button>
            )}
            <button
              onClick={() => setResponse("")}
              className="rounded-lg border border-slate-500 bg-slate-800 px-4 py-2 text-sm font-bold text-slate-100 hover:bg-slate-700 transition"
            >
              Hide result
            </button>
          </div>

          {signatureState === "signed" && (
            <div className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">
              GENESIS verdict approved the transaction. The wallet can proceed to the final sign step when the user confirms in the wallet.
            </div>
          )}
        </div>
      )}

      {!connectedWallet && (
        <div className="bg-amber-900/20 border border-amber-500/40 rounded-xl p-4 text-sm text-amber-100">
          <p className="font-semibold text-white">Wallet connection still pending.</p>
          <p className="mt-1 text-amber-200">If you just approved your wallet, return to this tab and continue. If not, connect a wallet first to begin the transaction check.</p>
          <div className="mt-3">
            <a href="/wallet-connect" className="inline-block px-4 py-2 rounded-lg bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400 transition">
              Go back to wallet connection
            </a>
          </div>
        </div>
      )}

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
          <div className="flex flex-wrap gap-3">
            {connectedWallet && (
              <button
                onClick={applyConnectedWalletToRequest}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition"
              >
                Use connected wallet as sender
              </button>
            )}
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
                    from: connectedWallet?.account ?? "",
                    to: "",
                    data: "0x",
                  },
                }, null, 2));
                setResponse("");
                setDecision(null);
                setSignatureState("idle");
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
const res = await fetch("https://genesis-gate.onrender.com/v1/analyze", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ tx })
});
const verdict = await res.json();`}</pre>
              </div>
              <div>
                <p className="font-bold text-slate-900 mb-2">cURL</p>
                <pre className="bg-slate-800 text-slate-100 p-3 rounded text-xs font-mono overflow-auto max-h-32">{`curl -X POST https://genesis-gate.onrender.com/v1/analyze \\
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

export default function APIExplorerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-300">Loading transaction check…</div>}>
      <APIExplorerContent />
    </Suspense>
  );
}
