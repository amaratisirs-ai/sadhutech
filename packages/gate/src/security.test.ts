import { describe, it, expect } from "vitest";
import { validateAnalyzeRequest } from "./security.js";

const FROM = "0x1111111111111111111111111111111111111111";
const TO = "0x2222222222222222222222222222222222222222";
const APPROVE_DATA =
  "0x095ea7b30000000000000000000000003333333333333333333333333333333333333333ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

describe("validateAnalyzeRequest", () => {
  it("accepts a request without tx.value (value is optional)", () => {
    const errors = validateAnalyzeRequest({
      tx: { chainId: 1, from: FROM, to: TO, data: APPROVE_DATA },
    });
    expect(errors).toEqual([]);
  });

  it("accepts a string value", () => {
    const errors = validateAnalyzeRequest({
      tx: { chainId: 1, from: FROM, to: TO, data: "0x", value: "0" },
    });
    expect(errors).toEqual([]);
  });

  it("rejects a non-string/number value when present", () => {
    const errors = validateAnalyzeRequest({
      tx: { chainId: 1, from: FROM, to: TO, value: {} },
    });
    expect(errors.some((e) => e.field === "tx.value")).toBe(true);
  });

  it("still requires a valid from address", () => {
    const errors = validateAnalyzeRequest({
      tx: { chainId: 1, to: TO, data: "0x" },
    });
    expect(errors.some((e) => e.field === "tx.from")).toBe(true);
  });
});
