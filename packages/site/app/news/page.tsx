"use client";

import { useEffect, useState } from "react";

type Tab = "threats" | "articles" | "tips" | "stats";

interface Threat {
  address: string;
  category: string;
  severity: "high" | "medium" | "low";
  reports: number;
  reporters: number;
  firstSeen: string;
  lastSeen: string;
  trusted: boolean;
  hoursOld: number;
}

interface ThreatsLatestResponse {
  timestamp: string;
  parameters: { limit: number; hoursBack: number };
  stats: { total: number; byCategory: Record<string, number> };
  threats: Threat[];
}

const categoryInfo = {
  drainer: {
    color: "bg-red-500/20 text-red-700 dark:text-red-300 border-red-400/30 dark:border-red-500/20",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    label: "Wallet Drainer",
    description: "Exploits designed to drain wallet funds",
  },
  "malicious-contract": {
    color: "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-400/30 dark:border-orange-500/20",
    icon: "M12 9v2m0 4v2m0 5v.01M7.08 6.24l1.41 1.41m2.83-2.83l1.41-1.41m4.24 4.24l1.41 1.41m2.83-2.83l1.41-1.41M7.08 17.76l1.41-1.41m2.83 2.83l1.41 1.41m4.24-4.24l1.41-1.41m2.83 2.83l1.41 1.41",
    label: "Malicious Contract",
    description: "Code designed to steal funds or exploit tokens",
  },
  "decoy-tripwire": {
    color: "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-400/30 dark:border-indigo-500/20",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    label: "Decoy/Honeypot",
    description: "Fake tokens or contracts that trap users",
  },
  phishing: {
    color: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-400/30 dark:border-cyan-500/20",
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    label: "Phishing",
    description: "Social engineering attacks and scams",
  },
};

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return "Just now";
}

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function NewsPage() {
  const [data, setData] = useState<ThreatsLatestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [timeWindow, setTimeWindow] = useState<number>(168);
  const [activeTab, setActiveTab] = useState<Tab>("threats");

  useEffect(() => {
    const fetchThreats = async () => {
      try {
        setLoading(true);
        setError(null);
        const gateUrl = process.env.NEXT_PUBLIC_GATE_URL || "https://genesis-gate.onrender.com";
        const url = new URL(`${gateUrl}/v1/threats/latest`);
        url.searchParams.set("limit", "100");
        url.searchParams.set("hours", timeWindow.toString());

        const response = await fetch(url.toString());
        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load threats");
      } finally {
        setLoading(false);
      }
    };

    fetchThreats();
  }, [timeWindow]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center mx-auto animate-spin">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading latest threats...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="relative overflow-hidden rounded-xl backdrop-blur-xl bg-gradient-to-br from-red-500/10 via-rose-500/5 to-red-500/10 dark:from-red-500/5 dark:via-rose-500/5 dark:to-red-500/5 border border-red-400/30 dark:border-red-500/20 p-6">
        <div className="flex items-start gap-4">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-semibold text-red-900 dark:text-red-300">Failed to load threats</p>
            <p className="text-sm text-red-800/70 dark:text-red-300/70 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );

  if (!data || !data.threats.length)
    return (
      <div className="relative overflow-hidden rounded-xl backdrop-blur-xl bg-gradient-to-br from-slate-500/10 via-slate-500/5 to-slate-500/10 dark:from-slate-500/5 dark:via-slate-500/5 dark:to-slate-500/5 border border-slate-400/30 dark:border-slate-500/20 p-6">
        <p className="text-slate-700 dark:text-slate-300">No threats detected in the past {timeWindow / 24} days.</p>
      </div>
    );

  const filteredThreats = filter ? data.threats.filter((t) => t.category === filter) : data.threats;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <svg className="w-8 h-8 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15.5 1h-8C6.12 1 5 2.12 5 3.5v17C5 21.88 6.12 23 7.5 23h8c1.38 0 2.5-1.12 2.5-2.5v-17C18 2.12 16.88 1 15.5 1zm-4 21c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5-4H7V4h9v14z" />
          </svg>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Breaking Threats</h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Real-time threat intelligence powered by {data.stats.total} active malicious addresses
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700 sticky top-16 z-40">
        {[
          { id: "threats" as Tab, label: "🚨 Breaking Threats" },
          { id: "articles" as Tab, label: "📰 Articles & Research" },
          { id: "tips" as Tab, label: "🛡️ Safety Tips" },
          { id: "stats" as Tab, label: "📊 Statistics" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setFilter(null);
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-lg"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Breaking Threats */}
      {activeTab === "threats" && (
        <div className="space-y-6">
          {/* Time Window Filter */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Time:</span>
            {[24, 72, 168, 720].map((hours) => (
              <button
                key={hours}
                onClick={() => setTimeWindow(hours)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  timeWindow === hours
                    ? "bg-indigo-600 text-white"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                {hours === 24 ? "1d" : hours === 72 ? "3d" : hours === 168 ? "7d" : "30d"}
              </button>
            ))}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Active Threats</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{data.stats.total}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Categories</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{Object.keys(data.stats.byCategory).length}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">High Severity</div>
              <div className="text-3xl font-bold text-red-600">{data.threats.filter((t) => t.severity === "high").length}</div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Filter by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(data.stats.byCategory).map(([category, count]) => (
                <button
                  key={category}
                  onClick={() => setFilter(filter === category ? null : category)}
                  className={`p-3 rounded-lg border transition-all text-left ${
                    filter === category
                      ? (categoryInfo[category as keyof typeof categoryInfo]?.color || "bg-slate-100 dark:bg-slate-700")
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <div className="font-medium text-sm">{categoryInfo[category as keyof typeof categoryInfo]?.label || category}</div>
                  <div className="text-xs opacity-70 mt-1">{count} threats</div>
                </button>
              ))}
            </div>
          </div>

          {/* Threat Cards */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {filter ? `${categoryInfo[filter as keyof typeof categoryInfo]?.label} (${filteredThreats.length})` : `Latest Threats (${filteredThreats.length})`}
              </h3>
              {filter && (
                <button
                  onClick={() => setFilter(null)}
                  className="text-xs px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
                >
                  Clear
                </button>
              )}
            </div>
            {filteredThreats.slice(0, 20).map((threat) => {
              const info = categoryInfo[threat.category as keyof typeof categoryInfo];
              const severityColor = threat.severity === "high" ? "bg-red-500/20 text-red-700 dark:text-red-300" : threat.severity === "medium" ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300" : "bg-green-500/20 text-green-700 dark:text-green-300";
              return (
                <div key={threat.address} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    {info && (
                      <div className={`w-10 h-10 rounded flex items-center justify-center flex-shrink-0 ${info.color}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={info.icon} />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2 mb-1">
                        <div className="font-mono text-sm font-semibold text-slate-900 dark:text-white">{truncateAddress(threat.address)}</div>
                        <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-semibold ${severityColor}`}>{threat.severity.toUpperCase()}</span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">{info?.label || threat.category}</div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div><span className="text-slate-500">Reports</span> <span className="font-semibold text-slate-900 dark:text-white">{threat.reports}</span></div>
                        <div><span className="text-slate-500">Reporters</span> <span className="font-semibold text-slate-900 dark:text-white">{threat.reporters}</span></div>
                        <div><span className="text-slate-500">First Seen</span> <span className="text-slate-700 dark:text-slate-300">{formatTime(threat.firstSeen)}</span></div>
                        <div><span className="text-slate-500">Last Seen</span> <span className="text-slate-700 dark:text-slate-300">{formatTime(threat.lastSeen)}</span></div>
                      </div>
                      {threat.trusted && <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-700 dark:text-green-300 rounded text-xs font-medium">✓ Verified</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Articles */}
      {activeTab === "articles" && (
        <div className="space-y-4">
          {[
            { title: "How Wallet Drainers Work", desc: "Technical breakdown of token approval exploits", date: "2 days ago", source: "GENESIS" },
            { title: "Phishing Tactics 2024", desc: "Evolving attack vectors and defense strategies", date: "1 week ago", source: "Security" },
            { title: "Token Approvals Explained", desc: "ERC-2612 permits and why they matter", date: "2 weeks ago", source: "Blog" },
          ].map((article, i) => (
            <div key={i} className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-all">
              <div className="flex justify-between items-start gap-4 mb-2">
                <h3 className="font-semibold text-slate-900 dark:text-white">{article.title}</h3>
                <span className="text-xs text-slate-500 flex-shrink-0">{article.date}</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{article.desc}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-slate-500">{article.source}</span>
                <a href="#" className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:underline">Read →</a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Tips */}
      {activeTab === "tips" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: "✅", title: "Verify URLs", desc: "Check official websites, not phishing clones" },
            { icon: "🔒", title: "Never Share Keys", desc: "Legitimate services never ask for private keys" },
            { icon: "⚠️", title: "Review Approvals", desc: "Check token approvals carefully before signing" },
            { icon: "🔍", title: "Research First", desc: "Verify projects and teams before transactions" },
            { icon: "🛑", title: "Trust Your Gut", desc: "Stop if something feels wrong" },
            { icon: "📱", title: "Use GENESIS", desc: "Always verify transactions before signing" },
          ].map((tip, i) => (
            <div key={i} className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <div className="flex gap-3">
                <div className="text-2xl flex-shrink-0">{tip.icon}</div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{tip.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{tip.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Statistics */}
      {activeTab === "stats" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Database</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">4,122</div>
              <div className="text-xs text-slate-500 mt-1">All time threats</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Recent 7 Days</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{data.stats.total}</div>
              <div className="text-xs text-slate-500 mt-1">Active threats</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Categories</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{Object.keys(data.stats.byCategory).length}</div>
              <div className="text-xs text-slate-500 mt-1">Types detected</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">High Risk</div>
              <div className="text-3xl font-bold text-red-600">{data.threats.filter((t) => t.severity === "high").length}</div>
              <div className="text-xs text-slate-500 mt-1">Verified exploits</div>
            </div>
          </div>

          {/* Category Chart */}
          <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Breakdown by Category</h3>
            <div className="space-y-3">
              {Object.entries(data.stats.byCategory).map(([category, count]) => {
                const percentage = (count / data.stats.total) * 100;
                const colors: Record<string, string> = { drainer: "bg-red-500", "malicious-contract": "bg-orange-500", "decoy-tripwire": "bg-indigo-500", phishing: "bg-cyan-500" };
                return (
                  <div key={category}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{categoryInfo[category as keyof typeof categoryInfo]?.label || category}</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-slate-300 dark:bg-slate-700 rounded-full h-2">
                      <div className={`h-full rounded-full transition-all ${colors[category] || "bg-slate-500"}`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
