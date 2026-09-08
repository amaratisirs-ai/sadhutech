import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Security Community — GENESIS",
  description: "Report threats, earn rewards, and join the community that powers GENESIS's threat intelligence feed.",
};

export default function CommunityLayout({ children }: { children: ReactNode }) {
  return children;
}
