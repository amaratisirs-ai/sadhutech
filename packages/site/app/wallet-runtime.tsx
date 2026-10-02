"use client";

import type { ReactNode } from "react";
import { Web3Provider } from "./web3-provider";
import { AnalyticsTracker } from "@/src/AnalyticsTracker";

export function WalletRuntime({ children, skipInitialPageView }: { children: ReactNode; skipInitialPageView: boolean }) {
  return (
    <Web3Provider>
      <AnalyticsTracker skipInitialPageView={skipInitialPageView} />
      {children}
    </Web3Provider>
  );
}