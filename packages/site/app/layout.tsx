import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Dancing_Script } from "next/font/google";
import "./globals.css";
import { LayoutClient } from "./layout-client";

const dancingScript = Dancing_Script({ subsets: ["latin"], weight: "700", variable: "--font-dancing-script" });

export const metadata: Metadata = {
  title: "GENESIS Firewall  -  Pre-sign Gate Dashboard | Bhusoft",
  description: "Community-powered transaction risk intelligence for crypto wallets. A Bhusoft LLC product.",
  openGraph: {
    type: "website",
    title: "GENESIS Firewall  -  Pre-sign Gate Dashboard",
    description: "Community-powered transaction risk intelligence for crypto wallets. By Bhusoft LLC.",
    url: "https://sadhutech.com",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className={`h-full bg-slate-950 ${dancingScript.variable}`}>
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
