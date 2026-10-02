import { describe, expect, it, vi } from "vitest";
import { ProAccessService } from "./pro-access.js";

function fakePool(initialCredits: number) {
  let credits = initialCredits;
  const results = new Map<string, unknown>();
  const locks = new Map<string, Promise<void>>();

  const pool = {
    query: async (sql: string, params: unknown[] = []) => {
      if (sql.startsWith("DELETE FROM pro_deep_checks")) return { rows: [] };
      if (sql.startsWith("SELECT result FROM pro_deep_checks")) {
        const result = results.get(`${params[0]}:${params[1]}`);
        return { rows: result === undefined ? [] : [{ result }] };
      }
      if (sql.startsWith("SELECT credits FROM pro_credits")) return { rows: [{ credits }] };
      throw new Error(`Unexpected pool SQL: ${sql}`);
    },
    connect: async () => {
      const releases: (() => void)[] = [];
      return {
        query: async (sql: string, params: unknown[] = []) => {
          if (sql === "BEGIN") return { rows: [] };
          if (sql === "COMMIT" || sql === "ROLLBACK") {
            releases.splice(0).forEach((release) => release());
            return { rows: [] };
          }
          if (sql.includes("pg_advisory_xact_lock")) {
            const key = String(params[0]);
            const previous = locks.get(key) ?? Promise.resolve();
            let unlock!: () => void;
            const current = new Promise<void>((resolve) => { unlock = resolve; });
            locks.set(key, current);
            await previous;
            releases.push(() => {
              unlock();
              if (locks.get(key) === current) locks.delete(key);
            });
            return { rows: [] };
          }
          if (sql.startsWith("DELETE FROM pro_deep_checks")) return { rows: [] };
          if (sql.startsWith("SELECT result FROM pro_deep_checks")) {
            const result = results.get(`${params[0]}:${params[1]}`);
            return { rows: result === undefined ? [] : [{ result }] };
          }
          if (sql.startsWith("SELECT credits FROM pro_credits")) {
            return { rows: [{ credits }] };
          }
          if (sql.startsWith("UPDATE pro_credits SET credits = credits - 1")) {
            if (credits < 1) return { rows: [] };
            credits -= 1;
            return { rows: [{ credits }] };
          }
          if (sql.includes("INSERT INTO pro_deep_checks")) {
            results.set(`${params[0]}:${params[1]}`, params[2]);
            return { rows: [] };
          }
          throw new Error(`Unexpected SQL: ${sql}`);
        },
        release: () => releases.splice(0).forEach((release) => release()),
      };
    },
  };

  return { pool: pool as any, getCredits: () => credits };
}

describe("ProAccessService.runDeepCheckOnce", () => {
  const requestKey = "a".repeat(64);

  it("charges once and returns the saved full result on repeat", async () => {
    const fake = fakePool(2);
    const service = new ProAccessService(fake.pool);
    const run = vi.fn(async () => ({ verdict: "warn", findings: ["goplus", "chainabuse"] }));

    const first = await service.runDeepCheckOnce("0xABC", requestKey, run);
    const repeated = await service.runDeepCheckOnce("0xabc", requestKey, run);

    expect(first).toEqual({ value: { verdict: "warn", findings: ["goplus", "chainabuse"] }, creditsLeft: 1, cached: false });
    expect(repeated).toEqual({ value: { verdict: "warn", findings: ["goplus", "chainabuse"] }, creditsLeft: 1, cached: true });
    expect(run).toHaveBeenCalledTimes(1);
    expect(fake.getCredits()).toBe(1);
  });

  it("serializes concurrent duplicate requests so only one runs and charges", async () => {
    const fake = fakePool(1);
    const service = new ProAccessService(fake.pool);
    const run = vi.fn(async () => {
      await Promise.resolve();
      return { verdict: "allow" };
    });

    const results = await Promise.all([
      service.runDeepCheckOnce("0xabc", requestKey, run),
      service.runDeepCheckOnce("0xabc", requestKey, run),
    ]);

    expect(run).toHaveBeenCalledTimes(1);
    expect(results.map((result) => result?.cached).sort()).toEqual([false, true]);
    expect(fake.getCredits()).toBe(0);
  });

  it("rechecks the persistent cache when duplicate requests reach separate instances", async () => {
    const fake = fakePool(1);
    const firstService = new ProAccessService(fake.pool);
    const secondService = new ProAccessService(fake.pool);
    let finishBoth!: () => void;
    const bothStarted = new Promise<void>((resolve) => { finishBoth = resolve; });
    let started = 0;
    const firstRun = vi.fn(async () => {
      started += 1;
      if (started === 2) finishBoth();
      await bothStarted;
      return { verdict: "warn", source: "first" };
    });
    const secondRun = vi.fn(async () => {
      started += 1;
      if (started === 2) finishBoth();
      await bothStarted;
      return { verdict: "warn", source: "second" };
    });

    const results = await Promise.all([
      firstService.runDeepCheckOnce("0xabc", requestKey, firstRun),
      secondService.runDeepCheckOnce("0xabc", requestKey, secondRun),
    ]);

    expect(firstRun).toHaveBeenCalledOnce();
    expect(secondRun).toHaveBeenCalledOnce();
    expect(results.map((result) => result?.cached).sort()).toEqual([false, true]);
    expect(results[0]?.value).toEqual(results[1]?.value);
    expect(fake.getCredits()).toBe(0);
  });

  it("does not run providers or charge when the wallet has no credits", async () => {
    const fake = fakePool(0);
    const service = new ProAccessService(fake.pool);
    const run = vi.fn(async () => ({ verdict: "allow" }));

    await expect(service.runDeepCheckOnce("0xabc", requestKey, run)).resolves.toBeNull();

    expect(run).not.toHaveBeenCalled();
    expect(fake.getCredits()).toBe(0);
  });

  it("rolls back debit and cached result if analysis fails", async () => {
    const fake = fakePool(1);
    const service = new ProAccessService(fake.pool);
    const run = vi.fn(async () => { throw new Error("analysis failed"); });

    await expect(service.runDeepCheckOnce("0xabc", requestKey, run)).rejects.toThrow("analysis failed");

    expect(fake.getCredits()).toBe(1);
    await expect(service.runDeepCheckOnce("0xabc", requestKey, async () => ({ verdict: "allow" })))
      .resolves.toMatchObject({ cached: false, creditsLeft: 0 });
  });
});