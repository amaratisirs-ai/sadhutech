import { describe, expect, it } from "vitest";
import { isCompletedDeepCheckResponse } from "./deep-check-response.js";

describe("isCompletedDeepCheckResponse", () => {
  it("rejects an ordinary free analysis response", () => {
    expect(isCompletedDeepCheckResponse({ verdict: "warn" })).toBe(false);
  });

  it("accepts completed and cached paid results", () => {
    expect(isCompletedDeepCheckResponse({ deepCheckCompleted: true })).toBe(true);
    expect(isCompletedDeepCheckResponse({ deepCheckCached: true })).toBe(true);
  });

  it("does not accept truthy but non-boolean markers", () => {
    expect(isCompletedDeepCheckResponse({ deepCheckCompleted: "true" })).toBe(false);
    expect(isCompletedDeepCheckResponse({ deepCheckCached: 1 })).toBe(false);
  });
});