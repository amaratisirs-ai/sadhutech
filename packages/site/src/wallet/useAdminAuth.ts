"use client";

import { useEffect, useState } from "react";
import { useSignMessage } from "wagmi";
import { withTimeout, WalletTimeoutError } from "@/src/wallet/useProAuth";

export { WalletTimeoutError };

export interface AdminAuth {
  address: string;
  message: string;
  signature: string;
  ts: number;
}

const ADMIN_AUTH_STORAGE_KEY = "genesis_admin_auth";
// Stays under the gate's 24h signature-freshness window (server.ts / admin-auth.ts) so a
// cached signature is never rejected as stale. localStorage (not sessionStorage) so it
// survives across tabs and browser restarts too - same pattern as useProAuth.
const ADMIN_AUTH_TTL_MS = 23 * 60 * 60 * 1000;
const WALLET_SIGN_TIMEOUT_MS = 60_000;

function readCachedAuth(): AdminAuth | null {
  try {
    const raw = localStorage.getItem(ADMIN_AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AdminAuth) : null;
  } catch {
    return null;
  }
}

function isFresh(auth: AdminAuth | null, addr: string): auth is AdminAuth {
  return !!auth && auth.address === addr && Date.now() - auth.ts < ADMIN_AUTH_TTL_MS;
}

// Module-level, not component-level: /admin, /admin/architecture and /admin/todos are separate
// page components, each getting its OWN useAdminAuth() instance. Navigating between them quickly
// (before the first signature resolves and gets cached) used to fire a second, independent
// signMessageAsync() call - the wallet only shows one prompt at a time and silently drops the
// second, surfacing as "No response from your wallet" even though the first request is still
// pending. Sharing one in-flight promise across every admin page closes that race.
let inFlightAuth: Promise<AdminAuth> | null = null;

/**
 * Signed wallet auth for the /admin dashboard - same one-signature-then-cache
 * pattern as useProAuth. Without caching, every range toggle/refresh re-prompted
 * the wallet for a fresh signature, which felt like an infinite confirm loop on mobile.
 */
export function useAdminAuth() {
  const { signMessageAsync } = useSignMessage();
  const [adminAuth, setAdminAuth] = useState<AdminAuth | null>(null);

  // Reads any cached auth after mount only - sessionStorage isn't available during Next.js SSR.
  useEffect(() => {
    setAdminAuth(readCachedAuth());
  }, []);

  const persistAdminAuth = (auth: AdminAuth | null) => {
    setAdminAuth(auth);
    try {
      if (auth) localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify(auth));
      else localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    } catch {
      // ignore storage failures (private browsing, quota, etc.) - falls back to in-memory only
    }
  };

  const getAdminAuth = async (addr: string): Promise<AdminAuth> => {
    // Check sessionStorage directly too, not just this component's own state - another admin
    // page may have already signed and cached moments before this component mounted.
    const cached = isFresh(adminAuth, addr) ? adminAuth : readCachedAuth();
    if (isFresh(cached, addr)) {
      if (cached !== adminAuth) setAdminAuth(cached);
      return cached;
    }
    if (inFlightAuth) return inFlightAuth; // another admin page is already signing - piggyback on it
    inFlightAuth = (async () => {
      try {
        const message = `SadhuTech admin\nwallet: ${addr}\nts: ${new Date().toISOString()}`;
        const signature = await withTimeout(
          signMessageAsync({ message }),
          WALLET_SIGN_TIMEOUT_MS,
          "No response from your wallet. Check for a pending signature request, or try again."
        );
        const auth: AdminAuth = { address: addr, message, signature, ts: Date.now() };
        persistAdminAuth(auth);
        return auth;
      } finally {
        inFlightAuth = null;
      }
    })();
    return inFlightAuth;
  };

  return { adminAuth, getAdminAuth, persistAdminAuth };
}
