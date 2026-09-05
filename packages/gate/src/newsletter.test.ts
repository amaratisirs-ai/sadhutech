import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NewsletterService } from "./newsletter.js";

function fakePool(queryImpl?: (...args: unknown[]) => unknown) {
  return { query: vi.fn(queryImpl ?? (async () => ({ rows: [] }))) } as any;
}

describe("NewsletterService", () => {
  const originalError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it("initialize() creates the subscriber and send-log tables", async () => {
    const pool = fakePool();
    const svc = new NewsletterService(pool);
    await svc.initialize();
    expect(pool.query).toHaveBeenCalledTimes(1);
    const sql = pool.query.mock.calls[0][0] as string;
    expect(sql).toContain("email_subscribers");
    expect(sql).toContain("email_sends");
  });

  it("subscribe() inserts a new subscriber with a generated token, lowercasing the email", async () => {
    const pool = fakePool(async (sql: unknown) => {
      if (String(sql).includes("SELECT unsubscribe_token")) return { rows: [] };
      return { rows: [] };
    });
    const svc = new NewsletterService(pool);
    const result = await svc.subscribe("Foo@Example.com", { source: "footer" });
    expect(result.ok).toBe(true);
    expect(result.alreadySubscribed).toBeUndefined();
    expect(typeof result.unsubscribeToken).toBe("string");
    const insertCall = pool.query.mock.calls.find((c: unknown[]) => String(c[0]).includes("INSERT INTO email_subscribers"));
    expect(insertCall[1][0]).toBe("foo@example.com");
  });

  it("subscribe() returns alreadySubscribed for an existing active subscriber without inserting again", async () => {
    const pool = fakePool(async (sql: unknown) => {
      if (String(sql).includes("SELECT unsubscribe_token")) {
        return { rows: [{ unsubscribe_token: "existing-token", unsubscribed_at: null }] };
      }
      return { rows: [] };
    });
    const svc = new NewsletterService(pool);
    const result = await svc.subscribe("already@example.com");
    expect(result).toEqual({ ok: true, alreadySubscribed: true, unsubscribeToken: "existing-token" });
    expect(pool.query).not.toHaveBeenCalledWith(expect.stringContaining("INSERT INTO email_subscribers"), expect.anything());
  });

  it("subscribe() re-activates a previously unsubscribed email", async () => {
    const pool = fakePool(async (sql: unknown) => {
      if (String(sql).includes("SELECT unsubscribe_token")) {
        return { rows: [{ unsubscribe_token: "old-token", unsubscribed_at: new Date() }] };
      }
      return { rows: [] };
    });
    const svc = new NewsletterService(pool);
    await svc.subscribe("back@example.com");
    const reactivateCall = pool.query.mock.calls.find((c: unknown[]) => String(c[0]).includes("unsubscribed_at = NULL"));
    expect(reactivateCall[1]).toEqual(["back@example.com"]);
  });

  it("subscribe() fails soft (ok: false) if the DB throws", async () => {
    const pool = { query: vi.fn(async () => { throw new Error("db down"); }) } as any;
    const svc = new NewsletterService(pool);
    const result = await svc.subscribe("err@example.com");
    expect(result.ok).toBe(false);
  });

  it("unsubscribe() returns true when a row was updated", async () => {
    const pool = fakePool(async () => ({ rows: [{ id: 1 }], rowCount: 1 }));
    const svc = new NewsletterService(pool);
    expect(await svc.unsubscribe("some-token")).toBe(true);
  });

  it("unsubscribe() returns false when no matching active subscriber exists", async () => {
    const pool = fakePool(async () => ({ rows: [], rowCount: 0 }));
    const svc = new NewsletterService(pool);
    expect(await svc.unsubscribe("unknown-token")).toBe(false);
  });

  it("sendDueEmails() is a no-op when Resend isn't configured", async () => {
    const pool = fakePool();
    const svc = new NewsletterService(pool);
    const result = await svc.sendDueEmails();
    expect(result).toEqual({ sent: 0, subscribers: 0 });
    expect(pool.query).not.toHaveBeenCalled();
  });
});
