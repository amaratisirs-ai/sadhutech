'use client';

import { useState } from 'react';
import Link from 'next/link';

const THREAT_CATEGORIES = [
  { value: 'phishing', label: '🎣 Phishing' },
  { value: 'drainer', label: '🔓 Drainer' },
  { value: 'malicious-contract', label: '⚠️ Malicious Contract' },
  { value: 'decoy-tripwire', label: '🪤 Honeypot' },
];

export default function ReportPage() {
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('drainer');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');

    try {
      const gateUrl =
        process.env.NEXT_PUBLIC_GATE_URL || 'https://genesis-gate.onrender.com';
      const response = await fetch(`${gateUrl}/v1/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: address.toLowerCase(),
          category: category as any,
          reporterId: `reporter-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          description: description || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      setStatus('success');
      setMessage(`✅ Threat reported! It's now in the GENESIS database protecting ${result.totalThreats || '0'} users.`);
      setAddress('');
      setDescription('');
      setCategory('drainer');
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? `❌ Report failed: ${error.message}`
          : '❌ Failed to submit threat report.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Back to home
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Report a Threat</h1>
          <p className="text-slate-300">
            Help protect the crypto community by reporting malicious contracts and draining addresses across all blockchains.
          </p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Address Input */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-slate-200 mb-2">
                Address to Report <span className="text-red-400">*</span>
              </label>
              <input
                id="address"
                type="text"
                placeholder="0x..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-400 mt-1">
                Must be a valid Ethereum address (0x followed by 40 hex characters)
              </p>
            </div>

            {/* Category Selection */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-200 mb-2">
                Threat Type <span className="text-red-400">*</span>
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {THREAT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">
                <strong>Drainer:</strong> Contracts that steal funds • <strong>Phishing:</strong> Social engineering •{' '}
                <strong>Honeypot:</strong> Fake tokens that prevent selling
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-200 mb-2">
                Evidence / Details (Optional)
              </label>
              <textarea
                id="description"
                placeholder="e.g., 'Seen draining wallets via Telegram bot' or 'Exploit details or incident link'"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !address}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition"
            >
              {loading ? 'Reporting...' : '🚨 Report Threat'}
            </button>
          </form>

          {/* Status Messages */}
          {status === 'success' && (
            <div className="mt-6 p-4 bg-green-900 border border-green-700 rounded-lg">
              <p className="text-green-200">{message}</p>
            </div>
          )}
          {status === 'error' && (
            <div className="mt-6 p-4 bg-red-900 border border-red-700 rounded-lg">
              <p className="text-red-200">{message}</p>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-slate-700 border border-slate-600 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-3">How It Works</h2>
          <ul className="space-y-2 text-slate-300 text-sm">
            <li>✅ <strong>Submit:</strong> Report a malicious address (Ethereum, Polygon, Arbitrum, Optimism, etc.)</li>
            <li>✅ <strong>Verify:</strong> Our analysis engine scores the threat</li>
            <li>✅ <strong>Protect:</strong> GENESIS gates block this address for all users</li>
            <li>✅ <strong>Track:</strong> See your report's impact on the dashboard</li>
          </ul>
        </div>

        {/* Community Stats (Placeholder for future connection) */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="bg-slate-700 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">12</div>
            <div className="text-sm text-slate-400">Verified Threats</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-400">0</div>
            <div className="text-sm text-slate-400">Community Reports</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-purple-400">∞</div>
            <div className="text-sm text-slate-400">Protected Users</div>
          </div>
        </div>
      </div>
    </div>
  );
}
