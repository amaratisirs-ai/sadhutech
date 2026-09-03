export type DecisionVerdict = "allow" | "warn" | "block";

export interface DecisionInput {
  verdict?: DecisionVerdict | string | null;
  score?: number;
  plainEnglish?: string;
}

export interface DecisionOutcome {
  verdict: DecisionVerdict;
  label: "Allow" | "Warn" | "Block";
  canContinue: boolean;
  reason: string;
}

export function resolveDecisionOutcome(input: DecisionInput): DecisionOutcome {
  const verdict = (input.verdict ?? "warn") as DecisionVerdict | string;

  if (verdict === "block") {
    return {
      verdict: "block",
      label: "Block",
      canContinue: false,
      reason: input.plainEnglish || "This transaction matches a known malicious pattern and should not be signed.",
    };
  }

  if (verdict === "allow") {
    return {
      verdict: "allow",
      label: "Allow",
      canContinue: true,
      reason: input.plainEnglish || "This transaction appears safe based on the current checks.",
    };
  }

  const warnReason = input.plainEnglish || "This transaction is risky and should be reviewed before signing.";

  return {
    verdict: "warn",
    label: "Warn",
    canContinue: false,
    reason: warnReason,
  };
}
