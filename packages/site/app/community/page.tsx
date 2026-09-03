"use client";

import { useEffect, useState } from "react";

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
  const [activeTab, setActiveTab] = useState<"leaderboard" | "contribute" | "rewards">("leaderboard");

  useEffect(() => {
    // Mock data for now - in production this would fetch from /v1/contributors/leaderboard
    const mockContributors: Contributor[] = [
      { address: "0x1234...5678", username: "SecurityPro", reports: 156, threats: 412, verified: 89, score: 8940, joinedAt: "2024-01-15" },
      { address: "0x2345...6789", username: "ThreatHunter", reports: 134, threats: 378, verified: 76, score: 7650, joinedAt: "2024-02-01" },
      { address: "0x3456...7890", username: "PhishDetector", reports: 98, threats: 245, verified: 62, score: 5890, joinedAt: "2024-03-10" },
      { address: "0x4567...8901", username: "BlockchainSafe", reports: 87, threats: 201, verified: 54, score: 4920, joinedAt: "2024-03-20" },
      { address: "0x5678...9012", username: "CryptoGuard", reports: 76, threats: 189, verified: 48, score: 4100, joinedAt: "2024-04-05" },
    ];
    setContributors(mockContributors);
    setLoading(false);
  }, []);

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
          Join thousands of security researchers reporting and verifying threats
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700 sticky top-16 z-40">
        {[
          { id: "leaderboard" as const, label: "🏆 Leaderboard" },
          { id: "contribute" as const, label: "📝 How to Contribute" },
          { id: "rewards" as const, label: "🎁 Rewards Program" },
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Active Contributors</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">2,847</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Reports</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">45.2K</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Verified Threats</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">38.1K</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Rewards Distributed</div>
              <div className="text-3xl font-bold text-emerald-600">$127K</div>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-semibold text-slate-900 dark:text-white">Top Contributors This Month</h2>
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
                  {contributors.map((c, i) => (
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
                  icon: "🔍",
                },
                {
                  step: "2",
                  title: "Gather Evidence",
                  desc: "Collect evidence: victim complaints, contract code, transaction patterns. Documentation strengthens verification chances.",
                  icon: "📋",
                },
                {
                  step: "3",
                  title: "Submit Report via /v1/report",
                  desc: "Use the GENESIS API endpoint to submit your threat report with description, category, and chain information.",
                  icon: "📤",
                },
                {
                  step: "4",
                  title: "Community Votes",
                  desc: "Other security researchers review and vote on your report. Consensus through quorum voting ensures accuracy.",
                  icon: "🗳️",
                },
                {
                  step: "5",
                  title: "Earn Rewards",
                  desc: "Once verified, earn points and rewards. Higher quality reports earn more. Monthly leaderboard winners get bonus payouts.",
                  icon: "🎁",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="text-3xl flex-shrink-0">{item.icon}</div>
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
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">📚 API Documentation</h3>
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
                  <p className="text-slate-600 dark:text-slate-400">Report verified by quorum: +25 points, Monthly bonus pool: $1,000 distributed</p>
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
              <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-4">🎁 How to Redeem</h3>
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
