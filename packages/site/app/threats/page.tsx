"use client";

import { useEffect, useState } from "react";

interface ThreatEntry {
  address: string;
  category: string;
  title: string;
  incident: string;
}

interface ThreatFeed {
  description: string;
  sources: string[];
  entries: ThreatEntry[];
}

export default function ThreatsPage() {
  const [feeds, setFeeds] = useState<ThreatFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/threats")
      .then((r) => r.json())
      .then(setFeeds)
      .finally(() => setLoading(false));
  }, []);

  const categoryInfo = {
    drainer: {
      color: "bg-red-500/20 text-red-700 dark:text-red-300 border-red-400/30 dark:border-red-500/20",
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      label: "Drainer",
      desc: "Known wallet drainer exploits",
    },
    "malicious-contract": {
      color: "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-400/30 dark:border-orange-500/20",
      icon: "M12 9v2m0 4v2m0 5v.01M7.08 6.24l1.41 1.41m2.83-2.83l1.41-1.41m4.24 4.24l1.41 1.41m2.83-2.83l1.41-1.41M7.08 17.76l1.41-1.41m2.83 2.83l1.41 1.41m4.24-4.24l1.41-1.41m2.83 2.83l1.41 1.41",
      label: "Malicious Contract",
      desc: "Code designed to steal funds",
    },
    honeypot: {
      color: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-400/30 dark:border-yellow-500/20",
      icon: "M7 8a4 4 0 100 8 4 4 0 000-8zM7 13a1 1 0 100-2 1 1 0 000 2z",
      label: "Honeypot",
      desc: "Fake tokens that trap buyers",
    },
    "decoy-tripwire": {
      color: "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-400/30 dark:border-indigo-500/20",
      icon: "M13 10V3L4 14h7v7l9-11h-7z",
      label: "Decoy Tripwire",
      desc: "Deceptive contract mechanics",
    },
    phishing: {
      color: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-400/30 dark:border-cyan-500/20",
      icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
      label: "Phishing",
      desc: "Social engineering scams",
    },
    sanctioned: {
      color: "bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-400/30 dark:border-slate-500/20",
      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      label: "Sanctioned",
      desc: "Addresses on sanctions lists",
    },
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center mx-auto animate-spin">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading threat intelligence...</p>
        </div>
      </div>
    );

  if (!feeds)
    return (
      <div className="relative overflow-hidden rounded-xl backdrop-blur-xl bg-gradient-to-br from-red-500/10 via-rose-500/5 to-red-500/10 dark:from-red-500/5 dark:via-rose-500/5 dark:to-red-500/5 border border-red-400/30 dark:border-red-500/20 p-6">
        <p className="font-semibold text-red-900 dark:text-red-300">Failed to load threat feed</p>
      </div>
    );

  const filteredEntries = filter
    ? feeds.entries.filter((e) => e.category === filter)
    : feeds.entries;

  const categories = Array.from(new Set(feeds.entries.map((e) => e.category)));

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-5xl font-black text-white">Threat Feed</h1>
        </div>
        <p className="text-slate-400 text-lg">
          Community-reported incidents and malicious contracts. Updated in real-time with verified threats.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-xl backdrop-blur-xl bg-slate-900 border-2 border-teal-500/50 p-6 text-center">
          <div className="relative">
            <div className="text-3xl font-black text-white">{feeds.entries.length}</div>
            <p className="text-slate-400 text-sm mt-1">Total Threats</p>
          </div>
        </div>
        <div className="rounded-xl backdrop-blur-xl bg-slate-900 border-2 border-red-500/50 p-6 text-center">
          <div className="relative">
            <div className="text-3xl font-black text-red-400">{feeds.entries.filter((e) => e.category === "drainer").length}</div>
            <p className="text-slate-400 text-sm mt-1">Drainers</p>
          </div>
        </div>
        <div className="rounded-xl backdrop-blur-xl bg-slate-900 border-2 border-teal-500/50 p-6 text-center">
          <div className="relative">
            <div className="text-3xl font-black text-teal-400">{categories.length}</div>
            <p className="text-slate-400 text-sm mt-1">Categories</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <p className="text-sm font-bold text-white">Filter by threat type:</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter(null)}
            className={`px-4 py-2 rounded-lg font-bold transition backdrop-blur-md ${
              filter === null
                ? "bg-teal-600 text-white"
                : "bg-slate-900/40 border border-slate-700/30 text-slate-300 hover:border-slate-600/50"
            }`}
          >
            All Threats ({feeds.entries.length})
          </button>
          {categories.map((cat) => {
            const info = categoryInfo[cat as keyof typeof categoryInfo];
            const count = feeds.entries.filter((e) => e.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-lg font-bold transition backdrop-blur-md ${
                  filter === cat
                    ? `${info.color} border`
                    : "bg-slate-900/40 border border-slate-700/30 text-slate-300 hover:border-slate-600/50"
                }`}
              >
                {info.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Threat Cards Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredEntries.map((entry) => {
          const info = categoryInfo[entry.category as keyof typeof categoryInfo];
          return (
            <details
              key={entry.address}
              className="group relative overflow-hidden rounded-xl backdrop-blur-xl bg-slate-900 border-2 border-slate-700/50 hover:border-teal-500/50 transition group-open:shadow-lg group-open:shadow-teal-500/20"
            >
              <summary className="cursor-pointer p-6 flex items-start gap-4 hover:bg-slate-800/30 group-open:bg-slate-800/30 transition">
                {/* Threat Icon & Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-md ${info.color}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={info.icon} />
                      </svg>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${info.color}`}>
                      {info.label}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-lg">{entry.title}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-2 break-all">
                    {entry.address.slice(0, 10)}…{entry.address.slice(-8)}
                  </p>
                </div>

                {/* Expand Arrow */}
                <svg
                  className="w-5 h-5 text-slate-400 flex-shrink-0 group-open:rotate-180 transition transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </summary>

              {/* Expanded Details */}
              <div className="px-6 py-4 bg-slate-900/5 dark:bg-slate-800/30 border-t border-slate-300/20 dark:border-slate-700/20 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-2">Incident Details</p>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{entry.incident}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-300/20 dark:border-slate-700/20">
                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Type</p>
                    <p className="text-sm text-slate-900 dark:text-slate-200">{info.desc}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Address</p>
                    <p className="text-xs font-mono text-slate-700 dark:text-slate-400 break-all">{entry.address}</p>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-lg backdrop-blur-md bg-yellow-500/20 border border-yellow-400/30 p-3 text-xs text-yellow-800 dark:text-yellow-200">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 to-transparent pointer-events-none"></div>
                  <p className="relative font-semibold mb-1">Action: GENESIS will block this address</p>
                  <p className="relative">
                    GENESIS will block any transaction that approves to this address. If you see a warning for this address,
                    <strong> do not sign</strong>.
                  </p>
                </div>
              </div>
            </details>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredEntries.length === 0 && (
        <div className="text-center py-12">
          <p className="text-4xl mb-2">✅</p>
          <p className="text-slate-600 font-medium">No threats in this category yet</p>
        </div>
      )}

      {/* Sources & Info */}
      <div className="bg-indigo-50 border-2 border-indigo-300 rounded-lg p-6 space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span>📊</span> About This Feed
          </h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex gap-2">
              <span>✅</span>
              <span>Real public incidents from security researchers and community reports</span>
            </li>
            <li className="flex gap-2">
              <span>🛡️</span>
              <span>Sybil-resistant: changes require 3+ distinct reporters to prevent false positives</span>
            </li>
            <li className="flex gap-2">
              <span>💾</span>
              <span>Persistent in PostgreSQL: available across all gate instances</span>
            </li>
            <li className="flex gap-2">
              <span>⚖️</span>
              <span>Not financial advice — always do your own research before interacting with addresses</span>
            </li>
          </ul>
        </div>

        {feeds.sources.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase mb-2">Data Sources</p>
            <div className="flex flex-wrap gap-2">
              {feeds.sources.map((source) => (
                <span
                  key={source}
                  className="inline-block px-3 py-1 bg-white rounded-full text-xs text-slate-700 border border-blue-300"
                >
                  {source}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
