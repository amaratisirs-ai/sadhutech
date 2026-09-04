export const metadata = {
  title: "Integrations & Partners — GENESIS",
};

function Partner({ name, blurb, href }: { name: string; blurb: string; href?: string }) {
  return (
    <div className="bg-slate-900/50 border border-teal-500/30 rounded-xl p-5 space-y-1.5">
      <h3 className="font-bold text-white">
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-teal-300 hover:underline">
            {name}
          </a>
        ) : (
          name
        )}
      </h3>
      <p className="text-sm text-slate-400">{blurb}</p>
    </div>
  );
}

export default function PartnersPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-10 py-8 text-slate-200">
      <header className="space-y-2">
        <h1 className="text-3xl font-black text-white">Integrations &amp; Partners</h1>
        <p className="text-sm text-slate-400">
          GENESIS is built on top of a small set of trusted data and infrastructure providers. Here's who they are
          and what each one does for you.
        </p>
      </header>

      <div className="rounded-xl border-2 border-slate-700 bg-slate-900/50 p-4 text-sm text-slate-400">
        Company names and marks below belong to their respective owners. Listing a provider here describes a
        technical integration used to run GENESIS &mdash; it is not a paid endorsement, sponsorship, or formal
        business partnership unless stated otherwise.
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Risk &amp; threat intelligence</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Partner
            name="GoPlus Security"
            href="https://gopluslabs.io"
            blurb="Malicious-address and phishing-site detection API, checked on every transaction and signature request."
          />
          <Partner
            name="ChainAbuse (a TRM Labs product)"
            href="https://www.chainabuse.com"
            blurb="Community-reported scam and hack address database, used for Pro deep checks."
          />
          <Partner
            name="Blockaid"
            href="https://blockaid.io"
            blurb="Real-time Web3 threat feed (drainers, scams, exploits) — a supported data source for our threat sync."
          />
          <Partner
            name="Scam Sniffer"
            href="https://github.com/scamsniffer/scam-database"
            blurb="Open phishing-address blacklist, synced into our community threat feed."
          />
          <Partner
            name="CryptoScamDB"
            href="https://github.com/CryptoScamDB/blacklist"
            blurb="Open-source scam and phishing address database, synced into our community threat feed."
          />
          <Partner
            name="Rugdoc"
            href="https://rugdoc.io"
            blurb="Community-confirmed rug-pull token database, synced into our community threat feed."
          />
          <Partner
            name="SlowMist"
            href="https://slowmist.com"
            blurb="Public security alerts on flagged contracts, synced into our community threat feed."
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Wallet connectivity</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Partner
            name="Reown (formerly WalletConnect)"
            href="https://reown.com"
            blurb="Powers the \u201cConnect wallet\u201d flow used across the site and mobile."
          />
          <Partner
            name="MetaMask"
            href="https://metamask.io"
            blurb="GENESIS ships as a MetaMask Snap, running pre-sign checks directly inside the wallet."
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Infrastructure</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Partner name="Neon" href="https://neon.tech" blurb="Serverless Postgres — hosts threat intel, credit balances, and audit logs." />
          <Partner name="Render" href="https://render.com" blurb="Hosts the GENESIS Gate API." />
          <Partner name="Vercel" href="https://vercel.com" blurb="Hosts the GENESIS website." />
          <Partner
            name="Tenderly"
            href="https://tenderly.co"
            blurb="Optional transaction fork simulation, used to improve decode accuracy when configured."
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Trust &amp; delivery</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Partner
            name="Cloudflare Turnstile"
            href="https://www.cloudflare.com/products/turnstile/"
            blurb="Privacy-preserving bot check on the threat-report form."
          />
          <Partner name="Resend" href="https://resend.com" blurb="Sends the report-confirmation email." />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-white">Questions</h2>
        <p className="text-sm text-slate-400">
          For more detail on what data each provider sees, read our{" "}
          <a href="/privacy" className="underline text-teal-300">Privacy Policy</a>. Want to integrate with GENESIS or
          suggest a threat feed? <a href="mailto:contact@bhusoft.com" className="underline text-teal-300">contact@bhusoft.com</a>.
        </p>
      </section>
    </div>
  );
}
