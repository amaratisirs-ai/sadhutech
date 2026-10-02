import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Security News & Articles — GENESIS",
  description: "Recent security and crypto safety headlines from independent publishers, alongside GENESIS research and practical safety guidance.",
};

export default function NewsLayout({ children }: { children: ReactNode }) {
  return children;
}
