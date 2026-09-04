"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ThemeProvider } from "./theme-provider";
import { Web3Provider } from "./web3-provider";
import { Icon } from "@/components/Icon";
import { AccountWidget } from "@/components/AccountWidget";
import { GateStatusProvider, useGateStatus } from "@/src/gate-status";

export function LayoutClient({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <Web3Provider>
    <GateStatusProvider>
    <ThemeProvider>
      {/* Modern Sticky Nav  -  Dark with Teal Border */}
      <nav className="bg-slate-950 backdrop-blur-xl border-b-2 border-teal-500 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4 md:gap-8">
              {/* Logo */}
              <a href="/" className="flex items-center gap-3 group" onClick={() => setMobileMenuOpen(false)}>
                <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center group-hover:shadow-lg group-hover:shadow-teal-500/50 transition-all">
                  <span className="text-slate-950 font-bold text-base">G</span>
                </div>
                <span className="text-xl font-bold text-white hidden sm:inline">GENESIS</span>
              </a>

              {/* Desktop Nav */}
              <div className="hidden md:flex gap-1">
                <NavLink href="/">Home</NavLink>
                <NavLink href="/check">Check</NavLink>
                <NavLink href="/threats">Threats Hub</NavLink>
                <NavLink href="/community">Community</NavLink>
                <NavLink href="/report">Report</NavLink>
                <NavLink href="/pricing">Pricing</NavLink>
                <NavLink href="/developers">Developers</NavLink>
                <NavLink href="/whitepaper">Vision</NavLink>
                <NavLink href="/help">Help</NavLink>
              </div>
            </div>

            {/* Status Badge & CTA & Hamburger */}
            <div className="flex items-center gap-2 md:gap-3">
              <GateStatusBadge />
              <AccountWidget />
              <a
                href="/check"
                className="hidden sm:inline px-3 py-1.5 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-lg transition-all hover:shadow-lg hover:shadow-teal-500/50"
              >
                Check a transaction
              </a>
              <a
                href="https://github.com/amaratisirs-ai/sadhutech"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-teal-300 hover:text-white hover:bg-teal-500/20 rounded-lg transition-all"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.544 2.914 1.186.092-.923.35-1.544.636-1.899-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.817c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.138 18.192 20 14.44 20 10.017 20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
              </a>

              {/* Hamburger Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-teal-300 hover:bg-teal-500/20 rounded-lg transition-all"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-teal-500/20 bg-slate-900 py-4">
              <div className="space-y-2">
                <MobileNavLink href="/" onClick={() => setMobileMenuOpen(false)}>Home</MobileNavLink>
                <MobileNavLink href="/#how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</MobileNavLink>
                <MobileNavLink href="/check" onClick={() => setMobileMenuOpen(false)}>Check</MobileNavLink>
                <MobileNavLink href="/threats" onClick={() => setMobileMenuOpen(false)}>Threats Hub</MobileNavLink>
                <MobileNavLink href="/community" onClick={() => setMobileMenuOpen(false)}>Community</MobileNavLink>
                <MobileNavLink href="/report" onClick={() => setMobileMenuOpen(false)}>Report</MobileNavLink>
                <MobileNavLink href="/pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</MobileNavLink>
                <MobileNavLink href="/developers" onClick={() => setMobileMenuOpen(false)}>Developers</MobileNavLink>
                <MobileNavLink href="/whitepaper" onClick={() => setMobileMenuOpen(false)}>Vision</MobileNavLink>
                <MobileNavLink href="/help" onClick={() => setMobileMenuOpen(false)}>Help</MobileNavLink>
                <a
                  href="/check"
                  className="block w-full px-4 py-2.5 text-sm font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-lg transition-all text-center mt-4"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Check a transaction
                </a>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24 md:pb-12">
        {children}
      </main>

      <button
        type="button"
        onClick={scrollToTop}
        className={`hidden md:flex fixed bottom-6 right-6 z-40 w-10 h-10 items-center justify-center rounded-lg border border-teal-400/40 bg-slate-900/90 text-teal-300 shadow-lg backdrop-blur transition-all hover:border-teal-300 hover:bg-slate-800 hover:text-white hover:-translate-y-0.5 ${showScrollTop ? "opacity-100" : "pointer-events-none opacity-0"}`}
        aria-label="Back to top"
        title="Back to top"
      >
        <Icon name="arrowUp" className="w-5 h-5" />
      </button>

      {/* Bottom Navigation (Mobile App-like) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950 border-t-2 border-teal-500 backdrop-blur-xl z-40 safe-bottom">
        <div className="flex justify-around items-center h-20">
          <BottomNavLink href="/" label="Home" icon={<HomeIcon />} />
          <BottomNavLink href="/threats" label="Threats" icon={<ThreatsIcon />} />
          <BottomNavLink href="/check" label="Check" icon={<ProtectIcon />} />
          <BottomNavLink href="/report" label="Report" icon={<ReportIcon />} />
          <BottomNavLink href="/help" label="Help" icon={<HelpIcon />} />
        </div>
      </nav>

      {/* Footer */}
      <footer className="border-t-2 border-teal-500 bg-slate-950 backdrop-blur-xl mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-28 md:pb-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-teal-300">
                <li><a href="/check" className="hover:text-white transition">Check a transaction</a></li>
                <li><a href="/after-install" className="hover:text-white transition">Getting Started</a></li>
                <li><a href="/threats" className="hover:text-white transition">Threats Hub</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Community</h4>
              <ul className="space-y-2 text-sm text-teal-300">
                <li><a href="/report" className="hover:text-white transition">Report Threat</a></li>
                <li><a href="/community" className="hover:text-white transition">Community</a></li>
                <li><a href="https://github.com/amaratisirs-ai/sadhutech" className="hover:text-white transition">GitHub</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-teal-300">
                <li><a href="/help" className="hover:text-white transition">Help Center</a></li>
                <li><a href="/whitepaper" className="hover:text-white transition">Vision & roadmap</a></li>
                <li><a href="mailto:support@genesis.com" className="hover:text-white transition">Email Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-teal-300">
                <li><a href="#privacy" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#terms" className="hover:text-white transition">Terms</a></li>
                <li><a href="#security" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-teal-500/20 pt-8 text-center text-sm text-teal-200">
            <p className="font-medium">GENESIS Firewall v0.1  -  Community-powered pre-sign gate for crypto wallets</p>
            <p className="mt-2 text-xs text-teal-300">
              Powered by <a href="https://bhusoft.com" className="text-teal-300 hover:text-teal-100 underline transition">Bhusoft LLC</a> • <a href="https://github.com/amaratisirs-ai" className="text-teal-300 hover:text-teal-100 underline transition">Open Source</a>
            </p>
            <p className="mt-1 text-xs text-slate-400">&copy; 2026 Bhusoft LLC. GENESIS is a Bhusoft product.</p>
          </div>
        </div>
      </footer>
    </ThemeProvider>
    </GateStatusProvider>
    </Web3Provider>
  );
}

function GateStatusBadge() {
  const status = useGateStatus();
  const label = status === "waking" ? "Waking up…" : status === "checking" ? "Connecting…" : "Live";
  const dotColor = status === "waking" ? "bg-amber-400" : status === "checking" ? "bg-slate-400" : "bg-teal-400";
  return (
    <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-teal-500/30 text-teal-200 text-xs font-semibold rounded-full border border-teal-400/50 backdrop-blur-sm">
      <span className={`w-2 h-2 rounded-full animate-pulse ${dotColor}`}></span>
      {label}
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="px-3 py-2 text-sm font-bold text-teal-300 hover:text-white hover:bg-teal-500/20 rounded-lg transition-all flex items-center gap-2"
    >
      {children}
    </a>
  );
}

function MobileNavLink({ href, children, onClick }: { href: string; children: ReactNode; onClick?: () => void }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="block px-4 py-3 text-base font-bold text-teal-300 hover:text-white hover:bg-teal-500/20 rounded-lg transition-all"
    >
      {children}
    </a>
  );
}

function BottomNavLink({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
  return (
    <a
      href={href}
      className="flex flex-col items-center justify-center gap-1 w-full h-full text-teal-300 hover:text-white hover:bg-teal-500/20 transition-all group min-h-20"
    >
      <div className="group-hover:scale-110 transition-transform text-2xl">{icon}</div>
      <span className="text-xs font-semibold">{label}</span>
    </a>
  );
}

// Icons
function HomeIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 13l4-8m4 8L9 5" />
    </svg>
  );
}

function ThreatsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function ProtectIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m0 0h6m-6-6h-6" />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8m0 8l-6-4m6 4l6-4" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.291-.994.599 0 .11.023.207.066.286m0 0a9.75 9.75 0 01-.466 4.04m.466-4.04a9.75 9.75 0 001.457 4.04m0 0a9.75 9.75 0 001.457-4.04m0 0a9.75 9.75 0 01-.466-4.04" />
    </svg>
  );
}
