import type { RiskFinding, SimulationResult } from "@genesis/shared";
import { ThreatIntel } from "./intel.js";
import { ThreatIntelPostgres } from "./intel-postgres.js";
import { lookupMaliciousAddress } from "./goplus-lookup.js";

/**
 * Derives risk findings from a decoded transaction plus community intel.
 * Rules are intentionally explicit and stable-id'd so they are testable and
 * map 1:1 to what the user is warned about.
 * Async-first to support both in-memory and PostgreSQL backends.
 */
export async function evaluate(
  sim: SimulationResult,
  intel: ThreatIntel | ThreatIntelPostgres,
  chainId: number
): Promise<RiskFinding[]> {
  const findings: RiskFinding[] = [];

  // 1. Counterparties matched against the community threat feed.
  for (const cp of sim.counterparties) {
    const hit = await (intel instanceof ThreatIntel ? Promise.resolve(intel.lookup(cp)) : intel.lookup(cp));
    let confirmedCritical = false;
    if (hit) {
      if (hit.quorumReached) {
        const critical =
          hit.category === "drainer" ||
          hit.category === "malicious-contract" ||
          hit.category === "sanctioned" ||
          hit.category === "decoy-tripwire";
        confirmedCritical = critical;
        findings.push({
          id: `intel.${hit.category}`,
          severity: critical ? "critical" : "high",
          title: `Interacts with a known ${hit.category} address`,
          description:
            `${cp} is community-confirmed as ${hit.category} ` +
            `(${hit.reports} reporters). Signing is strongly discouraged.`,
          subject: cp,
        });
      } else {
        findings.push({
          id: "intel.unconfirmed",
          severity: "medium",
          title: "Interacts with a community-flagged address (unconfirmed)",
          description:
            `${cp} has been reported as ${hit.category} but has not reached quorum ` +
            `(${hit.reports} reporter(s)). Proceed with caution.`,
          subject: cp,
        });
      }
    }

    // Free GoPlus Security cross-check (skipped if our own intel already confirmed
    // this address as critical — no need to spend an external call on it).
    if (!confirmedCritical) {
      const goplus = await lookupMaliciousAddress(cp, chainId);
      if (goplus?.flagged) {
        findings.push({
          id: "goplus.malicious-address",
          severity: "high",
          title: "GoPlus Security flags this address as malicious",
          description: `${cp} is flagged by GoPlus Security (${goplus.reasons.join(", ")}). Proceed with caution.`,
          subject: cp,
        });
      }
    }
  }

  // 2. Approvals — the primary drainer vector.
  for (const ap of sim.approvals) {
    if (ap.kind === "erc721-all") {
      findings.push({
        id: "approval.setApprovalForAll",
        severity: "high",
        title: "Grants control of ALL your NFTs in a collection",
        description:
          `setApprovalForAll would let ${ap.spender} transfer every NFT you own ` +
          `in ${ap.token}. This is a common NFT-drainer pattern.`,
        subject: ap.spender,
      });
    } else if (ap.unlimited) {
      findings.push({
        id: "approval.unlimited",
        severity: "high",
        title: "Grants an UNLIMITED token allowance",
        description:
          `${ap.spender} would be able to move an unlimited amount of ${ap.token} ` +
          `from your wallet, now or later.`,
        subject: ap.spender,
      });
    } else {
      findings.push({
        id: "approval.limited",
        severity: "low",
        title: "Grants a token allowance",
        description: `${ap.spender} may spend up to ${ap.amount} of ${ap.token}.`,
        subject: ap.spender,
      });
    }

    if (ap.kind === "permit") {
      findings.push({
        id: "approval.permit",
        severity: "medium",
        title: "Gasless approval (permit) requested",
        description:
          "permit signatures grant spend rights off-chain and are frequently " +
          "abused by drainers because they don't appear as an on-chain approval.",
        subject: ap.spender,
      });
    }

    if (ap.kind === "permit2") {
      findings.push({
        id: "approval.permit2",
        severity: "medium",
        title: "Permit2 signature requested",
        description:
          "Signing this authorizes a Permit2 transfer/allowance off-chain. It never " +
          "shows up as an on-chain approval until the spender actually uses it, which " +
          "is why drainers favor it.",
        subject: ap.spender,
      });
    }
  }

  // 3. Batched calls hide their true effect behind one outer method.
  if (sim.method === "multicall") {
    findings.push({
      id: "call.multicall",
      severity: "medium",
      title: "Batched call — actions are hidden inside multicall",
      description:
        "This transaction batches multiple sub-calls. Their combined effect is " +
        "not visible from the outer call; drainers use this to obscure approvals.",
    });
  }

  // 4. Marketplace order signatures (e.g. Seaport/OpenSea) can't be price-checked
  // heuristically, but the offer becomes takeable by anyone who fulfills it.
  if (sim.method === "OrderComponents") {
    findings.push({
      id: "signature.marketplace-order",
      severity: "medium",
      title: "Marketplace order signature — verify the price and recipient",
      description:
        "This signs a marketplace order (e.g. Seaport/OpenSea). Once fulfilled, the " +
        "listed item is taken at the terms you signed — double-check you're listing " +
        "the right item for the right price before signing.",
    });
  }

  // 5. Structured data we couldn't decode at all — flag rather than silently allow.
  if (sim.method === "unknown-typed-data") {
    findings.push({
      id: "signature.unknown-typed-data",
      severity: "low",
      title: "Unrecognized structured data signature",
      description:
        "This signs structured (EIP-712) data whose effect we could not decode. " +
        "It may be harmless, but verify the requesting site before signing.",
    });
  }

  return findings;
}
