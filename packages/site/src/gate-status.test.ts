import { afterEach, describe, expect, it, vi } from "vitest";
import { pingGate } from "./gate-status";

afterEach(() => vi.unstubAllGlobals());

describe("gate health status", () => {
  it("reports a successful health check without a cosmetic wait", async () => {
    const request = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", request);

    await expect(pingGate()).resolves.toBe(true);
    expect(request).toHaveBeenCalledOnce();
    expect(request.mock.calls[0][0]).toMatch(/\/health$/);
  });

  it("reports a failed response or network error as unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(pingGate()).resolves.toBe(false);

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("connection failed")));
    await expect(pingGate()).resolves.toBe(false);
  });
});