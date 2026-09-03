import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./theme-provider";

export const metadata: Metadata = {
  title: "GENESIS Firewall — Pre-sign Gate Dashboard",
  description: "Community-powered transaction risk intelligence for crypto wallets.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="h-full bg-slate-950">
        <ThemeProvider>
          {/* Modern Sticky Nav — Dark with Teal Border */}
          <nav className="bg-slate-950 backdrop-blur-xl border-b-2 border-teal-500 sticky top-0 z-50 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-8">
                  {/* Logo */}
                  <a href="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center group-hover:shadow-lg group-hover:shadow-teal-500/50 transition-all">
                      <span className="text-slate-950 font-bold text-base">G</span>
                    </div>
                    <span className="text-xl font-bold text-white">GENESIS</span>
                  </a>

                  {/* Desktop Nav */}
                  <div className="hidden md:flex gap-1">
                    <NavLink href="/">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 13l4-8m4 8L9 5" /></svg>
                      Overview
                    </NavLink>
                    <NavLink href="/post">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Verify
                    </NavLink>
                    <NavLink href="/demo">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      Demo
                    </NavLink>
                    <NavLink href="/news">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.5 1h-8C6.12 1 5 2.12 5 3.5v17C5 21.88 6.12 23 7.5 23h8c1.38 0 2.5-1.12 2.5-2.5v-17C18 2.12 16.88 1 15.5 1zm-4 21c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5-4H7V4h9v14z" /></svg>
                      News
                    </NavLink>
                    <NavLink href="/threats">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 5v.01M7.08 6.24l1.41 1.41m2.83-2.83l1.41-1.41m4.24 4.24l1.41 1.41m2.83-2.83l1.41-1.41M7.08 17.76l1.41-1.41m2.83 2.83l1.41 1.41m4.24-4.24l1.41-1.41m2.83 2.83l1.41 1.41" /></svg>
                      Threats
                    </NavLink>
                    <NavLink href="/report">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8m0 8l-6-4m6 4l6-4" /></svg>
                      Report
                    </NavLink>
                    <NavLink href="/api-explorer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4m0 0l-4 4m4-4H3" /></svg>
                      API
                    </NavLink>
                  </div>
                </div>

                {/* Status Badge & CTA */}
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-teal-500/30 text-teal-200 text-xs font-semibold rounded-full border border-teal-400/50 backdrop-blur-sm">
                    <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></span>
                    Live
                  </div>
                  <a
                    href="https://github.com/sadhutech/genesis"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-teal-300 hover:text-white hover:bg-teal-500/20 rounded-lg transition-all"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.544 2.914 1.186.092-.923.35-1.544.636-1.899-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.817c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.138 18.192 20 14.44 20 10.017 20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </nav>

          {/* Main content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t-2 border-teal-500 bg-slate-950 backdrop-blur-xl mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center text-sm text-teal-200">
                <p className="font-medium">GENESIS Firewall v0.1 — Community-powered pre-sign gate for crypto wallets</p>
                <p className="mt-2 text-xs text-teal-300">
                  Made for wallet security. <a href="https://github.com/sadhutech" className="text-teal-300 hover:text-teal-100 underline transition">Join us on GitHub</a>
                </p>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="px-3 py-2 text-sm font-bold text-teal-300 hover:text-white hover:bg-teal-500/20 rounded-lg transition-all flex items-center gap-2 group"
    >
      {children}
    </a>
  );
}
