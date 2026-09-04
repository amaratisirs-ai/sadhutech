import { describe, it, expect } from "vitest";
import type { Address, SignatureRequest } from "@genesis/shared";
import { analyzeSignature } from "./analyze.js";
import { createIntel } from "./index.js";

const FROM = "0x1111111111111111111111111111111111111111" as Address;
const TOKEN = "0x2222222222222222222222222222222222222222" as Address;
const SPENDER = "0x3333333333333333333333333333333333333333" as Address;
const DRAINER = "0x000000000000000000000000000000000000dead" as Address;
const PERMIT2 = "0x000000000022d473030f116ddee9f6b43ac78ba3" as Address;

function sig(method: SignatureRequest["method"], data: string): SignatureRequest {
  return { chainId: 1, from: FROM, method, data };
}

function typedData(primaryType: string, message: Record<string, unknown>, verifyingContract?: string) {
  return JSON.stringify({ primaryType, domain: { verifyingContract }, message });
}

describe("Chakravyuha pre-sign gate — signature requests", () => {
  it("allows a plain personal_sign message", async () => {
    const result = await analyzeSignature({ sig: sig("personal_sign", "Sign in to example.com") }, createIntel());
    expect(result.verdict).toBe("allow");
    expect(result.score).toBe(0);
  });

  it("warns on an unlimited EIP-2612 Permit", async () => {
    const maxUint256 = (2n ** 256n - 1n).toString();
    const data = typedData("Permit", { spender: SPENDER, value: maxUint256, deadline: "999999999999" }, TOKEN);
    const result = await analyzeSignature({ sig: sig("eth_signTypedData_v4", data) }, createIntel());
    expect(result.verdict).toBe("warn");
    expect(result.findings.map((f) => f.id)).toContain("approval.permit");
    expect(result.findings.map((f) => f.id)).toContain("approval.unlimited");
  });

  it("blocks a Permit spender that is a confirmed drainer", async () => {
    const data = typedData("Permit", { spender: DRAINER, value: "1000", deadline: "999999999999" }, TOKEN);
    const result = await analyzeSignature({ sig: sig("eth_signTypedData_v4", data) }, createIntel());
    expect(result.verdict).toBe("block");
  });

  it("flags a Permit2 PermitSingle allowance as a signature-based approval", async () => {
    const data = typedData(
      "PermitSingle",
      { details: { token: TOKEN, amount: (2n ** 160n - 1n).toString(), expiration: "999999999", nonce: "0" }, spender: SPENDER, sigDeadline: "999999999" },
      PERMIT2
    );
    const result = await analyzeSignature({ sig: sig("eth_signTypedData_v4", data) }, createIntel());
    expect(result.findings.map((f) => f.id)).toContain("approval.permit2");
    expect(result.findings.map((f) => f.id)).toContain("approval.unlimited");
  });

  it("flags each entry in a Permit2 PermitBatch", async () => {
    const data = typedData(
      "PermitBatch",
      { details: [{ token: TOKEN, amount: "1000", expiration: "1" }, { token: SPENDER, amount: "2000", expiration: "1" }], spender: SPENDER },
      PERMIT2
    );
    const result = await analyzeSignature({ sig: sig("eth_signTypedData_v4", data) }, createIntel());
    expect(result.findings.filter((f) => f.id === "approval.permit2")).toHaveLength(2);
  });

  it("flags a Permit2 PermitTransferFrom one-shot pull", async () => {
    const data = typedData("PermitTransferFrom", { permitted: { token: TOKEN, amount: "5000" }, spender: SPENDER, nonce: "0", deadline: "1" }, PERMIT2);
    const result = await analyzeSignature({ sig: sig("eth_signTypedData_v4", data) }, createIntel());
    expect(result.findings.map((f) => f.id)).toContain("approval.permit2");
  });

  it("flags a Seaport marketplace order signature for review", async () => {
    const data = typedData("OrderComponents", {
      offerer: FROM,
      zone: SPENDER,
      offer: [{ token: TOKEN }],
      consideration: [{ recipient: SPENDER }],
    });
    const result = await analyzeSignature({ sig: sig("eth_signTypedData_v4", data) }, createIntel());
    expect(result.findings.map((f) => f.id)).toContain("signature.marketplace-order");
  });

  it("flags unparseable typed data instead of silently allowing it", async () => {
    const result = await analyzeSignature({ sig: sig("eth_signTypedData_v4", "not json") }, createIntel());
    expect(result.findings.map((f) => f.id)).toContain("signature.unknown-typed-data");
  });
});
