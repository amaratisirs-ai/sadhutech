import { afterEach, describe, expect, it, vi } from "vitest";
import { monitorGateStatus, pingGate } from "./gate-status";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("gate health status", () => {
  it("reports a successful health check without a cosmetic wait", async () => {
    const request = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", request);

    await expect(pingGate()).resolves.toBe(true);
    expect(request).toHaveBeenCalledOnce();
    expect(request.mock.calls[0][0]).toMatch(/\/health$/);
    expect(request.mock.calls[0][1]).toMatchObject({ cache: "no-store" });
  });

  it("reports a failed response or network error as unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(pingGate()).resolves.toBe(false);

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("connection failed")));
    await expect(pingGate()).resolves.toBe(false);
  });

  it("allows slow health responses but aborts after ten seconds", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn((_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(new Error("aborted")));
    })));
    const response = pingGate();
    await vi.advanceTimersByTimeAsync(4500);
    const signal = vi.mocked(fetch).mock.calls[0][1]?.signal;
    expect(signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(5500);
    await expect(response).resolves.toBe(false);
    expect(signal?.aborted).toBe(true);
  });

  it("keeps monitoring after success and recovers from a failed check", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValue({ ok: true }));
    const changed = vi.fn();
    const monitor = monitorGateStatus(changed);
    await vi.advanceTimersByTimeAsync(0);
    expect(changed).toHaveBeenLastCalledWith("online");
    await vi.advanceTimersByTimeAsync(30_000);
    expect(changed).toHaveBeenLastCalledWith("unavailable");
    await vi.advanceTimersByTimeAsync(5000);
    expect(changed).toHaveBeenLastCalledWith("online");
    monitor.stop();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("cancels in-flight checks without updating an unmounted provider", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn((_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(new Error("aborted")));
    })));
    const changed = vi.fn();
    const monitor = monitorGateStatus(changed);
    monitor.stop();
    await vi.advanceTimersByTimeAsync(0);
    expect(changed).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});