import { describe, expect, it } from "vitest";
import { addressCheckHandoff, addressCheckResult, addressInputError, addressProbe } from "./address-check";

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
      message: expect.stringContaining("community threat has been confirmed"),
    });
    expect(addressCheckResult({ verdict: "warn", plainEnglish: "Unconfirmed report." })).toMatchObject({
      verdict: "warn",
      title: "Look closer before interacting",
      message: "Unconfirmed report.",
    });
  });

  it("reports both community and independent signals without raw provider codes", () => {
    const result = addressCheckResult({ verdict: "warn", findings: [
      { id: "intel.unconfirmed", description: "0xabc has not reached quorum" },
      { id: "goplus.malicious-address", description: "GoPlus (blacklist_doubt, cybercrime)" },
    ] });
    expect(result.message).toContain("community report is awaiting confirmation");
    expect(result.message).toContain("independent security feed");
    expect(result.signals).toHaveLength(2);
    expect(result.signals?.[1].title).toContain("GoPlus");
    expect(JSON.stringify(result)).not.toContain("blacklist_doubt");
  });

  it("distinguishes the paid lookup from community reports", () => {
    const summary = addressCheckResult({ verdict: "block", findings: [{ id: "intel.chainabuse", description: "ChainAbuse report(s)" }] });
    expect(summary.message).toContain("additional deep check");
    expect(summary.message).not.toContain("community threat");
    expect(summary.signals?.[0].title).toContain("ChainAbuse");
  });

  it("carries a checked address and its free result to the paid-check route without charging a credit", () => {
    const address = `0x${"a".repeat(40)}`;
    const handoff = addressCheckHandoff(address, { verdict: "warn", findings: [{ id: "intel.unconfirmed" }] });
    expect(handoff).toMatchObject({
      mode: "address", addressInput: address,
      lastTx: { to: address, data: "0x00000000", value: "0", chainId: 1 },
      result: { outcome: { verdict: "warn" }, message: expect.stringContaining("awaiting confirmation") },
    });
    expect(JSON.stringify(handoff)).not.toContain('"pro"');
  });

  it("uses the address target without proposing a coin transfer", () => {
    const address = `0x${"a".repeat(40)}`;
    expect(addressProbe(address)).toMatchObject({ to: address, value: "0", data: "0x00000000" });
  });
});