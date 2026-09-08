import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Interactive Demo — GENESIS",
  description: "Try GENESIS's pre-sign transaction firewall on sample transactions — benign transfers, unlimited approvals, and known drainer patterns — and see the verdict it returns.",
};

export default function DemoLayout({ children }: { children: ReactNode }) {
  return children;
}
