import { decodeFunctionData, parseAbi } from "viem";
import type {
  Address,
  Approval,
  AssetChange,
  SimulationResult,
  TxRequest,
} from "@genesis/shared";
import { UNLIMITED_THRESHOLD } from "@genesis/shared";
import { createForkSimulator } from "./fork-simulator.js";

/**
 * The subset of methods that matter for drainer detection. Most wallet-draining
 * attacks are a single approve / setApprovalForAll / permit granting spend rights
 * to an attacker-controlled address.
 */
const SUSPECT_ABI = parseAbi([
  "function approve(address spender, uint256 amount)",
  "function approve(address token, address spender, uint160 amount, uint48 expiration)",
  "function increaseAllowance(address spender, uint256 addedValue)",
  "function setApprovalForAll(address operator, bool approved)",
  "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)",
  "function transfer(address to, uint256 amount)",
  "function transferFrom(address from, address to, uint256 amount)",
  "function multicall(bytes[] data)",
]);

/** Above this a uint160 Permit2 allowance is effectively unlimited. */
const UNLIMITED_UINT160 = BigInt(2) ** BigInt(159);

let forkSimulator = createForkSimulator();

function norm(a: string): Address {
  // Case-insensitive comparison everywhere, so just lowercase (no checksum throw).
  return a.toLowerCase() as Address;
}

/**
 * Heuristic, calldata-only "simulation". Decodes the top-level call and derives
 * the approvals / asset movements it would cause. This catches the overwhelming
 * majority of real-world drainers without needing a chain fork. A fork-backed
 * simulator (anvil/Tenderly) can later implement the same `SimulationResult`.
 */
export async function decodeTransaction(tx: TxRequest): Promise<SimulationResult> {
  const approvals: Approval[] = [];
  const assetChanges: AssetChange[] = [];
  const counterparties: Address[] = [];
  let method: string | undefined;
  let isHeuristic = true;

  const value = BigInt(tx.value ?? "0");
  if (value > 0n) {
    assetChanges.push({ direction: "out", token: "native", amount: value.toString() });
    counterparties.push(norm(tx.to));
  }

  const data = tx.data ?? "0x";
  if (data.length >= 10) {
    try {
      const decoded = decodeFunctionData({ abi: SUSPECT_ABI, data });
      method = decoded.functionName;
      const token = norm(tx.to);

      switch (decoded.functionName) {
        case "approve":
        case "increaseAllowance": {
          // Permit2 approve(token, spender, amount, expiration) has 4 args.
          if (decoded.args.length === 4) {
            const [permit2Token, spender, amount] = decoded.args as [
              Address,
              Address,
              bigint,
              number,
            ];
            approvals.push({
              kind: "erc20",
              token: norm(permit2Token),
              spender: norm(spender),
              amount: amount.toString(),
              unlimited: amount >= UNLIMITED_UINT160,
            });
            counterparties.push(norm(spender));
            break;
          }
          const [spender, amount] = decoded.args as [Address, bigint];
          approvals.push({
            kind: "erc20",
            token,
            spender: norm(spender),
            amount: amount.toString(),
            unlimited: amount >= UNLIMITED_THRESHOLD,
          });
          counterparties.push(norm(spender));
          break;
        }
        case "setApprovalForAll": {
          const [operator, approved] = decoded.args as [Address, boolean];
          if (approved) {
            approvals.push({
              kind: "erc721-all",
              token,
              spender: norm(operator),
              amount: "unlimited",
              unlimited: true,
            });
          }
          counterparties.push(norm(operator));
          break;
        }
        case "permit": {
          const [, spender, permitValue] = decoded.args as [Address, Address, bigint];
          approvals.push({
            kind: "permit",
            token,
            spender: norm(spender),
            amount: permitValue.toString(),
            unlimited: permitValue >= UNLIMITED_THRESHOLD,
          });
          counterparties.push(norm(spender));
          break;
        }
        case "transfer": {
          const [to, amount] = decoded.args as [Address, bigint];
          assetChanges.push({ direction: "out", token, amount: amount.toString() });
          counterparties.push(norm(to));
          break;
        }
        case "transferFrom": {
          const [fromArg, to, amount] = decoded.args as [Address, Address, bigint];
          const direction = norm(fromArg) === norm(tx.from) ? "out" : "in";
          assetChanges.push({ direction, token, amount: amount.toString() });
          counterparties.push(norm(to));
          break;
        }
        case "multicall": {
          // Try fork simulation first; fall back to heuristic if unavailable.
          if (forkSimulator) {
            const forked = await forkSimulator.simulate(tx);
            if (forked) {
              // Fork simulation succeeded — merge results
              approvals.push(...forked.approvals);
              assetChanges.push(...forked.assetChanges);
              counterparties.push(...forked.counterparties);
              isHeuristic = false;
              break;
            }
          }
          // Fall back: multicall hides its actions
          counterparties.push(token);
          break;
        }
      }
    } catch {
      // Unknown selector — leave as an opaque contract interaction.
      method = "unknown";
      counterparties.push(norm(tx.to));
    }
  }

  return {
    approvals,
    assetChanges,
    method,
    counterparties: dedupe(counterparties),
    heuristic: isHeuristic,
  };
}

function dedupe(addrs: Address[]): Address[] {
  return [...new Set(addrs)];
}
