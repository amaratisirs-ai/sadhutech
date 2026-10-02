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
    price: "From 1 USDC",
    cadence: "/ check",
    tagline: "Pay only for what you check.",
    highlight: true,
    cta: { label: "Buy credits", href: "/pro", disabled: false },
    features: [
      "Everything in Free",
      "Third-party address security checks where available",
      "Additional global scam-report database lookup",
      "Pay-as-you-go  -  no subscription, no account",
      "Pay what you like, min 1 USDC",
      "Checks tied to your wallet",
    ],
  },
  {
    name: "Business / API",
    price: "From $499",
    cadence: "/month",
    tagline: "For wallets, dapps, and security teams.",
    highlight: false,
    cta: { label: "Contact us", href: "mailto:security@sadhutech.com", disabled: false },
    features: [
      "REST API with quota + SLA",
      "Full enterprise threat intel",
      "Webhooks & custom allow/deny lists",
      "Team dashboard",
      "Volume pricing",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="-mx-4 space-y-12 bg-[#F3F5F2] px-5 py-10 text-[#152626] sm:-mx-6 sm:px-8 sm:py-16 lg:-mx-8">
      <header className="mx-auto max-w-5xl space-y-3 border-b border-[#B8C8C3] pb-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#A65B3D]">Plans / GENESIS</p>
        <h1 className="text-4xl font-black sm:text-5xl">Simple, honest pricing</h1>
        <p className="max-w-2xl text-[#465D5A]">
          Free checks for supported networks. Pay for additional threat intelligence when you need it.
        </p>
      </header>

      <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className={`flex flex-col rounded-md border p-6 ${
              t.highlight
                ? "border-[#08776D] bg-[#E1E9E5]"
                : "border-[#B8C8C3] bg-[#FFFFFF]"
            }`}
          >
            {t.highlight && (
              <span className="mb-3 self-start border-l-2 border-[#08776D] pl-2 text-xs font-bold uppercase text-[#08776D]">
                Extra coverage
              </span>
            )}
            <h2 className="text-2xl font-bold text-[#152626]">{t.name}</h2>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-black text-[#152626]">{t.price}</span>
              <span className="text-sm text-[#667A76]">{t.cadence}</span>
            </div>
            <p className="mt-2 text-sm text-[#465D5A]">{t.tagline}</p>

            <ul className="mt-5 space-y-2 flex-1">
              {t.features.map((f, i) => (
                <li key={i} className="flex gap-2 text-sm text-[#465D5A]">
                  <span className="flex-shrink-0 text-[#08776D]">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {t.cta.disabled ? (
              <button
                disabled
                className="mt-6 w-full cursor-not-allowed rounded-md border border-[#B8C8C3] bg-[#E1E9E5] py-3 font-bold text-[#667A76]"
              >
                {t.cta.label}
              </button>
            ) : (
              <a
                href={t.cta.href}
                className={`mt-6 w-full rounded-md py-3 text-center font-bold transition-colors ${
                  t.highlight
                    ? "bg-[#08776D] text-[#FFFFFF] hover:bg-[#0B625B]"
                    : "border border-[#152626] bg-[#152626] text-[#FFFFFF] hover:bg-[#28524E]"
                }`}
              >
                {t.cta.label}
              </a>
            )}
          </div>
        ))}
      </div>

      <section className="mx-auto max-w-5xl space-y-3 border-t border-[#B8C8C3] pt-6">
        <h3 className="text-lg font-bold text-[#152626]">How Free vs Pro works</h3>
        <p className="max-w-3xl text-sm text-[#465D5A]">
          <strong className="text-[#152626]">Free</strong> checks use our community threat feed. <strong className="text-[#152626]">Pro</strong> adds third-party address security checks where available and an additional global scam-report lookup; one credit is used for each new deep-check result.
        </p>
        <p className="text-xs text-[#667A76]">
          We will never paywall basic safety or charge you to report a scam  -  that's what keeps everyone protected.
        </p>
      </section>
    </div>
  );
}
