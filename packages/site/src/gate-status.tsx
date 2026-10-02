"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const GATE_URL = process.env.NEXT_PUBLIC_GATE_URL || "https://genesis-gate.onrender.com";

export type GateStatus = "checking" | "online" | "unavailable";

const GateStatusContext = createContext<GateStatus>("checking");

export async function pingGate(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(`${GATE_URL}/health`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export function GateStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<GateStatus>("checking");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const ok = await pingGate();
      if (cancelled) return;
      if (ok) {
        setStatus("online");
        return;
      }
      setStatus("unavailable");
      while (!cancelled) {
        await new Promise((r) => setTimeout(r, 5000));
        if (cancelled) return;
        if (await pingGate()) {
          if (!cancelled) setStatus("online");
          return;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return <GateStatusContext.Provider value={status}>{children}</GateStatusContext.Provider>;
}

export function useGateStatus(): GateStatus {
  return useContext(GateStatusContext);
}
