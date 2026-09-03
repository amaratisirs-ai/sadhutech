import { describe, expect, it } from "vitest";
import { resolveDecisionOutcome } from "./decision";

describe("resolveDecisionOutcome", () => {
  it("returns allow state for a safe transaction", () => {
    expect(
      resolveDecisionOutcome({ verdict: "allow", plainEnglish: "This looks safe." })
    ).toMatchObject({
      verdict: "allow",
      label: "Allow",
      canContinue: true,
    });
  });

  it("returns warn state for a risky but not blocked transaction", () => {
    expect(
      resolveDecisionOutcome({ verdict: "warn", score: 68, plainEnglish: "Review this approval before signing." })
    ).toMatchObject({
      verdict: "warn",
      label: "Warn",
      canContinue: false,
    });
  });

  it("returns block state for malicious activity", () => {
    expect(
      resolveDecisionOutcome({ verdict: "block", plainEnglish: "This transaction matches a known drainer pattern." })
    ).toMatchObject({
      verdict: "block",
      label: "Block",
      canContinue: false,
    });
  });
});
