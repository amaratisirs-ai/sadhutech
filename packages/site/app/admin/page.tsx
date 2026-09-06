"use client";

import { useEffect, useState } from "react";
import { ADMIN_WALLETS } from "@genesis/shared";
import { useWallet } from "@/src/wallet/useWallet";
import { useAdminAuth, WalletTimeoutError } from "@/src/wallet/useAdminAuth";
import { friendlyWalletError } from "@/src/wallet/errors";
import { Icon } from "@/components/Icon";

const GATE_URL = process.env.NEXT_PUBLIC_GATE_URL || "https://genesis-gate.onrender.com";

interface Summary {
  hours: number;
  loginsByHour: { bucket: string; count: string }[];
  loginsByDay: { bucket: string; count: string }[];
  pageViews: { page: string; count: string }[];
  transactionsByHour: { bucket: string; count: string }[];
  transactionsByVerdict: { verdict: string | null; count: string }[];
  errorCount: number;
  stuckCount: number;
  uniqueWallets: number;
  totalUsers: number;
  pro: { walletsWithCredits: number; totalCredits: number; avgCredits: number };
  creditsBought: { purchases: number; totalUsdc: number };
  recentEvents: {
    event_type: string;
    wallet: string | null;
    page: string | null;
    chain_id: number | null;
    verdict: string | null;
    meta: unknown;
    created_at: string;
  }[];
}

const RANGE_OPTIONS = [
  { label: "24h", hours: 24 },
  { label: "7d", hours: 24 * 7 },
  { label: "30d", hours: 24 * 30 },
];

function fmtHour(bucket: string) {
  return new Date(bucket).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit" });
}

function fmtDay(bucket: string) {
  return new Date(bucket).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function short(a: string | null) {
  if (!a) return "—";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-teal-500/20 bg-slate-900/60 p-4">
      <p className="text-xs uppercase tracking-wide text-teal-300">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

function BarRow({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.max(4, Math.round((count / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-xs text-slate-300">{label}</span>
      <div className="h-3 flex-1 rounded-full bg-slate-800 overflow-hidden">
        <div className="h-full rounded-full bg-teal-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right text-xs font-semibold text-white">{count}</span>
    </div>
  );
}

export default function AdminPage() {
  const { address, isConnected, connect } = useWallet();
  const { getAdminAuth, persistAdminAuth } = useAdminAuth();
  const [hours, setHours] = useState(24 * 7);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = !!address && ADMIN_WALLETS.has(address.toLowerCase());

  const load = async (rangeHours: number) => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const { message, signature } = await getAdminAuth(address);
      const res = await fetch(`${GATE_URL}/v1/admin/analytics`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet: address, message, signature, hours: rangeHours }),
      });
      if (res.status === 401) {
        persistAdminAuth(null);
        throw new Error("Your admin session expired - please try again.");
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Request failed (HTTP ${res.status})`);
      }
      setSummary(await res.json());
    } catch (e) {
      setError(e instanceof WalletTimeoutError ? e.message : friendlyWalletError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) load(hours);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, hours]);

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto text-center py-24">
        <h1 className="text-2xl font-black text-white mb-3">Admin</h1>
        <p className="text-sm text-slate-300 mb-6">Connect the admin wallet to view the dashboard.</p>
        <button onClick={connect} className="px-5 py-2 rounded-lg bg-teal-500 text-slate-950 font-bold text-sm hover:bg-teal-400 transition">
          Connect Wallet
        </button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto text-center py-24">
        <Icon name="block" className="w-8 h-8 mx-auto text-rose-400 mb-3" />
        <h1 className="text-2xl font-black text-white mb-2">Not authorized</h1>
        <p className="text-sm text-slate-300">This wallet isn&apos;t on the admin list.</p>
      </div>
    );
  }

  const maxPageView = Math.max(1, ...(summary?.pageViews.map((p) => Number(p.count)) ?? [0]));
  const verdictMax = Math.max(1, ...(summary?.transactionsByVerdict.map((v) => Number(v.count)) ?? [0]));
  const rangeLabel = RANGE_OPTIONS.find((o) => o.hours === hours)?.label ?? `${hours}h`;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-white">Admin · 360° view</h1>
          <p className="text-sm text-slate-400 mt-1">Logins, traffic, transaction checks, errors, and Pro/credit activity.</p>
        </div>
        <div className="flex items-center gap-2">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.hours}
              onClick={() => setHours(opt.hours)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                hours === opt.hours
                  ? "bg-teal-500 border-teal-500 text-slate-950"
                  : "border-teal-500/30 text-teal-300 hover:border-teal-400"
              }`}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={() => load(hours)}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-teal-500/30 text-teal-300 hover:border-teal-400 transition disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/50 bg-rose-900/20 p-4 text-sm text-rose-200">{error}</div>
      )}

      {!summary && !error && <p className="text-sm text-slate-400">Loading…</p>}

      {summary && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Stat label="Total users" value={summary.totalUsers} hint="all-time" />
            <Stat label="Unique wallets" value={summary.uniqueWallets} hint={`active in last ${rangeLabel}`} />
            <Stat label="Transactions checked" value={summary.transactionsByHour.reduce((s, r) => s + Number(r.count), 0)} hint={`last ${rangeLabel}`} />
            <Stat label="Errors" value={summary.errorCount} hint={`last ${rangeLabel}`} />
            <Stat label="Stuck flows" value={summary.stuckCount} hint={`last ${rangeLabel}`} />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <section className="rounded-xl border border-teal-500/20 bg-slate-900/60 p-5">
              <h2 className="text-sm font-bold text-white">Logins by hour</h2>
              <p className="text-[11px] text-slate-500 mb-4">Last {rangeLabel}.</p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {summary.loginsByHour.length === 0 && <p className="text-xs text-slate-500">No logins in this window.</p>}
                {summary.loginsByHour.map((r) => (
                  <BarRow key={r.bucket} label={fmtHour(r.bucket)} count={Number(r.count)} max={Math.max(1, ...summary.loginsByHour.map((x) => Number(x.count)))} />
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-teal-500/20 bg-slate-900/60 p-5">
              <h2 className="text-sm font-bold text-white">Logins by day</h2>
              <p className="text-[11px] text-slate-500 mb-4">Always last 30d, regardless of the range toggle.</p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {summary.loginsByDay.length === 0 && <p className="text-xs text-slate-500">No logins yet.</p>}
                {summary.loginsByDay.map((r) => (
                  <BarRow key={r.bucket} label={fmtDay(r.bucket)} count={Number(r.count)} max={Math.max(1, ...summary.loginsByDay.map((x) => Number(x.count)))} />
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-teal-500/20 bg-slate-900/60 p-5">
              <h2 className="text-sm font-bold text-white mb-4">Top pages</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {summary.pageViews.length === 0 && <p className="text-xs text-slate-500">No page views tracked yet.</p>}
                {summary.pageViews.map((r) => (
                  <BarRow key={r.page} label={r.page} count={Number(r.count)} max={maxPageView} />
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-teal-500/20 bg-slate-900/60 p-5">
              <h2 className="text-sm font-bold text-white mb-4">Transactions by verdict</h2>
              <div className="space-y-2">
                {summary.transactionsByVerdict.length === 0 && <p className="text-xs text-slate-500">No checks in this window.</p>}
                {summary.transactionsByVerdict.map((r) => (
                  <BarRow key={String(r.verdict)} label={r.verdict ?? "unknown"} count={Number(r.count)} max={verdictMax} />
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-teal-500/20 bg-slate-900/60 p-5 md:col-span-2">
              <h2 className="text-sm font-bold text-white mb-4">Transactions by hour</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {summary.transactionsByHour.length === 0 && <p className="text-xs text-slate-500">No checks in this window.</p>}
                {summary.transactionsByHour.map((r) => (
                  <BarRow key={r.bucket} label={fmtHour(r.bucket)} count={Number(r.count)} max={Math.max(1, ...summary.transactionsByHour.map((x) => Number(x.count)))} />
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-teal-500/20 bg-slate-900/60 p-5">
              <h2 className="text-sm font-bold text-white">Pro credits</h2>
              <p className="text-[11px] text-slate-500 mb-4">All-time balances - not affected by the range toggle above.</p>
              <ul className="space-y-2 text-sm text-slate-200">
                <li>Wallets with credits: <span className="font-bold text-white">{summary.pro.walletsWithCredits}</span></li>
                <li>Total credits held: <span className="font-bold text-white">{summary.pro.totalCredits}</span></li>
                <li>Avg credits/wallet: <span className="font-bold text-white">{summary.pro.avgCredits.toFixed(1)}</span></li>
              </ul>
            </section>

            <section className="rounded-xl border border-teal-500/20 bg-slate-900/60 p-5">
              <h2 className="text-sm font-bold text-white">Credits bought</h2>
              <p className="text-[11px] text-slate-500 mb-4">Purchases in the last {rangeLabel}.</p>
              <ul className="space-y-2 text-sm text-slate-200">
                <li>Purchases: <span className="font-bold text-white">{summary.creditsBought.purchases}</span></li>
                <li>Total USDC: <span className="font-bold text-white">${summary.creditsBought.totalUsdc.toFixed(2)}</span></li>
              </ul>
            </section>
          </div>

          <section className="rounded-xl border border-teal-500/20 bg-slate-900/60 p-5">
            <h2 className="text-sm font-bold text-white mb-4">Recent events</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead>
                  <tr className="text-slate-500 uppercase tracking-wide">
                    <th className="py-2 pr-4">Time</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Wallet</th>
                    <th className="py-2 pr-4">Page</th>
                    <th className="py-2 pr-4">Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.recentEvents.map((e, i) => (
                    <tr key={i} className="border-t border-slate-800">
                      <td className="py-2 pr-4 whitespace-nowrap">{new Date(e.created_at).toLocaleString()}</td>
                      <td className="py-2 pr-4 font-semibold text-white">{e.event_type}</td>
                      <td className="py-2 pr-4">{short(e.wallet)}</td>
                      <td className="py-2 pr-4">{e.page ?? "—"}</td>
                      <td className="py-2 pr-4">{e.verdict ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
