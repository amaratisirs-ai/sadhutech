import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet, polygon, arbitrum, optimism, avalanche, base } from "@reown/appkit/networks";

export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

export const networks = [mainnet, polygon, arbitrum, optimism, avalanche, base] as const;

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [...networks],
  ssr: false,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
