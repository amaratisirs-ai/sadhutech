import type { AnalyzeRequest, RiskAssessment } from "@genesis/shared";

/**
 * GENESIS WalletConnect Middleware — pre-sign transaction firewall.
 * Simple request/response adapter for WalletConnect wallets to submit transactions
 * to GENESIS gate for risk analysis before signing.
 */
export interface WCMiddlewareConfig {
  gateUrl: string; // GENESIS gate API endpoint (e.g., http://localhost:8787)
}

export interface WCTransactionRequest {
  chainId: number;
  from: string;
  to: string;
  value?: string;
  data?: string;
}

/**
 * Adapter for WalletConnect wallets to analyze transactions via GENESIS gate.
 * Implements the same verdict logic (allow/warn/block) with plain-English explanations.
 */
export class GENESISWCMiddleware {
  constructor(private readonly config: WCMiddlewareConfig) {}

  /**
   * Analyze a WalletConnect transaction before the user signs it.
   * Returns a risk assessment with verdict (allow/warn/block) and explanation.
   */
  async analyzeTransaction(tx: WCTransactionRequest): Promise<RiskAssessment> {
    const payload: AnalyzeRequest = {
      tx: {
        chainId: tx.chainId,
        from: tx.from as `0x${string}`,
        to: tx.to as `0x${string}`,
        value: tx.value || "0",
        data: (tx.data || "0x") as `0x${string}`,
      },
    };

    const response = await fetch(`${this.config.gateUrl}/v1/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`GENESIS gate error ${response.status}: ${await response.text()}`);
    }

    return (await response.json()) as RiskAssessment;
  }

  /**
   * Report a suspected malicious address to the community threat intel.
   * Contributes to Sybil-resistant quorum voting on threats.
   */
  async reportThreat(
    address: string,
    category: "drainer" | "malicious-contract" | "decoy-tripwire" | "sanctioned" | "phishing",
    reporterId: string
  ): Promise<any> {
    const response = await fetch(`${this.config.gateUrl}/v1/report`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ address, category, reporterId }),
    });

    if (!response.ok) {
      throw new Error(`GENESIS gate error ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

  /**
   * Health check: verify GENESIS gate is reachable.
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.gateUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}
