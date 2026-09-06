"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useWallet } from "@/src/wallet/useWallet";
import { trackEvent } from "@/src/analytics";

/**
 * Invisible telemetry component - must render inside <Web3Provider> so useWallet()
 * has a WagmiProvider ancestor. Reports page views on route change and logins on
 * wallet connect, feeding the /admin 360° dashboard.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();
  const { address, isConnected } = useWallet();
  const wasConnected = useRef(false);

  useEffect(() => {
    trackEvent("page_view", { page: pathname, wallet: isConnected ? address : undefined });
    // Only re-fire on route change - wallet is attached best-effort, not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (isConnected && address && !wasConnected.current) {
      trackEvent("login", { wallet: address });
    }
    wasConnected.current = !!isConnected;
  }, [isConnected, address]);

  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      trackEvent("error", { page: pathname, meta: { message: e.message?.slice(0, 300), source: "window.onerror" } });
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason instanceof Error ? e.reason.message : String(e.reason);
      trackEvent("error", { page: pathname, meta: { message: reason.slice(0, 300), source: "unhandledrejection" } });
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, [pathname]);

  return null;
}
