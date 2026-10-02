import { Pool } from "pg";
import { createPublicClient, http, parseAbiItem, getAddress } from "viem";
import { base } from "viem/chains";

// Native USDC on Base (6 decimals).
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const TRANSFER_EVENT = parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)");
const MIN_USDC = Number(process.env.PRO_MIN_USDC ?? "1");
const CREDITS_PER_USDC = Number(process.env.PRO_CREDITS_PER_USDC ?? "1");

export interface VerifyResult {
  ok: boolean;
  error?: string;
  credited?: number;
  balance?: number;
}

export interface DeepCheckOnceResult<T> {
  value: T;
  creditsLeft: number;
  cached: boolean;
}

/**
 * Pay-as-you-go check credits, paid in USDC on Base from the user's own wallet.
 * Pay any amount ≥ MIN_USDC → get floor(usdc × CREDITS_PER_USDC) credits.
 * No custody, no recurring, no account — the wallet address holds the balance.
 */
export class ProAccessService {
  private pool: Pool;
  private deepChecksInFlight = new Map<string, Promise<DeepCheckOnceResult<unknown> | null>>();
  private client = createPublicClient({
    chain: base,
    transport: http(process.env.BASE_RPC_URL || undefined),
  });

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async initialize(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS pro_payments (
        tx_hash TEXT PRIMARY KEY,
        address TEXT NOT NULL,
        amount TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS pro_credits (
        address TEXT PRIMARY KEY,
        credits INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS pro_deep_checks (
        address TEXT NOT NULL,
        request_key TEXT NOT NULL,
        result JSONB NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (address, request_key)
      );
      CREATE INDEX IF NOT EXISTS pro_deep_checks_expires_at_idx ON pro_deep_checks (expires_at);
    `);
  }

  async getStatus(address: string): Promise<{ credits: number }> {
    const r = await this.pool.query("SELECT credits FROM pro_credits WHERE address = $1", [address.toLowerCase()]);
    return { credits: r.rows[0]?.credits ?? 0 };
  }

  /** Spend `n` credits if available; returns new balance or null if insufficient. */
  async consume(address: string, n = 1): Promise<number | null> {
    const r = await this.pool.query(
      "UPDATE pro_credits SET credits = credits - $2, updated_at = NOW() WHERE address = $1 AND credits >= $2 RETURNING credits",
      [address.toLowerCase(), n]
    );
    return r.rows[0]?.credits ?? null;
  }

  async runDeepCheckOnce<T>(
    address: string,
    requestKey: string,
    run: () => Promise<T>
  ): Promise<DeepCheckOnceResult<T> | null> {
    const wallet = address.toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(requestKey)) throw new Error("Invalid deep-check request key.");
    const cacheKey = `${wallet}:${requestKey}`;
    const pending = this.deepChecksInFlight.get(cacheKey);
    if (pending) {
      const result = await pending;
      return result ? { ...result, cached: true } as DeepCheckOnceResult<T> : null;
    }

    const task = this.runDeepCheckOnceInternal(wallet, requestKey, run);
    this.deepChecksInFlight.set(cacheKey, task as Promise<DeepCheckOnceResult<unknown> | null>);
    try {
      return await task;
    } finally {
      if (this.deepChecksInFlight.get(cacheKey) === task) this.deepChecksInFlight.delete(cacheKey);
    }
  }

  private async runDeepCheckOnceInternal<T>(
    wallet: string,
    requestKey: string,
    run: () => Promise<T>
  ): Promise<DeepCheckOnceResult<T> | null> {
    const cached = await this.pool.query(
      "SELECT result FROM pro_deep_checks WHERE address = $1 AND request_key = $2 AND expires_at > NOW()",
      [wallet, requestKey]
    );
    if (cached.rows[0]) {
      const balance = await this.getStatus(wallet);
      return { value: cached.rows[0].result as T, creditsLeft: balance.credits, cached: true };
    }

    if ((await this.getStatus(wallet)).credits < 1) return null;

    const value = await run();
    const client = await this.pool.connect();
    let transactionOpen = false;

    try {
      await client.query("BEGIN");
      transactionOpen = true;
      await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [`${wallet}:${requestKey}`]);
      await client.query("DELETE FROM pro_deep_checks WHERE address = $1 AND expires_at <= NOW()", [wallet]);

      const committed = await client.query(
        "SELECT result FROM pro_deep_checks WHERE address = $1 AND request_key = $2 AND expires_at > NOW()",
        [wallet, requestKey]
      );
      if (committed.rows[0]) {
        const balance = await client.query("SELECT credits FROM pro_credits WHERE address = $1 FOR UPDATE", [wallet]);
        await client.query("COMMIT");
        transactionOpen = false;
        return {
          value: committed.rows[0].result as T,
          creditsLeft: balance.rows[0]?.credits ?? 0,
          cached: true,
        };
      }

      const balance = await client.query("SELECT credits FROM pro_credits WHERE address = $1 FOR UPDATE", [wallet]);
      if (!balance.rows[0] || balance.rows[0].credits < 1) {
        await client.query("COMMIT");
        transactionOpen = false;
        return null;
      }

      const debit = await client.query(
        "UPDATE pro_credits SET credits = credits - 1, updated_at = NOW() WHERE address = $1 AND credits >= 1 RETURNING credits",
        [wallet]
      );
      if (!debit.rows[0]) {
        await client.query("ROLLBACK");
        transactionOpen = false;
        return null;
      }

      await client.query(
        `INSERT INTO pro_deep_checks (address, request_key, result, expires_at)
         VALUES ($1, $2, $3, NOW() + INTERVAL '24 hours')
         ON CONFLICT (address, request_key) DO UPDATE
         SET result = EXCLUDED.result, expires_at = EXCLUDED.expires_at, created_at = NOW()`,
        [wallet, requestKey, value]
      );
      await client.query("COMMIT");
      transactionOpen = false;
      return { value, creditsLeft: debit.rows[0].credits, cached: false };
    } catch (error) {
      if (transactionOpen) await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  /** Confirm USDC payment(s) on Base from `address` and add check credits. */
  async verifyPayment(address: string): Promise<VerifyResult> {
    const payTo = process.env.PAYMENT_ADDRESS;
    if (!payTo) return { ok: false, error: "Payments aren't configured yet." };

    const minUnits = BigInt(Math.round(MIN_USDC * 1_000_000));
    const from = getAddress(address);
    const to = getAddress(payTo);

    let logs;
    try {
      const latest = await this.client.getBlockNumber();
      const fromBlock = latest > 5000n ? latest - 5000n : 0n; // ~last few hours on Base
      logs = await this.client.getLogs({
        address: USDC_BASE,
        event: TRANSFER_EVENT,
        args: { from, to },
        fromBlock,
        toBlock: latest,
      });
    } catch {
      return { ok: false, error: "Couldn't read the chain right now. Try again shortly." };
    }

    let credited = 0;
    for (const log of logs) {
      const value = (log.args as { value?: bigint }).value ?? 0n;
      if (value < minUnits) continue;
      const txHash = log.transactionHash;
      if (!txHash) continue;

      const seen = await this.pool.query("SELECT 1 FROM pro_payments WHERE tx_hash = $1", [txHash]);
      if ((seen.rowCount ?? 0) > 0) continue; // already redeemed

      const usdc = Number(value) / 1_000_000;
      const add = Math.floor(usdc * CREDITS_PER_USDC);
      if (add <= 0) continue;

      await this.pool.query("INSERT INTO pro_payments (tx_hash, address, amount) VALUES ($1, $2, $3)", [
        txHash,
        from.toLowerCase(),
        value.toString(),
      ]);
      await this.pool.query(
        `INSERT INTO pro_credits (address, credits) VALUES ($1, $2)
         ON CONFLICT (address) DO UPDATE SET credits = pro_credits.credits + $2, updated_at = NOW()`,
        [from.toLowerCase(), add]
      );
      credited += add;
    }

    if (credited === 0) {
      return { ok: false, error: "No new payment found yet. If you just paid, wait ~30s and retry." };
    }
    const balance = (await this.getStatus(address)).credits;
    return { ok: true, credited, balance };
  }
}

export function createProAccessService(pool: Pool): ProAccessService {
  return new ProAccessService(pool);
}
