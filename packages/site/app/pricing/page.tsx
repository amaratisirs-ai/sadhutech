"use client";

const TIERS = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    tagline: "Instant scam checks for everyone.",
    highlight: false,
    cta: { label: "Check a transaction", href: "/check", disabled: false },
    features: [
      "Address & transaction checks",
      "Community threat feed (4,000+ addresses)",
      "EVM chains (Ethereum, Polygon, Arbitrum, Optimism, Avalanche)",
      "Plain-English verdicts (allow / warn / block)",
      "Report scams to the community",
    ],
  },
  {
    name: "Pro",
    price: "$19",
    cadence: "/month",
    tagline: "Deeper, cross-chain protection.",
    highlight: true,
    cta: { label: "Coming soon", href: "#", disabled: true },
    features: [
      "Everything in Free",
      "ChainAbuse-enriched threat feed",
      "Cross-chain coverage (BTC, Solana & more)",
      "Higher rate limits",
      "Drain & approval alerts (on the way)",
      "Check history",
    ],
  },
  {
    name: "Business / API",
    price: "From $499",
    cadence: "/month",
    tagline: "For wallets, dapps, and security teams.",
    highlight: false,
    cta: { label: "Contact us", href: "mailto:support@sadhutech.com", disabled: false },
    features: [
      "REST API with quota + SLA",
      "Full ChainAbuse-powered intel",
      "Webhooks & custom allow/deny lists",
      "Team dashboard",
      "Volume pricing",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="space-y-12">
      <header className="text-center space-y-3">
        <h1 className="text-4xl md:text-5xl font-black text-white">Simple, honest pricing</h1>
        <p className="text-slate-300 max-w-2xl mx-auto">
          Basic safety is free forever — that's how the community feed gets stronger. Pay only for depth, speed, and
          cross-chain coverage.
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className={`rounded-2xl border-2 p-6 flex flex-col ${
              t.highlight
                ? "border-teal-400 bg-gradient-to-br from-teal-900/40 to-slate-900 shadow-xl shadow-teal-500/20"
                : "border-slate-700 bg-slate-900/60"
            }`}
          >
            {t.highlight && (
              <span className="self-start mb-3 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-200">
                Most popular
              </span>
            )}
            <h2 className="text-2xl font-bold text-white">{t.name}</h2>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-black text-white">{t.price}</span>
              <span className="text-slate-400 text-sm">{t.cadence}</span>
            </div>
            <p className="mt-2 text-sm text-slate-300">{t.tagline}</p>

            <ul className="mt-5 space-y-2 flex-1">
              {t.features.map((f, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-200">
                  <span className="text-teal-400 flex-shrink-0">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {t.cta.disabled ? (
              <button
                disabled
                className="mt-6 w-full py-3 rounded-lg bg-slate-800 text-slate-400 font-bold cursor-not-allowed border border-slate-700"
              >
                {t.cta.label}
              </button>
            ) : (
              <a
                href={t.cta.href}
                className={`mt-6 w-full py-3 rounded-lg font-bold text-center transition ${
                  t.highlight
                    ? "bg-teal-500 text-slate-950 hover:bg-teal-400"
                    : "bg-slate-800 text-white border border-slate-600 hover:border-teal-400"
                }`}
              >
                {t.cta.label}
              </a>
            )}
          </div>
        ))}
      </div>

      <section className="max-w-3xl mx-auto bg-slate-900/50 border border-slate-700 rounded-2xl p-6 space-y-3">
        <h3 className="text-lg font-bold text-white">How Free vs Pro works</h3>
        <p className="text-sm text-slate-300">
          <strong className="text-white">Free</strong> checks against our community threat feed — thousands of
          scam addresses reported and confirmed by the community. <strong className="text-white">Pro</strong> adds
          ChainAbuse's premium threat intel for cross-chain coverage the free feed doesn't have yet.
        </p>
        <p className="text-xs text-slate-400">
          We will never paywall basic safety or charge you to report a scam — that's what keeps everyone protected.
        </p>
      </section>
    </div>
  );
}
