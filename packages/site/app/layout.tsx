import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Dancing_Script, Atkinson_Hyperlegible, Inter, Merriweather, Nunito } from "next/font/google";
import "./globals.css";
import { LayoutClient } from "./layout-client";

const dancingScript = Dancing_Script({ subsets: ["latin"], weight: "700", variable: "--font-dancing-script" });
// Font choices for components/DisplaySettings.tsx - real Google Fonts rather than system font
// stacks so the choice looks the same for every visitor regardless of OS/browser.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const merriweather = Merriweather({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-merriweather" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });
// Designed by the Braille Institute specifically to keep similarly-shaped letters
// (e.g. "l"/"I"/"1") distinguishable - the accessibility-focused option.
const atkinson = Atkinson_Hyperlegible({ subsets: ["latin"], weight: "400", variable: "--font-atkinson" });

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
      <body className={`h-full bg-slate-950 ${dancingScript.variable} ${atkinson.variable} ${inter.variable} ${merriweather.variable} ${nunito.variable}`}>
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
