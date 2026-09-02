import type { Address, TxRequest, SimulationResult, Approval, AssetChange } from "@genesis/shared";
import { decodeFunctionResult, parseAbi } from "viem";

/**
 * Fork-backed transaction simulator: execute transactions against a forked
 * blockchain state to see their actual effects. Used for multicall decoding
 * and accurate approval/transfer detection.
 *
 * Supports Tenderly (free, API-based) or Anvil (local, requires running daemon).
 */

export interface ForkSimulatorConfig {
  provider: "tenderly" | "anvil";
  /** Tenderly: API key from https://dashboard.tenderly.co */
  tenderlyApiKey?: string;
  /** Tenderly: project slug */
  tenderlyProject?: string;
  /** Anvil: localhost URL (default: http://127.0.0.1:8545) */
  anvilUrl?: string;
}

export class ForkSimulator {
  constructor(private config: ForkSimulatorConfig) {
    if (config.provider === "tenderly" && !config.tenderlyApiKey) {
      throw new Error("ForkSimulator: Tenderly API key required");
    }
  }

  /**
   * Simulate a transaction against a forked chain state.
   * Returns decoded approvals and asset changes from actual execution.
   */
  async simulate(tx: TxRequest): Promise<SimulationResult | null> {
    try {
      if (this.config.provider === "tenderly") {
        return await this.simulateTenderly(tx);
      } else {
        return await this.simulateAnvil(tx);
      }
    } catch (err) {
      console.error("[fork-simulator] Simulation failed, falling back to heuristic:", err);
      return null; // Fall back to heuristic decoding
    }
  }

  private async simulateTenderly(tx: TxRequest): Promise<SimulationResult | null> {
    if (!this.config.tenderlyApiKey || !this.config.tenderlyProject) {
      return null;
    }

    const chainId = tx.chainId;
    // Map Ethereum chain IDs to Tenderly network names
    const networkMap: Record<number, string> = {
      1: "mainnet",
      137: "polygon",
      42161: "arbitrum-one",
      8453: "base",
    };

    const network = networkMap[chainId];
    if (!network) {
      console.warn(`[fork-simulator] Unsupported chain: ${chainId}`);
      return null;
    }

    const url = `https://api.tenderly.co/api/v1/account/me/project/${this.config.tenderlyProject}/fork`;

    try {
      // 1. Create fork
      const forkRes = await fetch(url, {
        method: "POST",
        headers: {
          "X-Access-Key": this.config.tenderlyApiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          network_id: network,
        }),
      });

      if (!forkRes.ok) {
        throw new Error(`Tenderly fork failed: ${forkRes.statusText}`);
      }

      const fork = (await forkRes.json()) as { simulation_fork: { id: string } };
      const forkId = fork.simulation_fork.id;

      // 2. Simulate tx on fork
      const simUrl = `https://api.tenderly.co/api/v1/account/me/project/${this.config.tenderlyProject}/fork/${forkId}/simulate`;
      const simRes = await fetch(simUrl, {
        method: "POST",
        headers: {
          "X-Access-Key": this.config.tenderlyApiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          network_id: network,
          from: tx.from,
          to: tx.to,
          input: tx.data || "0x",
          value: tx.value || "0",
          save: false,
        }),
      });

      if (!simRes.ok) {
        throw new Error(`Tenderly simulate failed: ${simRes.statusText}`);
      }

      const simResult = (await simRes.json()) as any;

      // 3. Parse trace and extract approvals/transfers
      return this.parseTraceResult(simResult, tx.from);
    } catch (err) {
      console.error("[fork-simulator] Tenderly simulation error:", err);
      return null;
    }
  }

  private async simulateAnvil(_tx: TxRequest): Promise<SimulationResult | null> {
    // Anvil support would require:
    // 1. Assume anvil is running on anvilUrl
    // 2. Use eth_call to execute transaction
    // 3. Use eth_getTransactionReceipt + debug_traceTransaction to see transfers
    // For MVP, we'll stub this and document the implementation path.
    console.warn("[fork-simulator] Anvil support not yet implemented. Use Tenderly for now.");
    return null;
  }

  private parseTraceResult(result: any, fromAddress: Address): SimulationResult | null {
    // Extract approvals and transfers from Tenderly trace
    // This is a simplified parser — full implementation would decode logs.
    const approvals: Approval[] = [];
    const assetChanges: AssetChange[] = [];
    const counterparties = new Set<Address>();

    // Parse events from trace
    if (result.logs && Array.isArray(result.logs)) {
      for (const log of result.logs) {
        // Approval event: Approval(indexed owner, indexed spender, uint256 value)
        if (log.topics[0] === "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925") {
          const spender = `0x${log.topics[2]?.slice(-40)}`.toLowerCase() as Address;
          counterparties.add(spender);
          approvals.push({
            kind: "erc20",
            token: log.address.toLowerCase() as Address,
            spender,
            amount: "0x" + log.data.slice(2),
            unlimited: false, // Would need to check if value is max-uint
          });
        }
        // Transfer event: Transfer(indexed from, indexed to, uint256 value)
        else if (log.topics[0] === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
          const to = `0x${log.topics[2]?.slice(-40)}`.toLowerCase() as Address;
          counterparties.add(to);
          const amount = "0x" + log.data.slice(2);
          const direction = `0x${log.topics[1]?.slice(-40)}`.toLowerCase() === fromAddress.toLowerCase() ? "out" : "in";
          assetChanges.push({
            direction: direction as "in" | "out",
            token: log.address.toLowerCase() as Address,
            amount,
          });
        }
      }
    }

    return {
      approvals,
      assetChanges,
      counterparties: Array.from(counterparties),
      heuristic: false, // Fork simulation is ground truth
    };
  }
}

/**
 * Factory: create simulator if configured, return null otherwise.
 * Graceful: if simulator is not configured, returns null and decode falls back to heuristic.
 */
export function createForkSimulator(): ForkSimulator | null {
  const apiKey = process.env.TENDERLY_API_KEY;
  const project = process.env.TENDERLY_PROJECT;

  if (!apiKey || !project) {
    console.log("[fork-simulator] Not configured (TENDERLY_API_KEY or TENDERLY_PROJECT missing). Using heuristic decoding.");
    return null;
  }

  try {
    return new ForkSimulator({
      provider: "tenderly",
      tenderlyApiKey: apiKey,
      tenderlyProject: project,
    });
  } catch (err) {
    console.error("[fork-simulator] Failed to initialize:", err);
    return null;
  }
}
