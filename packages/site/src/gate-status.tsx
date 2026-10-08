"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const GATE_URL = process.env.NEXT_PUBLIC_GATE_URL || "https://genesis-gate.onrender.com";

export type GateStatus = "checking" | "online" | "unavailable";

const GateStatusContext = createContext<GateStatus>("checking");

export async function pingGate(signal?: AbortSignal): Promise<boolean> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, 10_000);
  try {
    const res = await fetch(`${GATE_URL}/health`, { signal: controller.signal, cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}

export function monitorGateStatus(onStatus: (status: GateStatus) => void) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let checking = false;

  const check = async () => {
    if (controller.signal.aborted || checking) return;
    checking = true;
    clearTimeout(timer);
    const ok = await pingGate(controller.signal);
    checking = false;
    if (controller.signal.aborted) return;
    onStatus(ok ? "online" : "unavailable");
    timer = setTimeout(check, ok ? 30_000 : 5000);
  };

  void check();
  return {
    check,
    stop: () => { controller.abort(); clearTimeout(timer); },
  };
}

export function GateStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<GateStatus>("checking");

  useEffect(() => {
    const monitor = monitorGateStatus(setStatus);
    const recheck = () => {
      if (document.visibilityState === "visible") void monitor.check();
    };
    window.addEventListener("online", recheck);
    window.addEventListener("focus", recheck);
    document.addEventListener("visibilitychange", recheck);
    return () => {
      monitor.stop();
      window.removeEventListener("online", recheck);
      window.removeEventListener("focus", recheck);
      document.removeEventListener("visibilitychange", recheck);
    };
  }, []);

  return <GateStatusContext.Provider value={status}>{children}</GateStatusContext.Provider>;
}

export function useGateStatus(): GateStatus {
  return useContext(GateStatusContext);
}
