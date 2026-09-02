import { encodeFunctionData, parseAbi, maxUint256 } from "viem";
import type { Address, TxRequest } from "@genesis/shared";
import { analyze } from "./analyze.js";
import { createIntel } from "./index.js";

/**
 * CLI scenario runner: `pnpm demo`. Pipes realistic transactions through the
 * pre-sign gate and prints the verdicts — a living demo of what the firewall
 * catches, with no wallet or chain required.
 */

const ABI = parseAbi([
  "function transfer(address to, uint256 amount)",
  "function approve(address spender, uint256 amount)",
  "function approve(address token, address spender, uint160 amount, uint48 expiration)",
  "function setApprovalForAll(address operator, bool approved)",
  "function multicall(bytes[] data)",
]);

const FROM = "0x1111111111111111111111111111111111111111" as Address;
const TOKEN = "0x2222222222222222222222222222222222222222" as Address;
const SPENDER = "0x3333333333333333333333333333333333333333" as Address;
const RECIPIENT = "0x4444444444444444444444444444444444444444" as Address;
const DRAINER = "0x000000000000000000000000000000000000dead" as Address;
const PERMIT2 = "0x000000000022d473030f116ddee9f6b43ac78ba3" as Address;
const MAX160 = 2n ** 160n - 1n;

function tx(to: Address, data: `0x${string}`, value = "0"): TxRequest {
  return { chainId: 1, from: FROM, to, value, data };
}

const scenarios: Array<{ name: string; tx: TxRequest }> = [
  {
    name: "Benign ERC-20 transfer",
    tx: tx(TOKEN, encodeFunctionData({ abi: ABI, functionName: "transfer", args: [RECIPIENT, 1000n] })),
  },
  {
    name: "Unlimited ERC-20 approval",
    tx: tx(TOKEN, encodeFunctionData({ abi: ABI, functionName: "approve", args: [SPENDER, maxUint256] })),
  },
  {
    name: "setApprovalForAll (NFT operator)",
    tx: tx(TOKEN, encodeFunctionData({ abi: ABI, functionName: "setApprovalForAll", args: [SPENDER, true] })),
  },
  {
    name: "Permit2 unlimited approval",
    tx: tx(PERMIT2, encodeFunctionData({ abi: ABI, functionName: "approve", args: [TOKEN, SPENDER, MAX160, 0] })),
  },
  {
    name: "Batched multicall (hidden approve → drainer)",
    tx: tx(
      TOKEN,
      encodeFunctionData({
        abi: ABI,
        functionName: "multicall",
        args: [[encodeFunctionData({ abi: ABI, functionName: "approve", args: [DRAINER, maxUint256] })]],
      }),
    ),
  },
  {
    name: "Approve → community-confirmed DRAINER",
    tx: tx(TOKEN, encodeFunctionData({ abi: ABI, functionName: "approve", args: [DRAINER, maxUint256] })),
  },
];

const COLOR = { block: "\x1b[31m", warn: "\x1b[33m", allow: "\x1b[32m", dim: "\x1b[90m", reset: "\x1b[0m" };

async function run(): Promise<void> {
  const intel = createIntel();
  console.log("\nGENESIS pre-sign gate — scenario demo\n" + "=".repeat(48));
  for (const s of scenarios) {
    const r = await analyze({ tx: s.tx }, intel);
    const c = COLOR[r.verdict];
    console.log(`\n${s.name}`);
    console.log(`  ${c}${r.verdict.toUpperCase()}${COLOR.reset}  risk ${r.score}/100`);
    console.log(`  ${COLOR.dim}${r.plainEnglish}${COLOR.reset}`);
    for (const f of r.findings) {
      console.log(`  ${COLOR.dim}• [${f.severity}] ${f.title}${COLOR.reset}`);
    }
  }
  console.log("\n" + "=".repeat(48) + "\n");
}

run();
