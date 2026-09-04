"use client";

import { type ReactNode } from "react";
import { createAppKit } from "@reown/appkit/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { wagmiAdapter, projectId, networks } from "../src/wallet/config";

const queryClient = new QueryClient();

if (projectId) {
  createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: [...networks],
    defaultNetwork: networks[0],
    metadata: {
      name: "GENESIS Firewall",
      description: "Community-powered transaction security firewall",
      url: typeof window !== "undefined" ? window.location.origin : "https://sadhutech.com",
      icons: ["https://sadhutech.com/images/genesis-icon.png"],
    },
    features: { analytics: false, email: false, socials: [] },
  });
}

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
