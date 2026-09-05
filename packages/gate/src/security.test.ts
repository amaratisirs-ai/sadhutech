import { describe, it, expect } from "vitest";
import { validateAnalyzeRequest, validateBulkAnalyzeRequest } from "./security.js";

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

describe("validateBulkAnalyzeRequest", () => {
  it("accepts 1 to 5 valid addresses", () => {
    expect(validateBulkAnalyzeRequest({ addresses: [FROM] })).toEqual([]);
    expect(validateBulkAnalyzeRequest({ addresses: [FROM, TO, FROM, TO, FROM] })).toEqual([]);
  });

  it("rejects an empty array", () => {
    const errors = validateBulkAnalyzeRequest({ addresses: [] });
    expect(errors.some((e) => e.field === "addresses")).toBe(true);
  });

  it("rejects more than 5 addresses", () => {
    const errors = validateBulkAnalyzeRequest({ addresses: [FROM, TO, FROM, TO, FROM, TO] });
    expect(errors.some((e) => e.field === "addresses")).toBe(true);
  });

  it("rejects a non-array addresses field", () => {
    const errors = validateBulkAnalyzeRequest({ addresses: FROM });
    expect(errors.some((e) => e.field === "addresses")).toBe(true);
  });

  it("flags individual invalid addresses by index", () => {
    const errors = validateBulkAnalyzeRequest({ addresses: [FROM, "not-an-address"] });
    expect(errors.some((e) => e.field === "addresses[1]")).toBe(true);
  });
});
