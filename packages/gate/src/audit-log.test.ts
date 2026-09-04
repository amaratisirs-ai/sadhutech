import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AuditLogService } from "./audit-log.js";

function fakePool(queryImpl?: (...args: unknown[]) => unknown) {
  return { query: vi.fn(queryImpl ?? (async () => ({ rows: [] }))) } as any;
}

describe("AuditLogService", () => {
  const originalError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it("initialize() creates all three tables", async () => {
    const pool = fakePool();
    const svc = new AuditLogService(pool);
    await svc.initialize();
    expect(pool.query).toHaveBeenCalledTimes(1);
    const sql = pool.query.mock.calls[0][0] as string;
    expect(sql).toContain("credit_ledger");
    expect(sql).toContain("security_events");
    expect(sql).toContain("integration_failures");
  });

  it("logCreditConsumption() inserts a row with the given fields", async () => {
    const pool = fakePool();
    const svc = new AuditLogService(pool);
    await svc.logCreditConsumption("0xABC", 1, "block", true, "snap");
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO credit_ledger"),
      ["0xabc", 1, "block", true, "snap"]
    );
  });

  it("logSecurityEvent() inserts a row with JSON-encoded details", async () => {
    const pool = fakePool();
    const svc = new AuditLogService(pool);
    await svc.logSecurityEvent("goplus.malicious-address", "0xdead", "high", { reasons: ["phishing_activities"] });
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO security_events"),
      ["goplus.malicious-address", "0xdead", "high", JSON.stringify({ reasons: ["phishing_activities"] })]
    );
  });

  it("logIntegrationFailure() inserts a row", async () => {
    const pool = fakePool();
    const svc = new AuditLogService(pool);
    await svc.logIntegrationFailure("goplus-address", "HTTP 500");
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO integration_failures"), [
      "goplus-address",
      "HTTP 500",
    ]);
  });

  it("swallows DB errors instead of throwing (logging must never break a paid check)", async () => {
    const pool = fakePool(async () => {
      throw new Error("db down");
    });
    const svc = new AuditLogService(pool);
    await expect(svc.logCreditConsumption("0xabc", 1, "allow", false)).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });
});
