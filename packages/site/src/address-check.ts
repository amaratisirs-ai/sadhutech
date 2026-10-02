import { resolveDecisionOutcome, type DecisionInput, type DecisionVerdict } from "./decision";

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

export type AddressFinding = { id?: string; title?: string; description?: string; severity?: string };

export type AddressCheckResult = {
  verdict?: DecisionVerdict;
  title: string;
  message: string;
  signals?: { title: string; description: string }[];
};

export type AddressAnalysis = DecisionInput & { findings?: AddressFinding[] };

export function addressProbe(address: string) {
  return { chainId: 1, from: "0x1111111111111111111111111111111111111111", to: address, value: "0", data: "0x00000000" };
}

export function addressInputError(address: string): AddressCheckResult | null {
  if (ADDRESS_RE.test(address.trim())) return null;
  return {
    title: "Enter a full address",
    message: "Paste an address starting with 0x (42 characters total). Names and other wallet formats are not supported yet.",
  };
}

export function addressCheckResult(analysis: AddressAnalysis): AddressCheckResult {
  const outcome = resolveDecisionOutcome(analysis);
  const community = analysis.findings?.find((finding) => finding.id?.startsWith("intel.") && finding.id !== "intel.chainabuse");
  const independent = analysis.findings?.find((finding) => finding.id?.startsWith("goplus."));
  const paid = analysis.findings?.find((finding) => finding.id === "intel.chainabuse");
  const signals = analysis.findings?.flatMap((finding) => {
    if (finding.id === "intel.chainabuse") return [{ title: "Deep-check source (ChainAbuse)", description: "The additional paid lookup found reports about this address." }];
    if (finding.id?.startsWith("intel.")) return [{ title: "Community report", description: finding.id === "intel.unconfirmed" ? "Reported by the community, but not yet confirmed by enough independent reporters." : "Confirmed in the community threat feed." }];
    if (finding.id?.startsWith("goplus.")) return [{ title: "Independent security feed (GoPlus)", description: "This address was flagged by another security provider. Check the context before interacting." }];
    return [];
  });
  return {
    verdict: outcome.verdict,
    title: outcome.verdict === "allow" ? "No reports found" : outcome.verdict === "block" ? "Known danger flagged" : "Look closer before interacting",
    message: community || independent || paid
      ? [community && (community.id === "intel.unconfirmed" ? "A community report is awaiting confirmation." : "A community threat has been confirmed."), independent && "An independent security feed also flagged this address.", paid && "The additional deep check found reports about this address.", outcome.verdict === "block" ? "Avoid interacting with it." : "Review the details before interacting."].filter(Boolean).join(" ")
      : outcome.verdict === "allow"
      ? "No known threats found in the current feed. That is not a guarantee of safety; always review what you sign."
      : outcome.reason,
    signals,
  };
}

export function addressCheckHandoff(address: string, analysis: AddressAnalysis) {
  const summary = addressCheckResult(analysis);
  return {
    mode: "address",
    addressInput: address,
    lastTx: addressProbe(address),
    result: {
      title: `Safety check · ${address.slice(0, 6)}…${address.slice(-4)}`,
      outcome: resolveDecisionOutcome(analysis),
      message: summary.message,
      findings: summary.signals?.map((signal) => ({ id: "source", title: signal.title, description: signal.description, severity: "info" })) ?? [],
    },
  };
}