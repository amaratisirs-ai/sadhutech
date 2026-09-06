"use client";

import { useEffect, useState } from "react";
import { ADMIN_WALLETS } from "@genesis/shared";
import { useWallet } from "@/src/wallet/useWallet";
import { useAdminAuth, WalletTimeoutError } from "@/src/wallet/useAdminAuth";
import { friendlyWalletError } from "@/src/wallet/errors";
import { Icon } from "@/components/Icon";

const GATE_URL = process.env.NEXT_PUBLIC_GATE_URL || "https://genesis-gate.onrender.com";

type TodoStatus = "not-started" | "in-progress" | "done" | "blocked";

interface Todo {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  status: TodoStatus;
  effort: string | null;
  estimateHours: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const STATUS_OPTIONS: { value: TodoStatus; label: string }[] = [
  { value: "not-started", label: "Not started" },
  { value: "in-progress", label: "In progress" },
  { value: "done", label: "Done" },
  { value: "blocked", label: "Blocked" },
];

const STATUS_STYLE: Record<TodoStatus, string> = {
  "not-started": "bg-slate-700 text-slate-300",
  "in-progress": "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  done: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  blocked: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
};

const EFFORT_STYLE: Record<string, string> = {
  Low: "text-emerald-300",
  "Low-Medium": "text-emerald-300",
  Medium: "text-amber-300",
  "Medium-High": "text-amber-300",
  High: "text-rose-300",
};

export default function AdminTodosPage() {
  const { address, isConnected, connect } = useWallet();
  const { getAdminAuth, persistAdminAuth } = useAdminAuth();
  const [todos, setTodos] = useState<Todo[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "", effort: "", estimateHours: "" });
  const [saving, setSaving] = useState(false);

  const isAdmin = !!address && ADMIN_WALLETS.has(address.toLowerCase());

  async function callAdmin<T>(path: string, extra: Record<string, unknown> = {}): Promise<T> {
    if (!address) throw new Error("Connect a wallet first.");
    const { message, signature } = await getAdminAuth(address);
    const res = await fetch(`${GATE_URL}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ wallet: address, message, signature, ...extra }),
    });
    if (res.status === 401) {
      persistAdminAuth(null);
      throw new Error("Your admin session expired - please try again.");
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error || `Request failed (HTTP ${res.status})`);
    }
    return res.json();
  }

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await callAdmin<Todo[]>("/v1/admin/todos/list");
      setTodos(data);
    } catch (e) {
      setError(e instanceof WalletTimeoutError ? e.message : friendlyWalletError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const setStatus = async (id: number, status: TodoStatus) => {
    setTodos((prev) => (prev ? prev.map((t) => (t.id === id ? { ...t, status } : t)) : prev));
    try {
      await callAdmin("/v1/admin/todos/status", { id, status });
    } catch (e) {
      setError(e instanceof WalletTimeoutError ? e.message : friendlyWalletError(e));
      load();
    }
  };

  const deleteTodo = async (id: number) => {
    setTodos((prev) => (prev ? prev.filter((t) => t.id !== id) : prev));
    try {
      await callAdmin("/v1/admin/todos/delete", { id });
    } catch (e) {
      setError(e instanceof WalletTimeoutError ? e.message : friendlyWalletError(e));
      load();
    }
  };

  const createTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await callAdmin("/v1/admin/todos/create", form);
      setForm({ title: "", description: "", category: "", effort: "", estimateHours: "" });
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e instanceof WalletTimeoutError ? e.message : friendlyWalletError(e));
    } finally {
      setSaving(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto text-center py-24">
        <h1 className="text-2xl font-black text-white mb-3">Admin · Todos</h1>
        <p className="text-sm text-slate-300 mb-6">Connect the admin wallet to view this page.</p>
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

  const groups = new Map<string, Todo[]>();
  for (const t of todos ?? []) {
    const key = t.category || "Uncategorized";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  const counts = (todos ?? []).reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <a href="/admin" className="text-xs font-bold text-teal-300 hover:text-teal-100">← Back to Admin</a>
          <h1 className="text-3xl font-black text-white mt-2">Build &amp; Roadmap Tracker</h1>
          <p className="text-sm text-slate-400 mt-1">
            {(todos ?? []).length} item{(todos ?? []).length === 1 ? "" : "s"} · {counts["done"] ?? 0} done ·{" "}
            {counts["in-progress"] ?? 0} in progress · {counts["not-started"] ?? 0} not started
            {counts["blocked"] ? ` · ${counts["blocked"]} blocked` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowForm((s) => !s)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-teal-500/30 text-teal-300 hover:border-teal-400 transition"
          >
            {showForm ? "Cancel" : "+ Add item"}
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-teal-500/30 text-teal-300 hover:border-teal-400 transition disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-rose-500/50 bg-rose-900/20 p-4 text-sm text-rose-200">{error}</div>}

      {showForm && (
        <form onSubmit={createTodo} className="rounded-xl border border-teal-500/20 bg-slate-900/60 p-5 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              required
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm outline-none focus:border-teal-400"
            />
            <input
              placeholder="Category"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm outline-none focus:border-teal-400"
            />
            <input
              placeholder="Effort (e.g. Medium)"
              value={form.effort}
              onChange={(e) => setForm((f) => ({ ...f, effort: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm outline-none focus:border-teal-400"
            />
            <input
              placeholder="Estimate (e.g. 4-8 hrs)"
              value={form.estimateHours}
              onChange={(e) => setForm((f) => ({ ...f, estimateHours: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm outline-none focus:border-teal-400"
            />
          </div>
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm outline-none focus:border-teal-400"
          />
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-bold text-sm hover:bg-teal-400 transition disabled:opacity-50"
          >
            {saving ? "Adding…" : "Add item"}
          </button>
        </form>
      )}

      {!todos && !error && <p className="text-sm text-slate-400">Loading…</p>}

      {todos && todos.length === 0 && <p className="text-sm text-slate-500">No tracked items yet.</p>}

      {[...groups.entries()].map(([category, items]) => (
        <section key={category} className="rounded-xl border border-teal-500/20 bg-slate-900/60 p-5 space-y-3">
          <h2 className="text-sm font-bold text-white">{category}</h2>
          <div className="space-y-2">
            {items.map((t) => (
              <div key={t.id} className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm">{t.title}</p>
                    {t.description && <p className="text-xs text-slate-400 mt-1">{t.description}</p>}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                      {t.effort && <span className={`font-bold ${EFFORT_STYLE[t.effort] ?? "text-slate-300"}`}>{t.effort}</span>}
                      {t.estimateHours && <span className="text-slate-500">{t.estimateHours}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={t.status}
                      onChange={(e) => setStatus(t.id, e.target.value as TodoStatus)}
                      className={`text-xs font-bold rounded-full px-3 py-1 outline-none cursor-pointer ${STATUS_STYLE[t.status]}`}
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value} className="bg-slate-900 text-white">
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => deleteTodo(t.id)}
                      aria-label="Delete"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-300 hover:bg-rose-500/10 transition"
                    >
                      <Icon name="block" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
