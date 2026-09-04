"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

const GATE_URL = process.env.NEXT_PUBLIC_GATE_URL || "https://genesis-gate.onrender.com";

export type GateStatus = "checking" | "online" | "waking";

const GateStatusContext = createContext<GateStatus>("checking");

async function pingGate(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${GATE_URL}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

/** Render's free tier spins the gate down after idle; this pings /health on load and
 * keeps retrying in the background so the UI can show "waking up" instead of freezing. */
export function GateStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<GateStatus>("checking");
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    let cancelled = false;

    (async () => {
      if (await pingGate()) {
        if (!cancelled) setStatus("online");
        return;
      }
      if (!cancelled) setStatus("waking");
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
