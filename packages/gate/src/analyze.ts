import type {
  AnalyzeRequest,
  AnalyzeSignatureRequest,
  RiskAssessment,
  RiskFinding,
  SimulationResult,
  Verdict,
} from "@genesis/shared";
import { SEVERITY_SCORE } from "@genesis/shared";
import { decodeTransaction } from "./decode.js";
import { decodeSignature } from "./decode-signature.js";
import { evaluate } from "./rules.js";
import { lookupPhishingSite } from "./goplus-lookup.js";
import type { ThreatIntel } from "./intel.js";
import type { ThreatIntelPostgres } from "./intel-postgres.js";
import type { AuditLogService } from "./audit-log.js";

/**
 * The Chakravyuha pre-sign gate: decode → evaluate against community intel →
 * score → verdict. "Easy in, hard out": benign txs pass, risky ones are gated.
 * Async-first to support both in-memory and PostgreSQL backends.
 */
export async function analyze(
  req: AnalyzeRequest,
  intel: ThreatIntel | ThreatIntelPostgres,
  auditLog?: AuditLogService
): Promise<RiskAssessment> {
  const simulation = await decodeTransaction(req.tx);
  return finalize(simulation, intel, req.tx.chainId, [], auditLog);
}

/**
 * Signature-side counterpart to analyze(): screens eth_signTypedData/personal_sign
 * requests, since most modern drainers steal funds via a blind signature (permit,
 * Permit2, Seaport order) rather than an on-chain transaction.
 */
export async function analyzeSignature(
  req: AnalyzeSignatureRequest,
  intel: ThreatIntel | ThreatIntelPostgres,
  auditLog?: AuditLogService
): Promise<RiskAssessment> {
  const simulation = decodeSignature(req.sig);

  const extraFindings: RiskFinding[] = [];
  if (req.sig.origin) {
    const phishing = await lookupPhishingSite(req.sig.origin, (reason) =>
      void auditLog?.logIntegrationFailure("goplus-phishing", reason)
    );
    if (phishing?.flagged) {
      extraFindings.push({
        id: "goplus.phishing-site",
        severity: "critical",
        title: "This site is a known phishing site",
        description: `${req.sig.origin} is flagged by GoPlus Security as a phishing site. Do not sign anything here.`,
      });
      void auditLog?.logSecurityEvent("goplus.phishing-site", req.sig.origin, "critical", {});
    }
  }

  return finalize(simulation, intel, req.sig.chainId, extraFindings, auditLog);
}

async function finalize(
  simulation: SimulationResult,
  intel: ThreatIntel | ThreatIntelPostgres,
  chainId: number,
  extraFindings: RiskFinding[] = [],
  auditLog?: AuditLogService
): Promise<RiskAssessment> {
  const findings = [...extraFindings, ...(await evaluate(simulation, intel, chainId, auditLog))];
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
      const gasless = ap.kind === "permit" || ap.kind === "permit2" ? " without an on-chain transaction" : "";
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

  if (sim.method === "OrderComponents") {
    parts.push("You're signing a marketplace order — check the item and price carefully.");
  }

  if (sim.method === "unknown-typed-data") {
    parts.push("This signs data we couldn't fully decode — verify the site before signing.");
  }

  if (parts.length === 0) {
    return "No risky permissions or transfers were detected — this looks like a normal transaction.";
  }

  const prefix =
    verdict === "block" ? "Do NOT sign. " : verdict === "warn" ? "Be careful. " : "";
  return prefix + parts.join(" ");
}
