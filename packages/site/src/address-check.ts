import { resolveDecisionOutcome, type DecisionInput, type DecisionVerdict } from "./decision";

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

export type AddressCheckResult = {
  verdict?: DecisionVerdict;
  title: string;
  message: string;
};

export function addressInputError(address: string): AddressCheckResult | null {
  if (ADDRESS_RE.test(address.trim())) return null;
  return {
    title: "Enter a full address",
    message: "Paste an address starting with 0x (42 characters total). Names and other wallet formats are not supported yet.",
  };
}

export function addressCheckResult(analysis: DecisionInput & { findings?: { id?: string; description?: string }[] }): AddressCheckResult {
  const outcome = resolveDecisionOutcome(analysis);
  const intel = analysis.findings?.find((finding) => String(finding.id).startsWith("intel."));
  return {
    verdict: outcome.verdict,
    title: outcome.verdict === "allow" ? "No reports found" : outcome.verdict === "block" ? "Known danger flagged" : "Look closer before interacting",
    message: intel?.description || (outcome.verdict === "allow"
      ? "No known threats found in the current feed. That is not a guarantee of safety; always review what you sign."
      : outcome.reason),
  };
}