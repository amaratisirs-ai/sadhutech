import type { OnTransactionHandler } from "@metamask/snaps-sdk";
import { panel, heading, text, divider } from "@metamask/snaps-sdk";

/**
 * URL of the GENESIS Chakravyuha pre-sign gate. Point this at your deployed gate;
 * defaults to a local dev instance.
 */
const GATE_URL = "http://localhost:8787/v1/analyze";

interface GateFinding {
  id: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
}

interface GateResult {
  verdict: "allow" | "warn" | "block";
  score: number;
  findings: GateFinding[];
  summary: string;
}

const VERDICT_LABEL: Record<GateResult["verdict"], string> = {
  allow: "OK — no risks detected",
  warn: "CAUTION — review before signing",
  block: "DANGER — do not sign",
};

/**
 * Intercepts every transaction MetaMask is about to sign and shows the GENESIS
 * risk assessment inline in the confirmation UI. This is the wallet-boundary
 * interception point for the fast-path MVP — zero key custody.
 */
export const onTransaction: OnTransactionHandler = async ({ transaction, chainId }) => {
  const numericChainId = Number((chainId ?? "eip155:1").split(":")[1] ?? "1");

  let result: GateResult;
  try {
    const response = await fetch(GATE_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        tx: {
          chainId: numericChainId,
          from: transaction.from,
          to: transaction.to,
          value: transaction.value,
          data: transaction.data ?? "0x",
        },
      }),
    });
    result = (await response.json()) as GateResult;
  } catch {
    return {
      content: panel([
        heading("GENESIS Firewall"),
        text("Could not reach the pre-sign gate. Proceed with caution."),
      ]),
    };
  }

  const content = [
    heading("GENESIS Firewall"),
    text(`**${VERDICT_LABEL[result.verdict]}** (risk ${result.score}/100)`),
    text(result.summary),
  ];

  if (result.findings.length > 0) {
    content.push(divider(), heading("Findings"));
    for (const f of result.findings) {
      content.push(text(`**${f.severity.toUpperCase()}** — ${f.title}`));
      content.push(text(f.description));
    }
  }

  return { content: panel(content) };
};
