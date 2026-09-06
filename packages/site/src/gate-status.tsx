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

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// Purely cosmetic minimum: on a paid Render plan the gate no longer actually
// cold-starts, but flashing straight to "Live" on every page load reads worse
// than a brief "Waking up" - so the badge holds that state for this long even
// when the health check underneath already succeeded instantly.
const MIN_WAKING_DISPLAY_MS = 5000;

/** Pings /health on load and keeps retrying in the background if the gate is genuinely
 * down, so the UI can show "waking up" instead of freezing. See MIN_WAKING_DISPLAY_MS. */
export function GateStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<GateStatus>("checking");
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    let cancelled = false;

    (async () => {
      setStatus("waking");
      const [ok] = await Promise.all([pingGate(), delay(MIN_WAKING_DISPLAY_MS)]);
      if (cancelled) return;
      if (ok) {
        setStatus("online");
        return;
      }
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
