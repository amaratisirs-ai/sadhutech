"use client";

import { useAppKit } from "@reown/appkit/react";
import { useAccount, useDisconnect } from "wagmi";

/** Thin wrapper so pages use one consistent wallet API instead of touching wagmi/AppKit directly. */
export function useWallet() {
  const { address, isConnected, chainId } = useAccount();
  const { open } = useAppKit();
  const { disconnectAsync } = useDisconnect();

  return {
    address,
    isConnected,
    chainId,
    connect: () => open(),
    disconnect: () => {
      try {
        localStorage.removeItem("genesis_pro_auth");
      } catch {
        // ignore storage failures
      }
      return disconnectAsync();
    },
  };
}
