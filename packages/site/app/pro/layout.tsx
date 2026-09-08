import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Deep Checks, Pay-As-You-Go — GENESIS",
  description: "Buy GENESIS Deep Check credits with USDC for extra transaction risk checks beyond the free tier.",
};

export default function ProLayout({ children }: { children: ReactNode }) {
  return children;
}
