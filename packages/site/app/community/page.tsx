"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";

interface Contributor {
  address: string;
  username?: string;
  reports: number;
  threats: number;
  verified: number;
  score: number;
  joinedAt: string;
}

export default function CommunityPage() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"leaderboard" | "contribute" | "rewards">("leaderboard");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [threatCount, setThreatCount] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"score" | "reports" | "verified" | "latest">("score");

  const ITEMS_PER_PAGE = 20;

  // Fetch contributors with pagination
  const fetchContributors = async (fetchOffset: number = 0) => {
    try {
      if (fetchOffset === 0) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const gateUrl = process.env.NEXT_PUBLIC_GATE_URL || "https://genesis-gate.onrender.com";
      const url = new URL(`${gateUrl}/v1/contributors/leaderboard`);
      url.searchParams.set("limit", ITEMS_PER_PAGE.toString());
      url.searchParams.set("offset", fetchOffset.toString());

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const json = await response.json();

      // On initial load, reset. On "Load More", append.
      if (fetchOffset === 0) {
        setContributors(json.leaderboard || []);
      } else {
        setContributors((prev) => [...prev, ...(json.leaderboard || [])]);
      }

      setOffset(fetchOffset + (json.leaderboard?.length || 0));
      setHasMore(json.pagination?.hasMore || false);
      setTotalCount(json.pagination?.total || 0);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load leaderboard";
      console.error("Failed to fetch contributors:", err);
      setError(errorMsg);
      // No fabricated data  -  show an honest empty state when the feed is unavailable.
      if (fetchOffset === 0) {
        setContributors([]);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setOffset(0);
    setContributors([]);
    setHasMore(true);
    fetchContributors(0);

    // Real count of threat addresses already tracked in the community feed.
    const gateUrl = process.env.NEXT_PUBLIC_GATE_URL || "https://genesis-gate.onrender.com";
    fetch(`${gateUrl}/v1/threats/latest?limit=1&hours=1000000`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const total = j?.stats?.total ?? j?.pagination?.total;
        if (typeof total === "number") setThreatCount(total);
      })
      .catch(() => {});
  }, []);

  const handleLoadMore = () => {
    fetchContributors(offset);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <svg className="w-8 h-8 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 18.5a6 6 0 00-12 0v.5H6v2h12v-2h-.5v-.5zM9 9a3 3 0 106 0 3 3 0 00-6 0z" />
          </svg>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Security Community</h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Report and verify scam addresses so GENESIS can protect everyone. The more reports, the stronger the shield.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700 sticky top-16 z-40">
        {[
          { id: "leaderboard" as const, label: "Leaderboard" },
          { id: "contribute" as const, label: "How to Contribute" },
          { id: "rewards" as const, label: "Rewards Program" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
              activeTab === tab.id
                ? "bg-emerald-600 text-white shadow-lg"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Leaderboard */}
      {activeTab === "leaderboard" && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Threats tracked</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{threatCount !== null ? threatCount.toLocaleString() : " - "}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Malicious addresses in the community threat feed.</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Community contributors</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{totalCount ? totalCount.toLocaleString() : " - "}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Grows as verified reports come in. Rewards program coming soon.</p>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 space-y-4">
              <h2 className="font-semibold text-slate-900 dark:text-white">Top Contributors This Month</h2>
              
              {/* Sort Controls */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 py-2">Sort by:</span>
                {[
                  { id: "score", label: "Top Score" },
                  { id: "reports", label: "Most Reports" },
                  { id: "verified", label: "Most Verified" },
                  { id: "latest", label: "Latest Join" },
                ].map((sort) => (
                  <button
                    key={sort.id}
                    onClick={() => setSortBy(sort.id as typeof sortBy)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      sortBy === sort.id
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {sort.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">#</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">Contributor</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">Reports</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">Threats Found</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">Verified</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {contributors
                    .sort((a, b) => {
                      if (sortBy === "score") return b.score - a.score;
                      if (sortBy === "reports") return b.reports - a.reports;
                      if (sortBy === "verified") return b.verified - a.verified;
                      if (sortBy === "latest") return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
                      return 0;
                    })
                    .map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-lg">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{c.username || "Anonymous"}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">{c.address}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-900 dark:text-white font-semibold">{c.reports}</td>
                      <td className="px-6 py-4 text-slate-900 dark:text-white font-semibold">{c.threats}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-700 dark:text-green-300 rounded text-sm font-medium">
                          ✓ {c.verified}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">{c.score.toLocaleString()}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!loading && contributors.length === 0 && (
              <div className="p-10 text-center text-slate-500 dark:text-slate-400">
                <p className="font-semibold text-slate-700 dark:text-slate-300">Contributor rankings will appear here.</p>
                <p className="text-sm mt-1">Scores reflect the quality and impact of community threat reports.</p>
              </div>
            )}

            {/* Load More Button */}
            {hasMore && contributors.length > 0 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Loading...
                    </>
                  ) : (
                    `Load More Contributors (${contributors.length}/${totalCount || "..."})`
                  )}
                </button>
              </div>
            )}

            {!hasMore && contributors.length > 0 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 text-center text-slate-600 dark:text-slate-400">
                ✓ All {contributors.length} contributors loaded
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: How to Contribute */}
      {activeTab === "contribute" && (
        <div className="space-y-4">
          <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 mb-6">How to Report Threats</h2>

            <div className="space-y-6">
              {[
                {
                  step: "1",
                  title: "Identify a Malicious Address",
                  desc: "Find a phishing address, drainer, or malicious contract. You can search blockchain explorers, community reports, or security tools.",
                  icon: <Icon name="search" className="w-7 h-7" />,
                },
                {
                  step: "2",
                  title: "Gather Evidence",
                  desc: "Collect evidence: victim complaints, contract code, transaction patterns. Documentation strengthens verification chances.",
                  icon: <Icon name="document" className="w-7 h-7" />,
                },
                {
                  step: "3",
                  title: "Submit Report via /v1/report",
                  desc: "Use the GENESIS API endpoint to submit your threat report with description, category, and chain information.",
                  icon: <Icon name="arrowRight" className="w-7 h-7" />,
                },
                {
                  step: "4",
                  title: "Community Votes",
                  desc: "Other security researchers review your report. It only counts once multiple independent reporters agree  -  so accuracy stays high.",
                  icon: <Icon name="users" className="w-7 h-7" />,
                },
                {
                  step: "5",
                  title: "Earn Rewards",
                  desc: "Once verified, earn points and rewards. Higher quality reports earn more. Monthly leaderboard winners get bonus payouts.",
                  icon: <Icon name="gift" className="w-7 h-7" />,
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="text-indigo-500 dark:text-indigo-400 flex-shrink-0">{item.icon}</div>
                  <div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full text-sm font-bold">
                        {item.step}
                      </span>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 ml-8">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-lg">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2"><Icon name="document" className="w-5 h-5 text-indigo-500" /> API Documentation</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Submit threat reports programmatically using the GENESIS API:
              </p>
              <pre className="bg-slate-50 dark:bg-slate-900 p-3 rounded text-xs overflow-x-auto text-slate-900 dark:text-slate-100">
{`POST /v1/report
Content-Type: application/json

{
  "address": "0x...",
  "category": "drainer|malicious-contract|phishing",
  "chain": "ethereum|polygon|arbitrum|base",
  "description": "Detailed description of the threat",
  "evidence_url": "https://..."
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Rewards Program */}
      {activeTab === "rewards" && (
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-6">Community Rewards Program</h2>

            {/* Tier Breakdown */}
            <div className="space-y-4 mb-8">
              <h3 className="font-semibold text-slate-900 dark:text-white">Verification Tier Rewards</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { tier: "Bronze", points: "100-499", percentage: "84%", color: "bg-yellow-100 dark:bg-yellow-950" },
                  { tier: "Silver", points: "500-999", percentage: "90%", color: "bg-gray-100 dark:bg-gray-800" },
                  { tier: "Gold", points: "1000-4999", percentage: "95%", color: "bg-yellow-200 dark:bg-yellow-900" },
                  { tier: "Platinum", points: "5000+", percentage: "98%", color: "bg-blue-100 dark:bg-blue-950" },
                ].map((tier) => (
                  <div key={tier.tier} className={`${tier.color} border border-slate-300 dark:border-slate-600 rounded-lg p-4`}>
                    <div className="font-bold text-slate-900 dark:text-white mb-1">{tier.tier}</div>
                    <div className="text-sm text-slate-700 dark:text-slate-400 mb-2">Score: {tier.points}</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white">{tier.percentage} verified</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reward Formulas */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Point & Payment System</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white mb-1">Base Report Points</div>
                  <p className="text-slate-600 dark:text-slate-400">Each successful report: 10-50 points depending on threat type</p>
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white mb-1">Verification Bonus</div>
                  <p className="text-slate-600 dark:text-slate-400">Report confirmed by the community: +25 points, Monthly bonus pool: $1,000 distributed</p>
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white mb-1">Leaderboard Rewards</div>
                  <p className="text-slate-600 dark:text-slate-400">Top 10 monthly: 🥇 $500 | 🥈 $250 | 🥉 $100 | 4-10: $25-50</p>
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white mb-1">Annual Bonuses</div>
                  <p className="text-slate-600 dark:text-slate-400">Platinum+ contributors: Additional 20% bonus on annual rewards</p>
                </div>
              </div>
            </div>

            {/* Redemption */}
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6">
              <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-4 flex items-center gap-2"><Icon name="gift" className="w-5 h-5" /> How to Redeem</h3>
              <ul className="space-y-2 text-sm text-emerald-900 dark:text-emerald-100">
                <li>• Points automatically added to your contributor dashboard</li>
                <li>• Redeem 1,000 points = $50 USDC or ETH</li>
                <li>• Monthly payout runs on the 5th (minimum 500 points)</li>
                <li>• Payouts sent directly to your verified wallet</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
