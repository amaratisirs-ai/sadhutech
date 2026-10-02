import { describe, expect, it } from "vitest";
import { addressCheckResult, addressInputError } from "./address-check";

describe("homepage address check", () => {
  it("accepts only full EVM addresses, including pasted whitespace", () => {
    expect(addressInputError(`  0x${"a".repeat(40)}  `)).toBeNull();
    expect(addressInputError(`0x${"a".repeat(39)}`)?.title).toBe("Enter a full address");
    expect(addressInputError("vitalik.eth")?.message).toContain("Names");
    expect(addressInputError("bc1qtest")?.message).toContain("other wallet formats");
  });

  it("never describes a clean feed result as a safety guarantee", () => {
    expect(addressCheckResult({ verdict: "allow" })).toMatchObject({
      title: "No reports found",
      message: expect.stringContaining("not a guarantee"),
    });
  });

  it("shows confirmed threat details and retains a cautionary warn verdict", () => {
    expect(addressCheckResult({ verdict: "block", findings: [{ id: "intel.drainer", description: "Reported drainer address." }] })).toMatchObject({
      verdict: "block",
      message: "Reported drainer address.",
    });
    expect(addressCheckResult({ verdict: "warn", plainEnglish: "Unconfirmed report." })).toMatchObject({
      verdict: "warn",
      title: "Look closer before interacting",
      message: "Unconfirmed report.",
    });
  });
});