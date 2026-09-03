import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { LayoutClient } from "./layout-client";

export const metadata: Metadata = {
  title: "GENESIS Firewall — Pre-sign Gate Dashboard | Bhusoft",
  description: "Community-powered transaction risk intelligence for crypto wallets. A Bhusoft LLC product.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  openGraph: {
    type: "website",
    title: "GENESIS Firewall — Pre-sign Gate Dashboard",
    description: "Community-powered transaction risk intelligence for crypto wallets. By Bhusoft LLC.",
    url: "https://sadhutech-site.vercel.app",
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="h-full bg-slate-950">
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
