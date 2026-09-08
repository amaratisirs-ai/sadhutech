import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Get GENESIS Protection in MetaMask — GENESIS",
  description: "Install the GENESIS MetaMask Snap to screen transactions for drainer patterns and risky approvals before you sign.",
};

export default function SnapInstallLayout({ children }: { children: ReactNode }) {
  return children;
}
