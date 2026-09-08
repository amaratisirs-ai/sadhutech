import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Community Threat Intelligence — GENESIS",
  description: "Browse GENESIS's community-sourced feed of known drainer addresses, malicious contracts, and other on-chain threats.",
};

export default function ThreatsLayout({ children }: { children: ReactNode }) {
  return children;
}
