'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { Genesis } from '@/components/Genesis';

const THREAT_CATEGORIES = [
  { value: 'phishing', label: 'Phishing' },
  { value: 'drainer', label: 'Drainer' },
  { value: 'malicious-contract', label: 'Malicious Contract' },
  { value: 'decoy-tripwire', label: 'Honeypot' },
];
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

// Cloudflare Turnstile bot-check widget (renders only when a site key is configured).
function Turnstile({ onToken }: { onToken: (t: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || typeof window === 'undefined') return;
    const SCRIPT_ID = 'cf-turnstile-script';
    const render = () => {
      const w = window as any;
      if (w.turnstile && ref.current && !ref.current.dataset.rendered) {
        ref.current.dataset.rendered = '1';
        w.turnstile.render(ref.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (t: string) => onToken(t),
          'error-callback': () => onToken(''),
          'expired-callback': () => onToken(''),
        });
      }
    };
    if (!document.getElementById(SCRIPT_ID)) {
      const s = document.createElement('script');
      s.id = SCRIPT_ID;
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      s.defer = true;
      s.onload = render;
      document.head.appendChild(s);
    } else {
      render();
    }
  }, [onToken]);
  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={ref} className="mt-2" />;
}
export default function ReportPage() {
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('drainer');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [threatCount, setThreatCount] = useState<number | null>(null);
  const [turnstileToken, setTurnstileToken] = useState('');

  useEffect(() => {
    const gateUrl = process.env.NEXT_PUBLIC_GATE_URL || 'https://genesis-gate.onrender.com';
    fetch(`${gateUrl}/v1/threats/latest?limit=1&hours=1000000`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const total = j?.stats?.total ?? j?.pagination?.total;
        if (typeof total === 'number') setThreatCount(total);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');

    if (!/^0x[0-9a-fA-F]{40}$/.test(address.trim())) {
      setStatus('error');
      setMessage('Enter a valid address  -  0x followed by 40 hex characters.');
      setLoading(false);
      return;
    }

    try {
      // Posts to our server-side proxy, which adds the gate API key and derives a stable reporter id from the email.
      const response = await fetch(`/api/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: address.toLowerCase(),
          category: category as any,
          description: description || undefined,
          email: email.trim().toLowerCase(),
          reporterName: reporterName.trim() || undefined,
          turnstileToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      await response.json().catch(() => ({}));
      setStatus('success');
      setMessage(`Almost there  -  we've emailed ${email}. Click the confirmation link to submit your report.`);
      setAddress('');
      setDescription('');
      setCategory('drainer');    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? `Report failed: ${error.message}`
          : 'Failed to submit threat report.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-3 text-center">
          <Link href="/" className="inline-block text-sm font-semibold text-teal-300 hover:text-teal-200">
            ← Back to home
          </Link>
          <h1 className="text-4xl font-black text-white sm:text-5xl">Report a Threat</h1>
          <p className="mx-auto max-w-xl text-slate-300">
            Help protect the crypto community by reporting malicious contracts and draining addresses across all blockchains.
          </p>
        </div>

        <div className="space-y-4 rounded-2xl border-2 border-teal-500/40 bg-slate-900/60 p-6">
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
                className="w-full rounded-lg border-2 border-slate-600 bg-slate-800 px-4 py-3 font-mono text-sm text-white placeholder-slate-400 outline-none focus:border-teal-400"
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
                className="w-full rounded-lg border-2 border-slate-600 bg-slate-800 px-4 py-3 text-white outline-none focus:border-teal-400"
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
                maxLength={1000}
                className="w-full resize-none rounded-lg border-2 border-slate-600 bg-slate-800 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-teal-400"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-2">
                Your Email <span className="text-red-400">*</span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border-2 border-slate-600 bg-slate-800 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-teal-400"
              />
              <p className="text-xs text-slate-400 mt-1">
                Used to credit your report and build your reporter reputation. Kept private  -  never shown publicly or shared.
              </p>
            </div>

            {/* Display name */}
            <div>
              <label htmlFor="reporterName" className="block text-sm font-medium text-slate-200 mb-2">
                Display Name (Optional)
              </label>
              <input
                id="reporterName"
                type="text"
                placeholder="How you appear on the leaderboard"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="w-full rounded-lg border-2 border-slate-600 bg-slate-800 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-teal-400"
              />
            </div>

            {/* Bot check */}
            {TURNSTILE_SITE_KEY && (
              <div>
                <Turnstile onToken={setTurnstileToken} />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !address || !email || (!!TURNSTILE_SITE_KEY && !turnstileToken)}
              className="w-full rounded-lg bg-teal-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Reporting…' : 'Report Threat'}
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
        <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-white mb-3">How It Works</h2>
          <ul className="space-y-2 text-slate-300 text-sm">
            <li className="flex gap-2"><Icon name="check" className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" /><span><strong>Submit:</strong> Report a malicious address (Ethereum, Polygon, Arbitrum, Optimism, etc.)</span></li>
            <li className="flex gap-2"><Icon name="check" className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" /><span><strong>Confirm:</strong> Click the link we email you  -  this proves the report is genuine</span></li>
            <li className="flex gap-2"><Icon name="check" className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" /><span><strong>Protect:</strong> Once confirmed by the community, <Genesis /> blocks the address for everyone</span></li>
            <li className="flex gap-2"><Icon name="check" className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" /><span><strong>Track:</strong> Build your reporter reputation on the community leaderboard</span></li>
          </ul>
        </div>

        {/* Real community stat */}
        <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-5 text-center sm:p-6">
          <div className="text-4xl font-bold text-teal-300">{threatCount !== null ? threatCount.toLocaleString() : ' - '}</div>
          <div className="text-sm text-slate-400 mt-1">Malicious addresses in the community threat feed</div>
        </div>
    </div>
  );
}
