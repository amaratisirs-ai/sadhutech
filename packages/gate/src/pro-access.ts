import { Pool } from "pg";
import { createPublicClient, http, parseAbiItem, getAddress, type PublicClient } from "viem";
import { base } from "viem/chains";

// Native USDC on Base (6 decimals).
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const TRANSFER_EVENT = parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)");
const PASS_DAYS = 30;

export interface VerifyResult {
  ok: boolean;
  error?: string;
  expiresAt?: string;
}

/**
 * Wallet-based Pro access with crypto "verify-on-demand" payments.
 * User pays USDC (Base) from their wallet to PAYMENT_ADDRESS; we read the chain
 * to confirm the transfer and grant a time-based pass. No custody, no recurring.
 */
export class ProAccessService {
  private pool: Pool;
  private client: PublicClient;

  constructor(pool: Pool) {
    this.pool = pool;
    this.client = createPublicClient({
      chain: base,
      transport: http(process.env.BASE_RPC_URL || undefined),
    });
  }

  async initialize(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS pro_access (
        address TEXT PRIMARY KEY,
        expires_at TIMESTAMPTZ NOT NULL,
        tx_hash TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS pro_payments (
        tx_hash TEXT PRIMARY KEY,
        address TEXT NOT NULL,
        amount TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_pro_access_expires ON pro_access(expires_at);
    `);
  }

  async hasAccess(address: string): Promise<boolean> {
    const r = await this.pool.query(
      "SELECT 1 FROM pro_access WHERE address = $1 AND expires_at > NOW()",
      [address.toLowerCase()]
    );
    return (r.rowCount ?? 0) > 0;
  }

  async getStatus(address: string): Promise<{ pro: boolean; expiresAt: string | null }> {
    const r = await this.pool.query("SELECT expires_at FROM pro_access WHERE address = $1", [address.toLowerCase()]);
    const expiresAt: Date | null = r.rows[0]?.expires_at ?? null;
    return { pro: expiresAt ? new Date(expiresAt) > new Date() : false, expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null };
  }

  /**
   * Confirm a recent USDC payment from `address` to PAYMENT_ADDRESS and grant/extend a pass.
   */
  async verifyPayment(address: string): Promise<VerifyResult> {
    const payTo = process.env.PAYMENT_ADDRESS;
    if (!payTo) return { ok: false, error: "Payments aren't configured yet." };

    const priceUnits = BigInt(process.env.PRO_PRICE_USDC ?? "20") * 10n ** 6n;
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
    } catch (err) {
      return { ok: false, error: `Couldn't read the chain right now. Try again shortly.` };
    }

    for (const log of logs) {
      const value = (log.args as { value?: bigint }).value ?? 0n;
      if (value < priceUnits) continue;
      const txHash = log.transactionHash;
      if (!txHash) continue;

      const seen = await this.pool.query("SELECT 1 FROM pro_payments WHERE tx_hash = $1", [txHash]);
      if ((seen.rowCount ?? 0) > 0) continue; // already redeemed

      await this.pool.query("INSERT INTO pro_payments (tx_hash, address, amount) VALUES ($1, $2, $3)", [
        txHash,
        from.toLowerCase(),
        value.toString(),
      ]);
      const r = await this.pool.query(
        `INSERT INTO pro_access (address, expires_at, tx_hash)
         VALUES ($1, NOW() + INTERVAL '${PASS_DAYS} days', $2)
         ON CONFLICT (address) DO UPDATE SET
           expires_at = GREATEST(pro_access.expires_at, NOW()) + INTERVAL '${PASS_DAYS} days',
           tx_hash = $2,
           updated_at = NOW()
         RETURNING expires_at;`,
        [from.toLowerCase(), txHash]
      );
      return { ok: true, expiresAt: new Date(r.rows[0].expires_at).toISOString() };
    }

    return { ok: false, error: "No qualifying payment found yet. If you just paid, wait ~30s and retry." };
  }
}

export function createProAccessService(pool: Pool): ProAccessService {
  return new ProAccessService(pool);
}
