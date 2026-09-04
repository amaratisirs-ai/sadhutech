import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // MVP is a standalone checker — funnel the old wallet/developer flows to /check.
    return [
      { source: "/wallet-connect", destination: "/check", permanent: false },
      { source: "/connected", destination: "/check", permanent: false },
      { source: "/add-to-wallet", destination: "/check", permanent: false },
      { source: "/transaction-check", destination: "/check", permanent: false },
      { source: "/demo", destination: "/check", permanent: false },
    ];
  },
};

export default nextConfig;
