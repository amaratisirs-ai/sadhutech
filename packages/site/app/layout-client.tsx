"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "./theme-provider";
import { Icon, type IconName } from "@/components/Icon";
import { applySavedDisplaySettings } from "@/src/useDisplaySettings";
import { GateStatusProvider, useGateStatus } from "@/src/gate-status";
import { trackEvent } from "@/src/analytics";
import { requiresWalletRuntime } from "@/src/wallet/routes";

const WalletRuntime = dynamic(() => import("./wallet-runtime").then((module) => module.WalletRuntime));
const AccountWidget = dynamic(() => import("@/components/AccountWidget").then((module) => module.AccountWidget));

const GATE_URL = process.env.NEXT_PUBLIC_GATE_URL || "https://genesis-gate.onrender.com";
const WALLET_CONNECTED_KEY = "genesis_wallet_connected";

export function LayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const walletRoute = requiresWalletRuntime(pathname);
  const [walletRequested, setWalletRequested] = useState(false);
  const [connectRequested, setConnectRequested] = useState(false);
  const walletEnabled = walletRoute || walletRequested;
  const trackedPath = useRef<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  useEffect(() => {
    applySavedDisplaySettings();
    if (window.localStorage.getItem(WALLET_CONNECTED_KEY)) {
      const activation = window.setTimeout(() => setWalletRequested(true), 0);
      return () => window.clearTimeout(activation);
    }
  }, []);

  useEffect(() => {
    if (!walletRoute) return;
    const activation = window.setTimeout(() => setWalletRequested(true), 0);
    return () => window.clearTimeout(activation);
  }, [walletRoute]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (walletEnabled || trackedPath.current === pathname) return;
    trackedPath.current = pathname;
    trackEvent("page_view", { page: pathname });
    const onError = (event: ErrorEvent) => trackEvent("error", { page: pathname, meta: { message: event.message?.slice(0, 300), source: "window.onerror" } });
    const onRejection = (event: PromiseRejectionEvent) => trackEvent("error", { page: pathname, meta: { message: String(event.reason).slice(0, 300), source: "unhandledrejection" } });
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, [pathname, walletEnabled]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = subscribeEmail.trim();
    if (!email) return;
    setSubscribeStatus("loading");
    try {
      const res = await fetch(`${GATE_URL}/v1/newsletter/subscribe`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, source: "footer" }),
      });
      if (!res.ok) throw new Error("subscribe failed");
      setSubscribeStatus("ok");
      setSubscribeEmail("");
    } catch {
      setSubscribeStatus("error");
    }
  };

  const content = (
    <GateStatusProvider>
    <ThemeProvider>
      <nav className="sticky top-0 z-50 border-b border-[#30423F] bg-[#081311]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-[4.5rem] items-center justify-between">
            <div className="flex min-w-0 items-center gap-4 md:gap-7">
              {/* Logo */}
              <a href="/" className="group flex shrink-0 items-center gap-2.5" onClick={() => setMobileMenuOpen(false)}>
                <img src="/logo.png" alt="GENESIS" className="h-11 w-11 object-contain md:h-12 md:w-12" />
                <span className="hidden flex-col leading-none sm:flex">
                  <span className="font-script text-[1.7rem] text-[#F3F5F2]">
                    Genesis
                  </span>
                  <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#91AFA7]">by sadhutech</span>
                </span>
              </a>

              {/* Desktop Nav */}
              <div className="hidden items-center gap-1 lg:flex">
                <NavLink href="/products">Products</NavLink>
                <NavLink href="/check">Check</NavLink>
                <NavLink href="/news">News</NavLink>
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
                    { href: "/threats", label: "Threats Hub" },
                    { href: "/pricing", label: "Pricing" },
                    { href: "/demo", label: "Demo" },
                    { href: "/developers", label: "Developers" },
                    { href: "/partners", label: "Integrations & Partners" },
                    { href: "/whitepaper", label: "Vision & Roadmap" },
                    { href: "/help", label: "Help Center" },
                    { href: "/settings", label: "Display Settings", icon: "settings" },
                  ]}
                />
              </div>
            </div>

            {/* Status Badge & CTA & Hamburger */}
            <div className="flex shrink-0 items-center gap-2 md:gap-3">
              <GateStatusBadge />
              {walletEnabled ? <AccountWidget autoConnect={connectRequested} /> : (
                <button type="button" onClick={() => { setWalletRequested(true); setConnectRequested(true); }} className="inline-flex min-h-10 items-center rounded-md bg-[#BCE6DB] px-3 text-xs font-bold text-[#10201D] transition-colors hover:bg-[#F3F5F2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BCE6DB] sm:px-4">
                  Connect
                </button>
              )}

              {/* Hamburger Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex h-11 w-11 items-center justify-center rounded-md text-[#BCE6DB] transition-colors hover:bg-[#1B302C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BCE6DB] lg:hidden"
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-navigation"
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
            <div id="mobile-navigation" className="max-h-[calc(100dvh-10rem)] overflow-y-auto overscroll-contain border-t border-[#30423F] bg-[#0C1816] py-3 lg:hidden">
              <div className="space-y-1">
                <MobileNavLink href="/" onClick={() => setMobileMenuOpen(false)}>Home</MobileNavLink>
                <MobileNavLink href="/products" onClick={() => setMobileMenuOpen(false)}>Products</MobileNavLink>
                <MobileNavLink href="/news" onClick={() => setMobileMenuOpen(false)}>News &amp; Articles</MobileNavLink>

                <MobileSectionLabel>Community</MobileSectionLabel>
                <MobileNavLink href="/report" onClick={() => setMobileMenuOpen(false)}>Report a Threat</MobileNavLink>
                <MobileNavLink href="/community" onClick={() => setMobileMenuOpen(false)}>Community</MobileNavLink>
                <MobileNavLink href="https://github.com/amaratisirs-ai/sadhutech" onClick={() => setMobileMenuOpen(false)}>GitHub</MobileNavLink>

                <MobileSectionLabel>Resources</MobileSectionLabel>
                <MobileNavLink href="/threats" onClick={() => setMobileMenuOpen(false)}>Threats Hub</MobileNavLink>
                <MobileNavLink href="/pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</MobileNavLink>
                <MobileNavLink href="/demo" onClick={() => setMobileMenuOpen(false)}>Demo</MobileNavLink>
                <MobileNavLink href="/developers" onClick={() => setMobileMenuOpen(false)}>Developers</MobileNavLink>
                <MobileNavLink href="/partners" onClick={() => setMobileMenuOpen(false)}>Integrations & Partners</MobileNavLink>
                <MobileNavLink href="/whitepaper" onClick={() => setMobileMenuOpen(false)}>Vision & Roadmap</MobileNavLink>
                <MobileNavLink href="/help" onClick={() => setMobileMenuOpen(false)}>Help Center</MobileNavLink>
                <MobileNavLink href="/settings" onClick={() => setMobileMenuOpen(false)}>Display Settings</MobileNavLink>
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
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#30423F] bg-[#081311]/95 backdrop-blur-xl safe-bottom md:hidden">
        <div className="flex justify-around items-center h-20">
          <BottomNavLink href="/" label="Home" icon={<HomeIcon />} />
          <BottomNavLink href="/threats" label="Threats" icon={<ThreatsIcon />} />
          <BottomNavLink href="/check" label="Check" icon={<ProtectIcon />} />
          <BottomNavLink href="/report" label="Report" icon={<ReportIcon />} />
          <BottomNavLink href="/news" label="News" icon={<Icon name="newspaper" className="h-6 w-6" />} />
        </div>
      </nav>

      {/* Footer */}
      <footer className="border-t-2 border-teal-500 bg-slate-950 backdrop-blur-xl mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-28 md:pb-8">
          <div className="mb-10 pb-8 border-b border-teal-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-white">Stay updated</h4>
              <p className="text-sm text-teal-300 mt-1 max-w-md">Threat feed highlights, product updates, and occasional newsletters. Unsubscribe anytime.</p>
            </div>
            <div className="w-full md:w-auto">
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <input
                  type="email"
                  required
                  value={subscribeEmail}
                  onChange={(e) => { setSubscribeEmail(e.target.value); setSubscribeStatus("idle"); }}
                  placeholder="you@example.com"
                  className="px-4 py-2 rounded-lg bg-slate-900 border-2 border-slate-700 focus:border-teal-400 text-white text-sm outline-none w-full sm:w-64"
                />
                <button
                  type="submit"
                  disabled={subscribeStatus === "loading"}
                  className="px-5 py-2 rounded-lg bg-teal-500 text-slate-950 font-bold text-sm hover:bg-teal-400 disabled:opacity-50 transition whitespace-nowrap"
                >
                  {subscribeStatus === "loading" ? "Subscribing…" : "Subscribe"}
                </button>
              </form>
              {subscribeStatus === "ok" && <p className="text-xs text-emerald-300 mt-1.5">Subscribed  -  thanks!</p>}
              {subscribeStatus === "error" && <p className="text-xs text-rose-300 mt-1.5">Couldn&apos;t subscribe right now. Please try again.</p>}
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-teal-300">
                <li><a href="/products" className="hover:text-white transition">All products</a></li>
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
                <li><a href="/news" className="hover:text-white transition">News & Articles</a></li>
                <li><a href="https://github.com/amaratisirs-ai/sadhutech" className="hover:text-white transition">GitHub</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-teal-300">
                <li><a href="/help" className="hover:text-white transition">Help Center</a></li>
                <li><a href="/whitepaper" className="hover:text-white transition">Vision & roadmap</a></li>
                <li><a href="mailto:security@sadhutech.com" className="hover:text-white transition">Email Support</a></li>
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
            <p className="font-medium"><span className="font-script text-base">GENESIS</span> Firewall v0.1  -  Community-powered pre-sign gate for crypto wallets</p>
            <p className="mt-2 text-xs text-teal-300">
              <span className="font-script text-sm">GENESIS</span> is <a href="https://sadhutech.com" className="text-teal-300 hover:text-teal-100 underline transition">sadhutech</a>'s first product  -  <a href="/products" className="text-teal-300 hover:text-teal-100 underline transition">see what's next</a>
            </p>
            <p className="mt-2 text-xs text-teal-300">
              Powered by <a href="https://bhusoft.com" className="text-teal-300 hover:text-teal-100 underline transition">Bhusoft LLC</a> • <a href="https://github.com/amaratisirs-ai" className="text-teal-300 hover:text-teal-100 underline transition">Open Source</a>
            </p>
            <p className="mt-1 text-xs text-slate-400">&copy; 2026 Bhusoft LLC. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </ThemeProvider>
    </GateStatusProvider>
  );

  return walletEnabled ? <WalletRuntime skipInitialPageView={connectRequested && !walletRoute}>{content}</WalletRuntime> : content;
}

function GateStatusBadge() {
  const status = useGateStatus();
  const label = status === "unavailable" ? "Waking up.." : status === "checking" ? "Connecting…" : "Live";
  const dotColor = status === "unavailable" ? "bg-amber-400" : status === "checking" ? "bg-slate-400" : "bg-teal-400";
  return (
    <div role="status" className="hidden items-center gap-2 rounded-md border border-[#30423F] bg-[#12201D] px-3 py-1.5 text-xs font-semibold text-[#BCE6DB] sm:flex">
      <span className={`w-2 h-2 rounded-full animate-pulse ${dotColor}`}></span>
      {label}
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const active = usePathname() === href;
  return (
    <a
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BCE6DB] ${active ? "bg-[#1B302C] text-[#F3F5F2]" : "text-[#B6C8C2] hover:bg-[#152522] hover:text-[#F3F5F2]"}`}
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
  items: { href: string; label: string; external?: boolean; icon?: IconName }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const active = items.some((item) => item.href === pathname);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={`dropdown-${label.toLowerCase()}`}
        className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BCE6DB] ${active || open ? "bg-[#1B302C] text-[#F3F5F2]" : "text-[#B6C8C2] hover:bg-[#152522] hover:text-[#F3F5F2]"}`}
      >
        {label}
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div id={`dropdown-${label.toLowerCase()}`} className="absolute left-0 top-full z-50 w-64 pt-2">
          <div className="overflow-hidden rounded-lg border border-[#30423F] bg-[#0F1B19] py-1.5 shadow-xl shadow-black/25">
            {items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                onClick={() => setOpen(false)}
                aria-current={item.href === pathname ? "page" : undefined}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BCE6DB] ${item.href === pathname ? "bg-[#1B302C] text-[#F3F5F2]" : "text-[#B6C8C2] hover:bg-[#172723] hover:text-[#F3F5F2]"}`}
              >
                {item.icon && <Icon name={item.icon} className="w-4 h-4 shrink-0" />}
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
    <p className="mx-4 border-b border-[#30423F] px-1 pb-1 pt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#91AFA7]">{children}</p>
  );
}

function MobileNavLink({ href, children, onClick }: { href: string; children: ReactNode; onClick?: () => void }) {
  const active = usePathname() === href;
  return (
    <a
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`mx-1 block rounded-md px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#BCE6DB] ${active ? "bg-[#1B302C] text-[#F3F5F2]" : "text-[#B6C8C2] hover:bg-[#152522] hover:text-[#F3F5F2]"}`}
    >
      {children}
    </a>
  );
}

function BottomNavLink({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
  const active = usePathname() === href;
  return (
    <a
      href={href}
      aria-current={active ? "page" : undefined}
      className={`group flex h-full min-h-20 w-full flex-col items-center justify-center gap-1 border-t-2 transition-colors ${active ? "border-[#BCE6DB] bg-[#12201D] text-[#F3F5F2]" : "border-transparent text-[#91AFA7] hover:bg-[#12201D] hover:text-[#F3F5F2]"}`}
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
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.008v.008H12v-.008Z" />
    </svg>
  );
}

