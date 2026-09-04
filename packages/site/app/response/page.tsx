"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";

interface Finding {
  id: string;
  severity: "BLOCK" | "WARN" | "ALLOW";
  title: string;
  description: string;
}

interface AnalysisResult {
  verdict: "ALLOW" | "WARN" | "BLOCK";
  explanation: string;
  findings: Finding[];
  timestamp?: string;
}

export default function ResponsePage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem("analysisResult");
    const data = sessionStorage.getItem("submittedData");
    if (stored && data) {
      setResult(JSON.parse(stored));
      setSubmittedData(JSON.parse(data));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <svg className="w-12 h-12 animate-spin text-teal-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-slate-300">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-black text-white">No Analysis Found</h1>
          <p className="text-slate-300">Please submit a transaction from the form to see results.</p>
        </div>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push("/post")}
            className="px-6 py-3 bg-teal-500 text-white font-bold rounded-lg hover:bg-teal-600 transition-all"
          >
            Go Back to Submit
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 transition-all"
          >
            Home
          </button>
        </div>
      </div>
    );
  }

  const verdictConfig = {
    ALLOW: {
      bg: "bg-green-500/10",
      border: "border-green-500/50",
      text: "text-green-400",
      icon: "checkCircle",
      label: "SAFE TO SIGN",
      description: "This transaction appears to be legitimate and safe.",
    },
    WARN: {
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/50",
      text: "text-yellow-400",
      icon: "warning",
      label: "RISKY - REVIEW CAREFULLY",
      description: "This transaction has some risks. Review the findings below before proceeding.",
    },
    BLOCK: {
      bg: "bg-red-500/10",
      border: "border-red-500/50",
      text: "text-red-400",
      icon: "block",
      label: "DANGEROUS - DO NOT SIGN",
      description: "This transaction appears to be malicious. Do not proceed.",
    },
  };

  const config = verdictConfig[result.verdict];

  return (
    <div className="space-y-12">
      {/* Verdict Card */}
      <section className={`rounded-2xl border-2 p-8 ${config.bg} ${config.border}`}>
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 ${config.text}`}>
              <Icon name={config.icon as any} className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className={`text-4xl font-black ${config.text} mb-2`}>
                {config.label}
              </h2>
              <p className="text-slate-200 text-lg leading-relaxed">
                {result.explanation}
              </p>
            </div>
          </div>

          {/* Transaction Details */}
          {submittedData && (
            <div className="mt-6 pt-6 border-t border-slate-700 space-y-3">
              <h3 className="text-sm font-bold text-white">Submitted Transaction:</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400">Wallet Address</p>
                  <p className="text-sm text-slate-200 font-mono break-all">{submittedData.walletAddress}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Network</p>
                  <p className="text-sm text-slate-200">Chain ID: {submittedData.chainId}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400">Calldata (first 100 chars)</p>
                <p className="text-sm text-slate-200 font-mono break-all">{submittedData.calldata.substring(0, 100)}...</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Findings */}
      {result.findings && result.findings.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-white">Analysis Findings</h2>
          <div className="space-y-3">
            {result.findings.map((finding: Finding) => {
              const severityConfig = {
                BLOCK: { bg: "bg-red-500/10", border: "border-red-500/50", text: "text-red-400", label: "BLOCKED" },
                WARN: { bg: "bg-yellow-500/10", border: "border-yellow-500/50", text: "text-yellow-400", label: "WARNING" },
                ALLOW: { bg: "bg-green-500/10", border: "border-green-500/50", text: "text-green-400", label: "INFO" },
              };
              const sConfig = severityConfig[finding.severity];

              return (
                <div key={finding.id} className={`rounded-lg border-l-4 ${sConfig.bg} border-l-${finding.severity === "BLOCK" ? "red" : finding.severity === "WARN" ? "yellow" : "green"}-500 p-4`}>
                  <div className="flex gap-3">
                    <div className={`font-bold text-sm ${sConfig.text} flex-shrink-0 pt-1`}>
                      <Icon
                        name={finding.severity === "BLOCK" ? "block" : finding.severity === "WARN" ? "warning" : "info"}
                        className="w-5 h-5"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-1">{finding.title}</h3>
                      <p className="text-sm text-slate-300">{finding.description}</p>
                      <p className="text-xs text-slate-400 mt-2">ID: {finding.id}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Action Buttons */}
      <section className="flex gap-4 pt-8 border-t border-slate-700">
        <button
          onClick={() => router.push("/post")}
          className="px-8 py-4 bg-teal-500 text-white font-bold rounded-lg hover:bg-teal-600 transition-all shadow-lg hover:shadow-teal-500/25"
        >
          Analyze Another Transaction
        </button>
        <button
          onClick={() => router.push("/demo")}
          className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all"
        >
          Try Interactive Demo
        </button>
        <button
          onClick={() => router.push("/")}
          className="px-8 py-4 bg-slate-800 text-slate-300 font-bold rounded-lg hover:bg-slate-700 border-2 border-slate-600 transition-all"
        >
          Back Home
        </button>
      </section>

      {/* Info */}
      <section className="p-6 bg-slate-900 border-2 border-teal-500/20 rounded-xl">
        <h3 className="text-sm font-bold text-white mb-3">How to Interpret Results</h3>
        <ul className="text-sm text-slate-300 space-y-2">
          <li><strong className="text-green-400">ALLOW:</strong> Transaction is safe. You can proceed with confidence.</li>
          <li><strong className="text-yellow-400">WARN:</strong> Transaction has some concerns. Review the findings carefully before signing.</li>
          <li><strong className="text-red-400">BLOCK:</strong> Transaction is likely malicious. Do not sign under any circumstances.</li>
        </ul>
      </section>
    </div>
  );
}
