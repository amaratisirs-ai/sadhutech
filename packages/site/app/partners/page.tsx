import { Genesis } from "@/components/Genesis";

export const metadata = {
  title: "Integrations & Partners — GENESIS",
};

function Partner({ name, href }: { name: string; href?: string }) {
  const content = (
    <span className="font-semibold text-white group-hover:text-teal-300 transition">{name}</span>
  );
  return (
    <div className="group bg-slate-900/50 border border-teal-500/30 rounded-xl px-5 py-4 flex items-center">
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}

export default function PartnersPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-10 py-8 text-slate-200">
      <header className="space-y-2">
        <h1 className="text-3xl font-black text-white">Integrations &amp; Partners</h1>
        <p className="text-sm text-slate-400">
          <Genesis /> is built on top of a small set of trusted data and infrastructure providers. Here's who they are
          and what each one does for you.
        </p>
      </header>

      <div className="rounded-xl border-2 border-slate-700 bg-slate-900/50 p-4 text-sm text-slate-400">
        Company names and marks below belong to their respective owners. Listing a provider here describes a
        technical integration used to run <Genesis /> &mdash; it is not a paid endorsement, sponsorship, or formal
        business partnership unless stated otherwise.
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Risk &amp; threat intelligence</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <Partner name="GoPlus Security" href="https://gopluslabs.io" />
          <Partner name="ChainAbuse (a TRM Labs product)" href="https://www.chainabuse.com" />
          <Partner name="Blockaid" href="https://blockaid.io" />
          <Partner name="Scam Sniffer" href="https://github.com/scamsniffer/scam-database" />
          <Partner name="CryptoScamDB" href="https://github.com/CryptoScamDB/blacklist" />
          <Partner name="Rugdoc" href="https://rugdoc.io" />
          <Partner name="SlowMist" href="https://slowmist.com" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Wallet connectivity</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <Partner name="Reown (formerly WalletConnect)" href="https://reown.com" />
          <Partner name="MetaMask" href="https://metamask.io" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Infrastructure</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <Partner name="Neon" href="https://neon.tech" />
          <Partner name="Render" href="https://render.com" />
          <Partner name="Vercel" href="https://vercel.com" />
          <Partner name="Tenderly" href="https://tenderly.co" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Trust &amp; delivery</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <Partner name="Cloudflare Turnstile" href="https://www.cloudflare.com/products/turnstile/" />
          <Partner name="Resend" href="https://resend.com" />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-white">Questions</h2>
        <p className="text-sm text-slate-400">
          For more detail on what data each provider sees, read our{" "}
          <a href="/privacy" className="underline text-teal-300">Privacy Policy</a>. Want to integrate with GENESIS or
          suggest a threat feed? <a href="mailto:security@sadhutech.com" className="underline text-teal-300">security@sadhutech.com</a>.
        </p>
      </section>
    </div>
  );
}
