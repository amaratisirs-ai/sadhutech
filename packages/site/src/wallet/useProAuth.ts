"use client";

import { useEffect, useState } from "react";
import { useSignMessage } from "wagmi";

export interface ProAuth {
  address: string;
  message: string;
  signature: string;
  ts: number;
}

const PRO_AUTH_STORAGE_KEY = "genesis_pro_auth";
// Stays under the gate's 24-hour signature-freshness window (server.ts) so a cached
// signature is never rejected as stale, while avoiding a fresh wallet prompt on every click.
const PRO_AUTH_TTL_MS = 23 * 60 * 60 * 1000;
const WALLET_SIGN_TIMEOUT_MS = 60_000;

export class WalletTimeoutError extends Error {}

// Guards against wallets that never resolve/reject a signature prompt (e.g. dismissed silently).
export function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new WalletTimeoutError(message)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

/**
 * Shared wallet-signature auth for Deep Check (Pro credits) - one signed credential cached
 * across a freshness window instead of re-prompting on every check. Used by both /check and
 * /extension-connect so the signing logic only lives in one place.
 */
export function useProAuth() {
  const { signMessageAsync } = useSignMessage();
  const [proAuth, setProAuth] = useState<ProAuth | null>(null);

  // Reads any cached auth after mount only - localStorage isn't available during Next.js SSR.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PRO_AUTH_STORAGE_KEY);
      if (raw) setProAuth(JSON.parse(raw));
    } catch {
      // ignore malformed/missing cached auth
    }
  }, []);

  const persistProAuth = (auth: ProAuth | null) => {
    setProAuth(auth);
    try {
      if (auth) localStorage.setItem(PRO_AUTH_STORAGE_KEY, JSON.stringify(auth));
      else localStorage.removeItem(PRO_AUTH_STORAGE_KEY);
    } catch {
      // ignore storage failures (private browsing, quota, etc.) - falls back to in-memory only
    }
  };

  const getProAuth = async (addr: string): Promise<ProAuth> => {
    if (proAuth && proAuth.address === addr && Date.now() - proAuth.ts < PRO_AUTH_TTL_MS) {
      return proAuth;
    }
    const message = `SadhuTech pro check\nwallet: ${addr}\nts: ${new Date().toISOString()}`;
    const signature = await withTimeout(
      signMessageAsync({ message }),
      WALLET_SIGN_TIMEOUT_MS,
      "No response from your wallet. Check for a pending signature request, or try again."
    );
    const auth: ProAuth = { address: addr, message, signature, ts: Date.now() };
    persistProAuth(auth);
    return auth;
  };

  return { proAuth, getProAuth, persistProAuth };
}
