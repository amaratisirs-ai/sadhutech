import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Browser Extension — GENESIS",
  description: "Install the GENESIS browser extension to get pre-sign transaction warnings for known drainers and risky approvals as you browse.",
};

export default function ExtensionLayout({ children }: { children: ReactNode }) {
  return children;
}
