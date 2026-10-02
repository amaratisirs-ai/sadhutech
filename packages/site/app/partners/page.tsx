import { Genesis } from "@/components/Genesis";

export const metadata = {
  title: "Integrations & Partners — GENESIS",
  description: "Wallets, dApps, and security partners integrating GENESIS's pre-sign transaction firewall.",
};

function Partner({ name, href }: { name: string; href?: string }) {
  const content = (
    <span className="font-semibold text-[#152626] transition-colors group-hover:text-[#08776D]">{name}</span>
  );
  return (
    <div className="group flex items-center border-b border-[#B8C8C3] px-1 py-4">
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
    <div className="-mx-4 bg-[#F3F5F2] px-5 py-10 text-[#152626] sm:-mx-6 sm:px-8 sm:py-16 lg:-mx-8">
      <div className="mx-auto max-w-3xl space-y-10">
      <header className="space-y-3 border-b border-[#B8C8C3] pb-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#A65B3D]">Directory / GENESIS</p>
        <h1 className="text-4xl font-black">Integrations &amp; Partners</h1>
        <p className="text-sm text-[#465D5A]">
          <Genesis /> is built on top of a small set of trusted data and infrastructure providers. Here's who they are
          and what each one does for you.
        </p>
      </header>

      <div className="border-l-2 border-[#A65B3D] pl-4 text-sm text-[#465D5A]">
        Company names and marks below belong to their respective owners. Listing a provider here describes a
        technical integration used to run <Genesis /> &mdash; it is not a paid endorsement, sponsorship, or formal
        business partnership unless stated otherwise.
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Risk &amp; threat intelligence</h2>
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
        <h2 className="text-xl font-bold">Wallet connectivity</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <Partner name="Reown (formerly WalletConnect)" href="https://reown.com" />
          <Partner name="MetaMask" href="https://metamask.io" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Infrastructure</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <Partner name="Neon" href="https://neon.tech" />
          <Partner name="Render" href="https://render.com" />
          <Partner name="Vercel" href="https://vercel.com" />
          <Partner name="Tenderly" href="https://tenderly.co" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Trust &amp; delivery</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <Partner name="Cloudflare Turnstile" href="https://www.cloudflare.com/products/turnstile/" />
          <Partner name="Resend" href="https://resend.com" />
        </div>
      </section>

      <section className="space-y-2 border-t border-[#B8C8C3] pt-6">
        <h2 className="text-xl font-bold">Questions</h2>
        <p className="text-sm text-[#465D5A]">
          For more detail on what data each provider sees, read our{" "}
          <a href="/privacy" className="text-[#08776D] underline">Privacy Policy</a>. Want to integrate with GENESIS or
          suggest a threat feed? <a href="mailto:security@sadhutech.com" className="text-[#08776D] underline">security@sadhutech.com</a>.
        </p>
      </section>
      </div>
    </div>
  );
}
