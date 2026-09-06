import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AnalyticsService } from "./analytics.js";

function fakePool(queryImpl?: (...args: unknown[]) => unknown) {
  return { query: vi.fn(queryImpl ?? (async () => ({ rows: [] }))) } as any;
}

describe("AnalyticsService", () => {
  const originalError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it("initialize() creates the analytics_events table", async () => {
    const pool = fakePool();
    const svc = new AnalyticsService(pool);
    await svc.initialize();
    expect(pool.query).toHaveBeenCalledTimes(1);
    const sql = pool.query.mock.calls[0][0] as string;
    expect(sql).toContain("analytics_events");
  });

  it("logEvent() inserts a row with lowercased wallet and JSON meta", async () => {
    const pool = fakePool();
    const svc = new AnalyticsService(pool);
    await svc.logEvent("analyze", { wallet: "0xABC", chainId: 1, verdict: "allow", meta: { pro: false } });
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO analytics_events"),
      ["analyze", "0xabc", null, 1, "allow", JSON.stringify({ pro: false })]
    );
  });

  it("logEvent() never throws on a failed query", async () => {
    const pool = fakePool(async () => {
      throw new Error("db down");
    });
    const svc = new AnalyticsService(pool);
    await expect(svc.logEvent("page_view", { page: "/check" })).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });

  it("getSummary() runs the aggregate queries and shapes the result", async () => {
    const rowsByQuery = (sql: string) => {
      if (sql.includes("'login'") && sql.includes("date_trunc('hour'")) return { rows: [{ bucket: "2026-01-01T00:00:00Z", count: "3" }] };
      if (sql.includes("'login'") && sql.includes("date_trunc('day'")) return { rows: [{ bucket: "2026-01-01", count: "10" }] };
      if (sql.includes("'page_view'")) return { rows: [{ page: "/check", count: "5" }] };
      if (sql.includes("'analyze'") && sql.includes("date_trunc")) return { rows: [{ bucket: "2026-01-01T00:00:00Z", count: "7" }] };
      if (sql.includes("'analyze'") && sql.includes("GROUP BY verdict")) return { rows: [{ verdict: "allow", count: "6" }] };
      if (sql.includes("'error'")) return { rows: [{ count: "2" }] };
      if (sql.includes("'stuck'")) return { rows: [{ count: "1" }] };
      if (sql.includes("COUNT(DISTINCT wallet)")) return { rows: [{ count: "4" }] };
      if (sql.includes("pro_credits")) return { rows: [{ wallets_with_credits: "3", total_credits: "30", avg_credits: "10" }] };
      if (sql.includes("pro_payments")) return { rows: [{ purchases: "2", total_usdc: "5.5" }] };
      return { rows: [{ event_type: "login", wallet: "0xabc", page: null, chain_id: null, verdict: null, meta: {}, created_at: "2026-01-01" }] };
    };
    const pool = fakePool((...args: unknown[]) => rowsByQuery(args[0] as string));
    const svc = new AnalyticsService(pool);
    const summary = await svc.getSummary(24);
    expect(summary.hours).toBe(24);
    expect(summary.loginsByHour).toEqual([{ bucket: "2026-01-01T00:00:00Z", count: "3" }]);
    expect(summary.errorCount).toBe(2);
    expect(summary.stuckCount).toBe(1);
    expect(summary.uniqueWallets).toBe(4);
    expect(summary.pro).toEqual({ walletsWithCredits: 3, totalCredits: 30, avgCredits: 10 });
    expect(summary.creditsBought).toEqual({ purchases: 2, totalUsdc: 5.5 });
    expect(summary.recentEvents.length).toBe(1);
  });
});
