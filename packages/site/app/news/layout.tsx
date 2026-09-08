import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Breaking Threats & Articles — GENESIS",
  description: "The latest crypto threats, drainer campaigns, security tips, and articles from GENESIS.",
};

export default function NewsLayout({ children }: { children: ReactNode }) {
  return children;
}
