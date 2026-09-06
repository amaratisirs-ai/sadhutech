"use client";

import { useSignMessage } from "wagmi";
import { withTimeout, WalletTimeoutError } from "@/src/wallet/useProAuth";

export { WalletTimeoutError };

const WALLET_SIGN_TIMEOUT_MS = 60_000;

/**
 * Signed wallet auth for the /admin dashboard - same one-signature pattern as
 * useProAuth, but always re-signs (no localStorage cache) since this gates
 * sensitive aggregate data and the gate enforces a tight 1h freshness window.
 */
export function useAdminAuth() {
  const { signMessageAsync } = useSignMessage();

  const getAdminAuth = async (addr: string) => {
    const message = `SadhuTech admin\nwallet: ${addr}\nts: ${new Date().toISOString()}`;
    const signature = await withTimeout(
      signMessageAsync({ message }),
      WALLET_SIGN_TIMEOUT_MS,
      "No response from your wallet. Check for a pending signature request, or try again."
    );
    return { address: addr, message, signature };
  };

  return { getAdminAuth };
}
