import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Pricing — GENESIS",
  description: "Simple, honest pricing for GENESIS's crypto transaction firewall — free tier plus pay-as-you-go Deep Check credits.",
};

export default function PricingLayout({ children }: { children: ReactNode }) {
  return children;
}
