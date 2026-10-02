import { describe, expect, it, vi } from "vitest";
import type { Address, RiskAssessment } from "@genesis/shared";
import { runDeepCheckProviders } from "./deep-check-providers.js";

const ADDRESS = "0x1111111111111111111111111111111111111111" as Address;

function analysis(): RiskAssessment {
  return {
    verdict: "warn",
    score: 70,
    findings: [{ id: "goplus.malicious-address", severity: "high", title: "Third-party address warning", description: "Flagged." }],
    simulation: { approvals: [], assetChanges: [], counterparties: ["0x1111111111111111111111111111111111111111"], heuristic: true },
    summary: "Warning",
    plainEnglish: "Review this address.",
  };
}

describe("runDeepCheckProviders", () => {
  it("runs GoPlus analysis before ChainAbuse and returns the combined result", async () => {
    const order: string[] = [];
    const result = await runDeepCheckProviders(
      ADDRESS,
      async () => { order.push("goplus"); return analysis(); },
      async () => { order.push("chainabuse"); return { flagged: true, reports: 2 }; }
    );

    expect(order).toEqual(["goplus", "chainabuse"]);
    expect(result.complete).toBe(true);
    if (result.complete) {
      expect(result.analysis.findings.map((finding) => finding.id)).toEqual([
        "goplus.malicious-address",
        "intel.chainabuse",
      ]);
      expect(result.analysis.verdict).toBe("block");
      expect(result.analysis.findings[1]?.subject).toBe(ADDRESS);
    }
  });

  it("preserves the GoPlus result when ChainAbuse is unavailable", async () => {
    const runGoPlus = vi.fn(async () => analysis());
    const result = await runDeepCheckProviders(ADDRESS, runGoPlus, async () => null);

    expect(runGoPlus).toHaveBeenCalledOnce();
    expect(result.complete).toBe(false);
    expect(result.analysis.findings.map((finding) => finding.id)).toContain("goplus.malicious-address");
  });

  it("returns a complete clean result when ChainAbuse has no reports", async () => {
    const result = await runDeepCheckProviders(ADDRESS, async () => analysis(), async () => ({ flagged: false }));
    expect(result.complete).toBe(true);
    if (result.complete) expect(result.analysis.findings.map((finding) => finding.id)).not.toContain("intel.chainabuse");
  });
});