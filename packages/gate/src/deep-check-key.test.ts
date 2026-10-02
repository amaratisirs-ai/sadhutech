import { describe, expect, it } from "vitest";
import type { AnalyzeRequest } from "@genesis/shared";
import { deepCheckRequestKey } from "./deep-check-key.js";

describe("deepCheckRequestKey", () => {
  it("normalizes object-key order and EVM hex casing", () => {
    const first: AnalyzeRequest = {
      autonomy: "warn" as const,
      tx: { chainId: 1, from: "0xAbCd", to: "0x1234", value: "0", data: "0xABcd" },
    };
    const reordered: AnalyzeRequest = {
      tx: { data: "0xabcd", value: "0", to: "0x1234", from: "0xabcd", chainId: 1 },
      autonomy: "warn" as const,
    };

    expect(deepCheckRequestKey(first)).toBe(deepCheckRequestKey(reordered));
  });

  it("isolates requests when meaningful transaction fields change", () => {
    const request: AnalyzeRequest = { tx: { chainId: 1, from: "0xabc", to: "0x1234", value: "0", data: "0x" } };

    expect(deepCheckRequestKey({ ...request, tx: { ...request.tx, to: "0x5678" } })).not.toBe(deepCheckRequestKey(request));
    expect(deepCheckRequestKey({ ...request, tx: { ...request.tx, data: "0x1234" } })).not.toBe(deepCheckRequestKey(request));
    expect(deepCheckRequestKey({ ...request, tx: { ...request.tx, chainId: 10 } })).not.toBe(deepCheckRequestKey(request));
  });

  it("does not change when Pro authorization is refreshed", () => {
    const request: AnalyzeRequest = { tx: { chainId: 1, from: "0xabc", to: "0x1234", value: "0", data: "0x" } };
    const withProAuth = {
      ...request,
      pro: { wallet: "0xabc", message: "fresh message", signature: "fresh signature" },
    } as AnalyzeRequest;

    expect(deepCheckRequestKey(withProAuth)).toBe(deepCheckRequestKey(request));
  });
});