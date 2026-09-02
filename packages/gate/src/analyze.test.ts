import { describe, it, expect } from "vitest";
import { encodeFunctionData, parseAbi, maxUint256 } from "viem";
import type { Address, TxRequest } from "@genesis/shared";
import { analyze } from "./analyze.js";
import { ThreatIntel } from "./intel.js";
import { createIntel } from "./index.js";

const ABI = parseAbi([
  "function approve(address spender, uint256 amount)",
  "function approve(address token, address spender, uint160 amount, uint48 expiration)",
  "function setApprovalForAll(address operator, bool approved)",
  "function transfer(address to, uint256 amount)",
  "function multicall(bytes[] data)",
]);

const FROM = "0x1111111111111111111111111111111111111111" as Address;
const TOKEN = "0x2222222222222222222222222222222222222222" as Address;
const SPENDER = "0x3333333333333333333333333333333333333333" as Address;
const RECIPIENT = "0x4444444444444444444444444444444444444444" as Address;
const DRAINER = "0x000000000000000000000000000000000000dead" as Address;
const DECOY = "0x00000000000000000000000000000000dec0de00" as Address;
const REPORTED = "0x5555555555555555555555555555555555555555" as Address;

function tx(partial: Partial<TxRequest> & Pick<TxRequest, "to">): TxRequest {
  return { chainId: 1, from: FROM, value: "0", data: "0x", ...partial };
}

describe("Chakravyuha pre-sign gate", () => {
  it("allows a benign token transfer", async () => {
    const data = encodeFunctionData({ abi: ABI, functionName: "transfer", args: [RECIPIENT, 1000n] });
    const result = await analyze({ tx: tx({ to: TOKEN, data }) }, createIntel());
    expect(result.verdict).toBe("allow");
    expect(result.score).toBe(0);
  });

  it("warns on an unlimited ERC-20 approval", async () => {
    const data = encodeFunctionData({ abi: ABI, functionName: "approve", args: [SPENDER, maxUint256] });
    const result = await analyze({ tx: tx({ to: TOKEN, data }) }, createIntel());
    expect(result.verdict).toBe("warn");
    expect(result.findings.map((f) => f.id)).toContain("approval.unlimited");
  });

  it("warns on setApprovalForAll", async () => {
    const data = encodeFunctionData({ abi: ABI, functionName: "setApprovalForAll", args: [SPENDER, true] });
    const result = await analyze({ tx: tx({ to: TOKEN, data }) }, createIntel());
    expect(result.verdict).toBe("warn");
    expect(result.findings.map((f) => f.id)).toContain("approval.setApprovalForAll");
  });

  it("blocks an approval to a seeded drainer address", async () => {
    const data = encodeFunctionData({ abi: ABI, functionName: "approve", args: [DRAINER, maxUint256] });
    const result = await analyze({ tx: tx({ to: TOKEN, data }) }, createIntel());
    expect(result.verdict).toBe("block");
    expect(result.findings.some((f) => f.severity === "critical")).toBe(true);
  });

  it("blocks any interaction with a decoy honeytoken tripwire", async () => {
    const data = encodeFunctionData({ abi: ABI, functionName: "transfer", args: [DECOY, 1n] });
    const result = await analyze({ tx: tx({ to: DECOY, data }) }, createIntel());
    expect(result.verdict).toBe("block");
    expect(result.findings.map((f) => f.id)).toContain("intel.decoy-tripwire");
  });

  it("escalates from warn to block once community reports reach quorum", async () => {
    const intel = new ThreatIntel(3);
    const data = encodeFunctionData({ abi: ABI, functionName: "transfer", args: [REPORTED, 1n] });
    const request = { tx: tx({ to: TOKEN, data }) };

    // Two distinct reporters — below quorum → unconfirmed → warn.
    intel.report({ address: REPORTED, category: "drainer", reporterId: "a" });
    intel.report({ address: REPORTED, category: "drainer", reporterId: "b" });
    expect((await analyze(request, intel)).verdict).toBe("warn");

    // Third distinct reporter crosses quorum → confirmed → block.
    intel.report({ address: REPORTED, category: "drainer", reporterId: "c" });
    expect((await analyze(request, intel)).verdict).toBe("block");
  });

  it("ignores duplicate reporters for quorum (Sybil resistance)", () => {
    const intel = new ThreatIntel(3);
    intel.report({ address: REPORTED, category: "drainer", reporterId: "a" });
    intel.report({ address: REPORTED, category: "drainer", reporterId: "a" });
    intel.report({ address: REPORTED, category: "drainer", reporterId: "a" });
    expect(intel.lookup(REPORTED)?.quorumReached).toBe(false);
  });

  it("flags an unlimited Permit2 approval", async () => {
    const PERMIT2 = "0x000000000022d473030f116ddee9f6b43ac78ba3" as Address;
    const max160 = 2n ** 160n - 1n;
    const data = encodeFunctionData({
      abi: ABI,
      functionName: "approve",
      args: [TOKEN, SPENDER, max160, 0],
    });
    const result = await analyze({ tx: tx({ to: PERMIT2, data }) }, createIntel());
    expect(result.verdict).toBe("warn");
    expect(result.findings.map((f) => f.id)).toContain("approval.unlimited");
  });

  it("flags a batched multicall as hiding its actions", async () => {
    const inner = encodeFunctionData({ abi: ABI, functionName: "approve", args: [SPENDER, 1n] });
    const data = encodeFunctionData({ abi: ABI, functionName: "multicall", args: [[inner]] });
    const result = await analyze({ tx: tx({ to: TOKEN, data }) }, createIntel());
    expect(result.findings.map((f) => f.id)).toContain("call.multicall");
  });
});
