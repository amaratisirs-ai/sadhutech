import type { Address, RiskAssessment } from "@genesis/shared";
import type { ChainAbuseHit } from "./chainabuse-lookup.js";

export type DeepCheckProviderResult =
  | { complete: true; analysis: RiskAssessment; hit: ChainAbuseHit }
  | { complete: false; analysis: RiskAssessment };

export async function runDeepCheckProviders(
  address: Address,
  runGoPlusAnalysis: () => Promise<RiskAssessment>,
  runChainAbuseLookup: () => Promise<ChainAbuseHit | null>
): Promise<DeepCheckProviderResult> {
  const analysis = await runGoPlusAnalysis();
  const hit = await runChainAbuseLookup();
  if (!hit) return { complete: false, analysis };

  if (hit.flagged) {
    analysis.findings.push({
      id: "intel.chainabuse",
      severity: "critical",
      title: "Interacts with an address reported in a third-party threat database",
      description: `This address has ${hit.reports || 1} report(s) in an independent scam-report database.`,
      subject: address,
    });
    analysis.verdict = "block";
  }

  return { complete: true, analysis, hit };
}