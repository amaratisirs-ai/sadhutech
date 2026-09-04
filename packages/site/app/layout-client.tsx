"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Dancing_Script } from "next/font/google";
import { ThemeProvider } from "./theme-provider";
import { Web3Provider } from "./web3-provider";
import { Icon } from "@/components/Icon";
import { AccountWidget } from "@/components/AccountWidget";
import { GateStatusProvider, useGateStatus } from "@/src/gate-status";

const dancingScript = Dancing_Script({ subsets: ["latin"], weight: "700" });

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
                <img src="/logo.png" alt="GENESIS" className="w-14 h-14 object-contain" />
                <span className={`${dancingScript.className} text-3xl tracking-wide hidden sm:inline bg-gradient-to-r from-white via-slate-200 to-teal-300 bg-clip-text text-transparent`}>
                  Genesis
                </span>
              </a>

              {/* Desktop Nav */}
              <div className="hidden md:flex items-center gap-1">
                <NavLink href="/check">Check</NavLink>
                <NavLink href="/threats">Threats Hub</NavLink>
                <NavLink href="/pricing">Pricing</NavLink>
                <NavDropdown
                  label="Community"
                  items={[
                    { href: "/report", label: "Report a Threat" },
                    { href: "/community", label: "Community" },
                    { href: "https://github.com/amaratisirs-ai/sadhutech", label: "GitHub", external: true },
                  ]}
                />
                <NavDropdown
                  label="Resources"
                  items={[
                    { href: "/developers", label: "Developers" },
                    { href: "/partners", label: "Integrations & Partners" },
                    { href: "/whitepaper", label: "Vision & Roadmap" },
                    { href: "/help", label: "Help Center" },
                  ]}
                />
              </div>
            </div>

            {/* Status Badge & CTA & Hamburger */}
            <div className="flex items-center gap-2 md:gap-3">
              <GateStatusBadge />
              <AccountWidget />

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
              <div className="space-y-1">
                <MobileNavLink href="/" onClick={() => setMobileMenuOpen(false)}>Home</MobileNavLink>
                <MobileNavLink href="/threats" onClick={() => setMobileMenuOpen(false)}>Threats Hub</MobileNavLink>
                <MobileNavLink href="/pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</MobileNavLink>

                <MobileSectionLabel>Community</MobileSectionLabel>
                <MobileNavLink href="/report" onClick={() => setMobileMenuOpen(false)}>Report a Threat</MobileNavLink>
                <MobileNavLink href="/community" onClick={() => setMobileMenuOpen(false)}>Community</MobileNavLink>
                <MobileNavLink href="https://github.com/amaratisirs-ai/sadhutech" onClick={() => setMobileMenuOpen(false)}>GitHub</MobileNavLink>

                <MobileSectionLabel>Resources</MobileSectionLabel>
                <MobileNavLink href="/developers" onClick={() => setMobileMenuOpen(false)}>Developers</MobileNavLink>
                <MobileNavLink href="/partners" onClick={() => setMobileMenuOpen(false)}>Integrations & Partners</MobileNavLink>
                <MobileNavLink href="/whitepaper" onClick={() => setMobileMenuOpen(false)}>Vision & Roadmap</MobileNavLink>
                <MobileNavLink href="/help" onClick={() => setMobileMenuOpen(false)}>Help Center</MobileNavLink>
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
                <li><a href="/partners" className="hover:text-white transition">Integrations &amp; Partners</a></li>
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
                <li><a href="mailto:contact@bhusoft.com" className="hover:text-white transition">Email Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-teal-300">
                <li><a href="/privacy" className="hover:text-white transition">Privacy</a></li>
                <li><a href="/terms" className="hover:text-white transition">Terms</a></li>
                <li><a href="/help" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-teal-500/20 pt-8 text-center text-sm text-teal-200">
            <p className="font-medium">GENESIS Firewall v0.1  -  Community-powered pre-sign gate for crypto wallets</p>
            <p className="mt-2 text-xs text-teal-300">
              Powered by <a href="https://bhusoft.com" className="text-teal-300 hover:text-teal-100 underline transition">Bhusoft LLC</a> • <a href="https://github.com/amaratisirs-ai" className="text-teal-300 hover:text-teal-100 underline transition">Open Source</a>
            </p>
            <p className="mt-1 text-xs text-slate-400">&copy; 2026 Bhusoft LLC. All rights reserved.</p>
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

function NavDropdown({
  label,
  items,
}: {
  label: string;
  items: { href: string; label: string; external?: boolean }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        className="px-3 py-2 text-sm font-bold text-teal-300 hover:text-white hover:bg-teal-500/20 rounded-lg transition-all flex items-center gap-1.5"
      >
        {label}
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full pt-2 w-56 z-50">
          <div className="bg-slate-900 border border-teal-500/30 rounded-xl shadow-xl shadow-black/40 py-2 overflow-hidden">
            {items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-sm font-semibold text-teal-200 hover:text-white hover:bg-teal-500/10 transition-all"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MobileSectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-4 pt-4 pb-1 text-xs font-bold uppercase tracking-wider text-teal-500/70">{children}</p>
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
