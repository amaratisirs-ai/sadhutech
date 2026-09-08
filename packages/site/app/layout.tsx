import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Dancing_Script, Atkinson_Hyperlegible, Inter, Merriweather, Playfair_Display, Roboto_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { LayoutClient } from "./layout-client";

const dancingScript = Dancing_Script({ subsets: ["latin"], weight: "700", variable: "--font-dancing-script" });
// Font choices for /settings' font picker (src/useDisplaySettings.ts) - one real Google Font
// per standard type category (Sans Serif/Serif/Display/Handwriting/Monospace) rather than
// system font stacks, so the choice looks the same for every visitor regardless of OS/browser.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const merriweather = Merriweather({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-merriweather" });
const playfairDisplay = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const robotoMono = Roboto_Mono({ subsets: ["latin"], variable: "--font-roboto-mono" });
// Designed by the Braille Institute specifically to keep similarly-shaped letters
// (e.g. "l"/"I"/"1") distinguishable - the accessibility-focused option.
const atkinson = Atkinson_Hyperlegible({ subsets: ["latin"], weight: "400", variable: "--font-atkinson" });

export const metadata: Metadata = {
  metadataBase: new URL("https://sadhutech.com"),
  title: "GENESIS Firewall  -  Pre-sign Gate Dashboard | Bhusoft",
  description: "Community-powered transaction risk intelligence for crypto wallets. A Bhusoft LLC product.",
  keywords: ["crypto wallet security", "transaction firewall", "wallet drainer protection", "pre-sign transaction check", "MetaMask Snap security"],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "GENESIS Firewall",
    title: "GENESIS Firewall  -  Pre-sign Gate Dashboard",
    description: "Community-powered transaction risk intelligence for crypto wallets. By Bhusoft LLC.",
    url: "https://sadhutech.com",
    images: ["/opengraph-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "GENESIS Firewall  -  Pre-sign Gate Dashboard",
    description: "Community-powered transaction risk intelligence for crypto wallets. By Bhusoft LLC.",
    images: ["/opengraph-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// Helps Google's knowledge graph associate sadhutech.com with the current,
// active GENESIS/Bhusoft entity — the domain's search presence otherwise
// still reflects stale, unrelated info from a prior owner.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "GENESIS Firewall",
  url: "https://sadhutech.com",
  logo: "https://sadhutech.com/logo.png",
  description: "Community-powered transaction risk intelligence for crypto wallets. A Bhusoft LLC product.",
  sameAs: ["https://github.com/amaratisirs-ai/sadhutech", "https://bhusoft.com"],
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className={`h-full bg-slate-950 ${dancingScript.variable} ${atkinson.variable} ${inter.variable} ${merriweather.variable} ${playfairDisplay.variable} ${robotoMono.variable}`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <LayoutClient>{children}</LayoutClient>
        <Analytics />
      </body>
    </html>
  );
}
