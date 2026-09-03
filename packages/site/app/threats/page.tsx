"use client";

import { useEffect, useState } from "react";

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
  pagination: { offset: number; limit: number; total: number; hasMore: boolean };
  stats: { total: number; byCategory: Record<string, number> };
  threats: Threat[];
}

type SortBy = "latest" | "reports" | "verified";

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

const PAGE_SIZE = 30;

export default function ThreatsPage() {
  const [allThreats, setAllThreats] = useState<Threat[]>([]);
  const [stats, setStats] = useState<{ total: number; byCategory: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("latest");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Fetch threats with pagination
  const fetchThreats = async (fetchOffset: number = 0) => {
    try {
      if (fetchOffset === 0) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const gateUrl = process.env.NEXT_PUBLIC_GATE_URL || "https://genesis-gate.onrender.com";
      const url = new URL(`${gateUrl}/v1/threats/latest`);
      url.searchParams.set("limit", PAGE_SIZE.toString());
      url.searchParams.set("offset", fetchOffset.toString());

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const json: ThreatsLatestResponse = await response.json();

      // Handle missing pagination (backend compatibility)
      if (!json.pagination) {
        console.warn("API response missing pagination object. Using hasMore=false");
        json.pagination = {
          offset: fetchOffset,
          limit: PAGE_SIZE,
          total: json.stats.total,
          hasMore: false,
        };
      }

      if (fetchOffset === 0) {
        setAllThreats(json.threats);
      } else {
        setAllThreats((prev) => [...prev, ...json.threats]);
      }

      setStats(json.stats);
      setOffset(fetchOffset + json.threats.length);
      setHasMore(json.pagination.hasMore);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load threats";
      console.error("Failed to fetch threats:", err);
      setError(errorMsg);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setOffset(0);
    setAllThreats([]);
    setHasMore(true);
    fetchThreats(0);
  }, []);

  const handleLoadMore = () => {
    fetchThreats(offset);
  };

  // Sort threats based on selected sort
  const sortedThreats = [...allThreats].sort((a, b) => {
    if (sortBy === "latest") {
      return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
    } else if (sortBy === "reports") {
      return b.reports - a.reports;
    } else if (sortBy === "verified") {
      if (a.trusted !== b.trusted) return b.trusted ? 1 : -1;
      return b.reporters - a.reporters;
    }
    return 0;
  });

  // Filter threats
  const filteredThreats = filter ? sortedThreats.filter((t) => t.category === filter) : sortedThreats;

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

  if (error)
    return (
      <div className="space-y-6 max-w-6xl">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h2 className="font-bold text-red-900 dark:text-red-200 mb-2">Error Loading Threats</h2>
          <p className="text-red-800 dark:text-red-300 mb-4">{error}</p>
          <p className="text-sm text-red-700 dark:text-red-400 mb-4">The threat database is temporarily unavailable. Please try again in a few moments.</p>
          <button
            onClick={() => {
              setError(null);
              fetchThreats(0);
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
          >
            ↻ Retry
          </button>
        </div>
      </div>
    );

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Threat Database</h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Browse all {stats?.total || 0} verified malicious addresses in the GENESIS database
        </p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total in Database</div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Loaded So Far</div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{allThreats.length}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">High Severity</div>
            <div className="text-3xl font-bold text-red-600">{allThreats.filter((t) => t.severity === "high").length}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Verified</div>
            <div className="text-3xl font-bold text-green-600">{allThreats.filter((t) => t.trusted).length}</div>
          </div>
        </div>
      )}

      {/* Sort & Filter Controls */}
      <div className="space-y-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        {/* Sort Buttons */}
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Sort By:</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "latest" as SortBy, label: "⏱️ Latest First" },
              { id: "reports" as SortBy, label: "📊 Most Reports" },
              { id: "verified" as SortBy, label: "✓ Verified First" },
            ].map((sort) => (
              <button
                key={sort.id}
                onClick={() => setSortBy(sort.id)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  sortBy === sort.id
                    ? "bg-indigo-600 text-white"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                {sort.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Filter by Category:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => setFilter(null)}
              className={`p-3 rounded-lg border transition-all text-left ${
                filter === null
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              <div className="font-medium text-sm">All Categories</div>
              <div className="text-xs opacity-70 mt-1">{allThreats.length} threats</div>
            </button>
            {stats &&
              Object.entries(stats.byCategory).map(([category, count]) => (
                <button
                  key={category}
                  onClick={() => setFilter(category)}
                  className={`p-3 rounded-lg border transition-all text-left ${
                    filter === category
                      ? (categoryInfo[category as keyof typeof categoryInfo]?.color || "bg-slate-100 dark:bg-slate-700")
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <div className="font-medium text-sm">
                    {categoryInfo[category as keyof typeof categoryInfo]?.label || category}
                  </div>
                  <div className="text-xs opacity-70 mt-1">{count} threats</div>
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Threat Cards */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            {filter
              ? `${categoryInfo[filter as keyof typeof categoryInfo]?.label} (${filteredThreats.length})`
              : `All Threats (${filteredThreats.length})`}
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

        {filteredThreats.map((threat) => {
          const info = categoryInfo[threat.category as keyof typeof categoryInfo];
          const severityColor =
            threat.severity === "high"
              ? "bg-red-500/20 text-red-700 dark:text-red-300"
              : threat.severity === "medium"
                ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300"
                : "bg-green-500/20 text-green-700 dark:text-green-300";

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
                    <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-semibold ${severityColor}`}>
                      {threat.severity.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">{info?.label || threat.category}</div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">Reports</span>{" "}
                      <span className="font-semibold text-slate-900 dark:text-white">{threat.reports}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Reporters</span>{" "}
                      <span className="font-semibold text-slate-900 dark:text-white">{threat.reporters}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">First Seen</span>{" "}
                      <span className="text-slate-700 dark:text-slate-300">{formatTime(threat.firstSeen)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Last Seen</span>{" "}
                      <span className="text-slate-700 dark:text-slate-300">{formatTime(threat.lastSeen)}</span>
                    </div>
                  </div>
                  {threat.trusted && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-700 dark:text-green-300 rounded text-xs font-medium">
                      ✓ Verified
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loadingMore ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Loading...
                </>
              ) : (
                `Load More (${allThreats.length}/${stats?.total || 0})`
              )}
            </button>
          </div>
        )}

        {!hasMore && allThreats.length > 0 && (
          <div className="text-center py-4 text-slate-600 dark:text-slate-400">✓ All {allThreats.length} threats loaded</div>
        )}
      </div>
    </div>
  );
}
