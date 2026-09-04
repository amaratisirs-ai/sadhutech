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

/**
 * Pay-as-you-go check credits, paid in USDC on Base from the user's own wallet.
 * Pay any amount ≥ MIN_USDC → get floor(usdc × CREDITS_PER_USDC) credits.
 * No custody, no recurring, no account — the wallet address holds the balance.
 */
export class ProAccessService {
  private pool: Pool;
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
