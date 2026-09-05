"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Genesis } from "@/components/Genesis";

export default function PostPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    walletAddress: "",
    calldata: "",
    chainId: "1",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedHelp, setExpandedHelp] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!formData.walletAddress || !formData.calldata) {
        setError("Please fill in all required fields");
        setLoading(false);
        return;
      }

      // Call the gate API (production URL)
      const gateUrl = process.env.NEXT_PUBLIC_GATE_URL || "https://genesis-gate.onrender.com";
      const response = await fetch(`${gateUrl}/v1/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: formData.walletAddress,
          data: formData.calldata,
          chainId: parseInt(formData.chainId),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze transaction");
      }

      const result = await response.json();

      // Store result and redirect to response page
      sessionStorage.setItem("analysisResult", JSON.stringify(result));
      sessionStorage.setItem("submittedData", JSON.stringify(formData));
      router.push("/response");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="space-y-6">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-black text-white">
            Is This Transaction Safe?
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl">
            Unsure about a transaction you're about to sign? Copy the details from your wallet and paste them here. 
            <Genesis /> will check it against known scams and give you a clear verdict in seconds.
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Wallet Address */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-bold text-white">
                Your Wallet Address <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setExpandedHelp(expandedHelp === "wallet" ? null : "wallet")}
                className="text-teal-400 hover:text-teal-300 transition"
                title="What's a wallet address?"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
            
            {expandedHelp === "wallet" && (
              <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4 text-sm text-slate-300 space-y-2">
                <p><strong>What is it?</strong> Your wallet address is the account sending the transaction (starts with 0x).</p>
                <p><strong>Where to find it:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>MetaMask: Click the account icon (top-right) → Your address is shown</li>
                  <li>Trust Wallet: Open the wallet → Address shown at top</li>
                  <li>Coinbase Wallet: Settings → Account → Copy address</li>
                  <li>Hardware Wallet: Use your wallet interface to view address</li>
                </ul>
              </div>
            )}

            <input
              type="text"
              name="walletAddress"
              value={formData.walletAddress}
              onChange={handleChange}
              placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f42bE"
              className="w-full px-4 py-3 bg-slate-900 border-2 border-teal-500/30 rounded-lg text-white placeholder:text-slate-500 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 outline-none transition font-mono text-sm"
            />
            <p className="text-xs text-slate-400">Your address starts with 0x and is 42 characters long</p>
          </div>

          {/* Calldata */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-bold text-white">
                Transaction Data <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setExpandedHelp(expandedHelp === "calldata" ? null : "calldata")}
                className="text-teal-400 hover:text-teal-300 transition"
                title="What's transaction data?"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>

            {expandedHelp === "calldata" && (
              <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4 text-sm text-slate-300 space-y-3">
                <p><strong>What is it?</strong> This is the secret code that tells the blockchain what your transaction will actually do. Most wallets hide this from you  -  but we decode it so you can see what you're really signing.</p>
                
                <p><strong>What it looks like:</strong> A string of letters and numbers starting with 0x, like:</p>
                <p className="font-mono text-xs bg-slate-800 p-2 rounded text-slate-200 break-all">
                  0xa9059cbb000000000000000000000000...
                </p>

                <p><strong>How to find it in your wallet:</strong></p>
                <div className="space-y-2 text-slate-400">
                  <div>
                    <p className="font-semibold text-slate-300">MetaMask:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>When you see the "Sign Transaction" pop-up</li>
                      <li>Click <strong>"Data"</strong> tab (or "Hex Data")</li>
                      <li>Copy the long string that starts with 0x</li>
                    </ol>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-300">Trust Wallet / Others:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Look for "Data" or "Hex" field in the signing prompt</li>
                      <li>Long press or tap to select and copy</li>
                    </ol>
                  </div>
                </div>

                <p className="text-xs italic text-slate-400">Can't find it? Try the interactive demo below with example data.</p>
              </div>
            )}

            <textarea
              name="calldata"
              value={formData.calldata}
              onChange={(e) => setFormData({ ...formData, calldata: e.target.value })}
              placeholder="0xa9059cbb000000000000000000000000..."
              rows={6}
              className="w-full px-4 py-3 bg-slate-900 border-2 border-teal-500/30 rounded-lg text-white placeholder:text-slate-500 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 outline-none transition font-mono text-sm"
            />
            <p className="text-xs text-slate-400">Paste the full transaction data (starts with 0x)</p>
          </div>

          {/* Chain ID */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-bold text-white">
                Which Network? <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setExpandedHelp(expandedHelp === "network" ? null : "network")}
                className="text-teal-400 hover:text-teal-300 transition"
                title="What's a network?"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>

            {expandedHelp === "network" && (
              <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4 text-sm text-slate-300 space-y-2">
                <p><strong>What is it?</strong> The blockchain network where you're sending the transaction.</p>
                <p><strong>How to find it:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>MetaMask: Look at the top of the wallet window</li>
                  <li>Your wallet will show which network is selected (e.g., "Ethereum Mainnet")</li>
                  <li>Make sure you select the SAME network here as in your wallet</li>
                </ul>
              </div>
            )}

            <select
              name="chainId"
              value={formData.chainId}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-900 border-2 border-teal-500/30 rounded-lg text-white focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
            >
              <option value="1">Ethereum (Mainnet)</option>
              <option value="137">Polygon (Faster, cheaper)</option>
              <option value="8453">Base (Ethereum layer)</option>
              <option value="42161">Arbitrum (Ethereum layer)</option>
              <option value="10">Optimism (Ethereum layer)</option>
            </select>
            <p className="text-xs text-slate-400">Select the network you're using in your wallet</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border-l-4 border-red-500 rounded-lg">
              <p className="text-sm text-red-300"><strong>Error:</strong> {error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-teal-500 text-white font-bold rounded-lg hover:bg-teal-600 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-teal-500/25"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Checking...
                </span>
              ) : (
                "Check This Transaction"
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="px-8 py-4 bg-slate-800 text-slate-300 font-bold rounded-lg hover:bg-slate-700 border-2 border-slate-600 transition-all"
            >
              Back Home
            </button>
          </div>
        </form>

        {/* Help Section */}
        <div className="mt-12 p-6 bg-gradient-to-br from-slate-900 to-indigo-900/30 border-2 border-indigo-500/30 rounded-xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0m-5.657 5.657l-.707.707M9 19.071V20m0-6.071v.071M5.318 13.851A8.957 8.957 0 0112 15a8.957 8.957 0 016.682-1.15" />
            </svg>
            Still not sure?
          </h3>
          <p className="text-slate-300">
            The interactive demo below lets you try GENESIS with example transactions. No crypto knowledge required.
          </p>
          <a
            href="/demo"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all"
          >
            Try Interactive Demo
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </section>
    </div>
  );
}
