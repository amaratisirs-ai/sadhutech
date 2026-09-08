import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Help & Support — GENESIS",
  description: "Answers to common questions about GENESIS's transaction firewall, browser extension, and MetaMask Snap.",
};

export default function HelpLayout({ children }: { children: ReactNode }) {
  return children;
}
