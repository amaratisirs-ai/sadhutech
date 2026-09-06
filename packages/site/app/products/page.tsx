import { Icon } from "@/components/Icon";
import { Genesis, withGenesisStyle } from "@/components/Genesis";
import type { ReactNode } from "react";

export const metadata = {
  title: "Products — sadhutech",
};

function ProductCard({
  icon,
  name,
  status,
  statusColor,
  desc,
  href,
  cta,
}: {
  icon: ReactNode;
  name: string;
  status: string;
  statusColor: string;
  desc: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-700 p-6 space-y-4 hover:border-teal-400 hover:shadow-lg hover:shadow-teal-500/10 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="w-12 h-12 bg-slate-800 border border-slate-600 rounded-xl flex items-center justify-center text-teal-400">
          {icon}
        </div>
        <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${statusColor}`}>{status}</span>
      </div>
      <h3 className="text-xl font-bold text-white">{withGenesisStyle(name)}</h3>
      <p className="text-sm text-slate-300">{withGenesisStyle(desc)}</p>
      <a href={href} className="inline-block text-sm font-bold text-teal-300 hover:text-white hover:underline">
        {cta} →
      </a>
    </div>
  );
}

function FutureCard({ icon, name, desc }: { icon: ReactNode; name: string; desc: string }) {
  return (
    <div className="bg-slate-900/50 rounded-2xl border border-dashed border-slate-700 p-6 space-y-3">
      <div className="w-12 h-12 bg-slate-800/60 border border-slate-700 rounded-xl flex items-center justify-center text-slate-400">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-200">{name}</h3>
      <p className="text-sm text-slate-400">{desc}</p>
      <span className="inline-block text-xs font-bold uppercase tracking-wide text-slate-500">Planned  -  not started</span>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <div className="space-y-16">
      <header className="text-center space-y-4 max-w-2xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">sadhutech</p>
        <h1 className="text-4xl md:text-5xl font-black text-white">One platform, a growing family of protection</h1>
        <p className="text-lg text-slate-300">
          sadhutech builds security products for the moments you're most exposed. <strong className="text-white"><Genesis /></strong>,
          our crypto transaction firewall, is live today. Everything else below is where we're headed next.
        </p>
      </header>

      <section className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Live today</p>
          <h2 className="text-3xl font-black text-white mt-2"><Genesis />  -  for crypto</h2>
          <p className="text-slate-400 mt-2 max-w-2xl">
            <Genesis /> isn't one single thing  -  it's three ways to get the same community-verified verdict before you sign.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ProductCard
            icon={<Icon name="search" className="w-6 h-6" />}
            name="GENESIS Check"
            status="Live · Free + Pro"
            statusColor="bg-emerald-500/15 text-emerald-300"
            desc="Paste any address or transaction at /check and get a plain-English verdict in seconds. Free forever; Pro adds deeper checks per credit."
            href="/check"
            cta="Check a transaction"
          />
          <ProductCard
            icon={<Icon name="shieldAlert" className="w-6 h-6" />}
            name="GENESIS Extension"
            status="Live · Any wallet"
            statusColor="bg-emerald-500/15 text-emerald-300"
            desc="Install it once and any site that asks your wallet to sign something gets screened first - works with MetaMask, Trust Wallet, Coinbase Wallet, and other popular wallets. Available today as a manual install while it goes through browser store review."
            href="/extension"
            cta="Get the Extension"
          />
          <ProductCard
            icon={<Icon name="wallet" className="w-6 h-6" />}
            name="GENESIS Wallet Guard"
            status="Roadmap"
            statusColor="bg-amber-500/15 text-amber-300"
            desc="The broader vision: automatic, real-time protection built into any wallet or browser. GENESIS Extension is the first concrete step toward it."
            href="/whitepaper"
            cta="See the vision"
          />
        </div>

        <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-6 overflow-x-auto">
          <p className="text-sm font-bold text-white mb-1">What each surface can actually see</p>
          <p className="text-sm text-slate-400 mb-4">
            Any browser extension can only screen transactions a <em>website</em> asks your wallet to sign - it can't
            reach into another extension's own sandboxed UI, like a wallet's built-in swap/send screens.
          </p>
          <table className="w-full text-sm text-left min-w-[480px]">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="py-2 pr-4 font-semibold"> </th>
                <th className="py-2 pr-4 font-semibold">Dapp-initiated transactions</th>
                <th className="py-2 font-semibold">Wallet's own native swap/send</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr>
                <td className="py-2 pr-4 font-semibold text-white">GENESIS Extension (any wallet)</td>
                <td className="py-2 pr-4 text-emerald-400">Protected</td>
                <td className="py-2 text-slate-500">Not visible - can't intercept</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-slate-700 rounded-2xl p-6 space-y-3">
          <p className="text-sm font-bold text-white">What GENESIS protects - and what it can't</p>
          <p className="text-sm text-slate-300">
            <strong className="text-white">Protected:</strong> anything your own self-custody wallet
            (MetaMask, Trust Wallet, Coinbase Wallet, etc.) is asked to sign by a website - a DeFi swap, an
            NFT purchase, connecting to a new dapp. This works the same way no matter which token or chain
            is involved, because it's about <em>how</em> the transaction is created, not what it moves.
          </p>
          <p className="text-sm text-slate-300">
            <strong className="text-white">Not protected:</strong> transfers from a custodial exchange app
            (Robinhood, Coinbase's exchange, Binance, Kraken, etc.). Those platforms hold your funds and send
            them from their own backend - there's no wallet-signing step in your browser for anything to
            screen. Same for non-EVM chains like Bitcoin or Dogecoin, and a wallet's own built-in swap/send
            screens (see the table above).
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">What's next</p>
          <h2 className="text-3xl font-black text-white mt-2">Beyond crypto</h2>
          <p className="text-slate-400 mt-2 max-w-2xl">
            The same pre-sign, pre-click philosophy applies anywhere you're one wrong action from a bad day. These are
            early roadmap items, not funded or scheduled yet  -  see <a href="/whitepaper" className="text-teal-300 hover:underline">Vision &amp; Roadmap</a> for the full thinking.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <FutureCard
            icon={<Icon name="devicePhone" className="w-6 h-6" />}
            name="Mobile Device Protection"
            desc="Screening risky links, permissions, and installs on your phone before they cause damage."
          />
          <FutureCard
            icon={<Icon name="monitor" className="w-6 h-6" />}
            name="Laptop Protection"
            desc="The same pre-action firewall model, applied to files, downloads, and scripts on your computer."
          />
          <FutureCard
            icon={<Icon name="cloud" className="w-6 h-6" />}
            name="SaaS Protection"
            desc="Catching risky OAuth grants, integrations, and permission changes across the SaaS apps your team uses."
          />
        </div>
      </section>

      <section className="bg-gradient-to-br from-teal-500/10 to-indigo-500/10 border-2 border-teal-500/30 rounded-2xl p-8 text-center space-y-3">
        <h2 className="text-2xl font-bold text-white">Built by sadhutech</h2>
        <p className="text-slate-300 max-w-xl mx-auto">
          <Genesis /> is sadhutech's first product. As new protection surfaces ship, they'll show up here first.
        </p>
        <a href="/whitepaper" className="inline-block mt-2 px-6 py-3 bg-teal-500 text-slate-950 font-bold rounded-xl hover:bg-teal-400 transition">
          Read the full vision
        </a>
      </section>
    </div>
  );
}
