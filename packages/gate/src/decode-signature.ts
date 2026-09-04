import type { Address, Approval, AssetChange, SignatureRequest, SimulationResult } from "@genesis/shared";
import { UNLIMITED_THRESHOLD } from "@genesis/shared";

/** Permit2's uint160 allowance field; same threshold used for on-chain Permit2 approvals in decode.ts. */
const UNLIMITED_UINT160 = BigInt(2) ** BigInt(159);

function norm(a: string): Address {
  return a.toLowerCase() as Address;
}

interface TypedData {
  primaryType?: string;
  domain?: { verifyingContract?: string; name?: string; chainId?: number | string };
  message?: Record<string, unknown>;
}

function parseTypedData(raw: string): TypedData | null {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as TypedData) : null;
  } catch {
    return null;
  }
}

function toBigInt(v: unknown): bigint {
  try {
    return BigInt(v as string | number | bigint);
  } catch {
    return 0n;
  }
}

function addr(v: unknown): Address | undefined {
  return typeof v === "string" && v.startsWith("0x") ? norm(v) : undefined;
}

/**
 * Heuristic decoder for off-chain signature requests (personal_sign / eth_signTypedData*).
 * Most modern drainers steal funds via a blind signature — EIP-2612 permit, Permit2, or a
 * Seaport marketplace order — rather than an on-chain transaction, so this is the
 * signature-side counterpart to decode.ts's transaction decoding.
 */
export function decodeSignature(req: SignatureRequest): SimulationResult {
  const approvals: Approval[] = [];
  const counterparties: Address[] = [];
  const assetChanges: AssetChange[] = [];

  if (req.method === "personal_sign") {
    return { approvals, assetChanges, method: "personal_sign", counterparties, heuristic: true };
  }

  const typedData = parseTypedData(req.data);
  if (!typedData?.primaryType) {
    return { approvals, assetChanges, method: "unknown-typed-data", counterparties, heuristic: true };
  }

  const method = typedData.primaryType;
  const msg = typedData.message ?? {};
  const domainContract = addr(typedData.domain?.verifyingContract);

  switch (method) {
    case "Permit": {
      // EIP-2612: owner, spender, value, deadline — verifyingContract is the token.
      const spender = addr(msg.spender);
      const value = toBigInt(msg.value);
      if (spender && domainContract) {
        approvals.push({
          kind: "permit",
          token: domainContract,
          spender,
          amount: value.toString(),
          unlimited: value >= UNLIMITED_THRESHOLD,
        });
        counterparties.push(spender);
      }
      break;
    }
    case "PermitSingle": {
      // Permit2 AllowanceTransfer: details:{token,amount,expiration,nonce}, spender, sigDeadline.
      const details = (msg.details as Record<string, unknown>) ?? {};
      const spender = addr(msg.spender);
      const token = addr(details.token);
      const amount = toBigInt(details.amount);
      if (spender && token) {
        approvals.push({ kind: "permit2", token, spender, amount: amount.toString(), unlimited: amount >= UNLIMITED_UINT160 });
        counterparties.push(spender);
      }
      break;
    }
    case "PermitBatch": {
      const detailsList = Array.isArray(msg.details) ? (msg.details as Record<string, unknown>[]) : [];
      const spender = addr(msg.spender);
      for (const details of detailsList) {
        const token = addr(details.token);
        const amount = toBigInt(details.amount);
        if (spender && token) {
          approvals.push({ kind: "permit2", token, spender, amount: amount.toString(), unlimited: amount >= UNLIMITED_UINT160 });
        }
      }
      if (spender) counterparties.push(spender);
      break;
    }
    case "PermitTransferFrom": {
      // Permit2 SignatureTransfer: permitted:{token,amount}, spender — a one-shot pull, uint256 amount.
      const permitted = (msg.permitted as Record<string, unknown>) ?? {};
      const spender = addr(msg.spender);
      const token = addr(permitted.token);
      const amount = toBigInt(permitted.amount);
      if (spender && token) {
        approvals.push({ kind: "permit2", token, spender, amount: amount.toString(), unlimited: amount >= UNLIMITED_THRESHOLD });
        counterparties.push(spender);
      }
      break;
    }
    case "PermitBatchTransferFrom": {
      const permittedList = Array.isArray(msg.permitted) ? (msg.permitted as Record<string, unknown>[]) : [];
      const spender = addr(msg.spender);
      for (const permitted of permittedList) {
        const token = addr(permitted.token);
        const amount = toBigInt(permitted.amount);
        if (spender && token) {
          approvals.push({ kind: "permit2", token, spender, amount: amount.toString(), unlimited: amount >= UNLIMITED_THRESHOLD });
        }
      }
      if (spender) counterparties.push(spender);
      break;
    }
    case "OrderComponents": {
      // Seaport (OpenSea) order: signing this lets the offer be taken once fulfilled.
      // Price/value fairness can't be checked heuristically, but every party involved
      // (offerer, zone, consideration recipients) is worth screening against intel.
      const consideration = Array.isArray(msg.consideration) ? (msg.consideration as Record<string, unknown>[]) : [];
      for (const item of consideration) {
        const recipient = addr(item.recipient);
        if (recipient) counterparties.push(recipient);
      }
      const offerer = addr(msg.offerer);
      if (offerer) counterparties.push(offerer);
      const zone = addr(msg.zone);
      if (zone) counterparties.push(zone);
      break;
    }
    default:
      break;
  }

  if (domainContract) counterparties.push(domainContract);

  return {
    approvals,
    assetChanges,
    method,
    counterparties: [...new Set(counterparties)],
    heuristic: true,
  };
}
