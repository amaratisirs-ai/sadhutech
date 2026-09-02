import type {
  AnalyzeRequest,
  RiskAssessment,
  RiskFinding,
  Verdict,
} from "@genesis/shared";
import { SEVERITY_SCORE } from "@genesis/shared";
import { decodeTransaction } from "./decode.js";
import { evaluate } from "./rules.js";
import type { ThreatIntel } from "./intel.js";
import type { ThreatIntelPostgres } from "./intel-postgres.js";

/**
 * The Chakravyuha pre-sign gate: decode → evaluate against community intel →
 * score → verdict. "Easy in, hard out": benign txs pass, risky ones are gated.
 * Async-first to support both in-memory and PostgreSQL backends.
 */
export async function analyze(
  req: AnalyzeRequest,
  intel: ThreatIntel | ThreatIntelPostgres
): Promise<RiskAssessment> {
  const simulation = await decodeTransaction(req.tx);
  const findings = await evaluate(simulation, intel);
  const score = scoreOf(findings);
  const verdict = verdictOf(findings, score);
  return {
    verdict,
    score,
    findings,
    simulation,
    summary: summarize(verdict, findings),
    plainEnglish: explain(simulation, findings, verdict),
  };
}

function scoreOf(findings: RiskFinding[]): number {
  if (findings.length === 0) return 0;
  const max = Math.max(...findings.map((f) => SEVERITY_SCORE[f.severity]));
  // Small additive bump for multiple independent medium+ findings, capped at 100.
  const extra = findings.filter((f) => SEVERITY_SCORE[f.severity] >= 40).length - 1;
  return Math.min(100, max + Math.max(0, extra) * 5);
}

function verdictOf(findings: RiskFinding[], score: number): Verdict {
  if (findings.some((f) => f.severity === "critical")) return "block";
  if (score >= 40) return "warn";
  return "allow";
}

function summarize(verdict: Verdict, findings: RiskFinding[]): string {
  if (findings.length === 0) return "No risks detected in this transaction.";
  const top = findings
    .slice()
    .sort((a, b) => SEVERITY_SCORE[b.severity] - SEVERITY_SCORE[a.severity])[0]!;
  const prefix =
    verdict === "block" ? "BLOCKED" : verdict === "warn" ? "CAUTION" : "OK";
  return `${prefix}: ${top.title}.`;
}

function short(a: string): string {
  return `${a.slice(0, 6)}\u2026${a.slice(-4)}`;
}

/** Turns the decoded effect into a sentence a non-technical user understands. */
function explain(
  sim: RiskAssessment["simulation"],
  findings: RiskFinding[],
  verdict: Verdict,
): string {
  const parts: string[] = [];

  if (findings.some((f) => f.id.startsWith("intel.") && f.severity === "critical")) {
    parts.push("One of the addresses involved is a community-confirmed scam/drainer.");
  }

  for (const ap of sim.approvals) {
    const who = short(ap.spender);
    if (ap.kind === "erc721-all") {
      parts.push(`This lets ${who} move ALL of your NFTs in this collection.`);
    } else if (ap.unlimited) {
      const gasless = ap.kind === "permit" ? " without an on-chain transaction" : "";
      parts.push(`This lets ${who} spend an UNLIMITED amount of your tokens${gasless}.`);
    } else {
      parts.push(`This lets ${who} spend up to ${ap.amount} of your tokens.`);
    }
  }

  for (const ch of sim.assetChanges) {
    if (ch.direction === "out") {
      const asset = ch.token === "native" ? "native coin" : "tokens";
      parts.push(`This moves ${ch.amount} ${asset} out of your wallet.`);
    }
  }

  if (sim.method === "multicall") {
    parts.push("It also bundles hidden actions whose real effect isn't shown.");
  }

  if (parts.length === 0) {
    return "No risky permissions or transfers were detected — this looks like a normal transaction.";
  }

  const prefix =
    verdict === "block" ? "Do NOT sign. " : verdict === "warn" ? "Be careful. " : "";
  return prefix + parts.join(" ");
}
