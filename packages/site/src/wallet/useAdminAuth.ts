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
// Stays under the gate's 1h signature-freshness window (server.ts) so a cached
// signature is never rejected as stale, while avoiding a wallet prompt on every
// range toggle/refresh click.
const ADMIN_AUTH_TTL_MS = 50 * 60 * 1000;
const WALLET_SIGN_TIMEOUT_MS = 60_000;

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
    try {
      const raw = sessionStorage.getItem(ADMIN_AUTH_STORAGE_KEY);
      if (raw) setAdminAuth(JSON.parse(raw));
    } catch {
      // ignore malformed/missing cached auth
    }
  }, []);

  const persistAdminAuth = (auth: AdminAuth | null) => {
    setAdminAuth(auth);
    try {
      if (auth) sessionStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify(auth));
      else sessionStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    } catch {
      // ignore storage failures (private browsing, quota, etc.) - falls back to in-memory only
    }
  };

  const getAdminAuth = async (addr: string): Promise<AdminAuth> => {
    if (adminAuth && adminAuth.address === addr && Date.now() - adminAuth.ts < ADMIN_AUTH_TTL_MS) {
      return adminAuth;
    }
    const message = `SadhuTech admin\nwallet: ${addr}\nts: ${new Date().toISOString()}`;
    const signature = await withTimeout(
      signMessageAsync({ message }),
      WALLET_SIGN_TIMEOUT_MS,
      "No response from your wallet. Check for a pending signature request, or try again."
    );
    const auth: AdminAuth = { address: addr, message, signature, ts: Date.now() };
    persistAdminAuth(auth);
    return auth;
  };

  return { adminAuth, getAdminAuth, persistAdminAuth };
}
