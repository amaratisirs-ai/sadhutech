import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // MVP is a standalone checker  -  funnel the old wallet/developer flows to /check.
    return [
      { source: "/wallet-connect", destination: "/check", permanent: false },
      { source: "/connected", destination: "/check", permanent: false },
      { source: "/add-to-wallet", destination: "/check", permanent: false },
      { source: "/transaction-check", destination: "/check", permanent: false },
      { source: "/demo", destination: "/check", permanent: false },
      { source: "/post", destination: "/check", permanent: false },
      { source: "/response", destination: "/check", permanent: false },
    ];
  },
  turbopack: {
    // Coinbase's "Base Account" smart-wallet connector (with its optional Solana/x402
    // payment code) is pulled in transitively by @wagmi/connectors but is never used
    // here (EVM injected + WalletConnect only), and several of its dynamic imports
    // aren't installed. Stub the whole chain at its root instead of chasing each one.
    resolveAlias: {
      "@base-org/account": "./src/wallet/empty-module.ts",
      "@coinbase/cdp-sdk": "./src/wallet/empty-module.ts",
    },
  },
};

export default nextConfig;
