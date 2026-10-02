import { Icon } from "@/components/Icon";
import { Genesis, withGenesisStyle } from "@/components/Genesis";
import type { ReactNode } from "react";

export const metadata = {
  title: "Products — sadhutech",
  description: "GENESIS's transaction firewall products — browser extension, MetaMask Snap, and API — for pre-sign crypto transaction risk checks.",
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
    <div className="space-y-4 border-t border-[#B8C8C3] bg-[#FFFFFF] p-6 transition-colors hover:border-[#08776D]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center border-l-2 border-[#08776D] pl-2 text-[#08776D]">
          {icon}
        </div>
        <span className={`text-xs font-bold uppercase tracking-wide ${statusColor}`}>{status}</span>
      </div>
      <h3 className="text-xl font-bold text-[#152626]">{withGenesisStyle(name)}</h3>
      <p className="text-sm text-[#465D5A]">{withGenesisStyle(desc)}</p>
      <a href={href} className="inline-block text-sm font-bold text-[#08776D] hover:underline">
        {cta} →
      </a>
    </div>
  );
}

function FutureCard({ icon, name, desc }: { icon: ReactNode; name: string; desc: string }) {
  return (
    <div className="space-y-3 border-t border-dashed border-[#B8C8C3] p-6">
      <div className="flex h-10 w-10 items-center justify-center text-[#667A76]">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-[#152626]">{name}</h3>
      <p className="text-sm text-[#465D5A]">{desc}</p>
      <span className="inline-block text-xs font-bold uppercase tracking-wide text-[#667A76]">Planned  -  not started</span>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <div className="-mx-4 space-y-14 bg-[#F3F5F2] px-5 py-10 text-[#152626] sm:-mx-6 sm:px-8 sm:py-16 lg:-mx-8">
      <header className="mx-auto max-w-5xl space-y-4 border-b border-[#B8C8C3] pb-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#A65B3D]">Products / sadhutech</p>
        <h1 className="max-w-4xl text-4xl font-black sm:text-5xl">One platform, a growing family of protection</h1>
        <p className="max-w-3xl text-lg text-[#465D5A]">
          sadhutech builds security products for the moments you're most exposed. <strong className="text-[#152626]"><Genesis /></strong>,
          our crypto transaction firewall, is live today. Everything else below is where we're headed next.
        </p>
      </header>

      <section className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#08776D]">Live today</p>
          <h2 className="mt-2 text-3xl font-black"><Genesis />  -  for crypto</h2>
          <p className="mt-2 max-w-2xl text-[#465D5A]">
            <Genesis /> isn't one single thing  -  it's three ways to get the same community-verified verdict before you sign.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ProductCard
            icon={<Icon name="search" className="w-6 h-6" />}
            name="GENESIS Check"
            status="Live · Free + Pro"
            statusColor="text-[#08776D]"
            desc="Paste any address or transaction at /check and get a plain-English verdict in seconds. Free forever; Pro adds deeper checks per credit."
            href="/check"
            cta="Check a transaction"
          />
          <ProductCard
            icon={<Icon name="shieldAlert" className="w-6 h-6" />}
            name="GENESIS Extension"
            status="Live · Any wallet"
            statusColor="text-[#08776D]"
            desc="Install it once and any site that asks your wallet to sign something gets screened first - works with MetaMask, Trust Wallet, Coinbase Wallet, and other popular wallets. Available today as a manual install while it goes through browser store review."
            href="/extension"
            cta="Get the Extension"
          />
          <ProductCard
            icon={<Icon name="wallet" className="w-6 h-6" />}
            name="GENESIS Wallet Guard"
            status="Roadmap"
            statusColor="text-[#996516]"
            desc="The broader vision: automatic, real-time protection built into any wallet or browser. GENESIS Extension is the first concrete step toward it."
            href="/whitepaper"
            cta="See the vision"
          />
        </div>

        <div className="overflow-x-auto border-t border-[#B8C8C3] py-6">
          <p className="mb-1 text-sm font-bold">What each surface can actually see</p>
          <p className="mb-4 text-sm text-[#465D5A]">
            Any browser extension can only screen transactions a <em>website</em> asks your wallet to sign - it can't
            reach into another extension's own sandboxed UI, like a wallet's built-in swap/send screens.
          </p>
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#B8C8C3] text-[#667A76]">
                <th className="py-2 pr-4 font-semibold"> </th>
                <th className="py-2 pr-4 font-semibold">Dapp-initiated transactions</th>
                <th className="py-2 font-semibold">Wallet's own native swap/send</th>
              </tr>
            </thead>
            <tbody className="text-[#465D5A]">
              <tr>
                <td className="py-2 pr-4 font-semibold text-[#152626]">GENESIS Extension (any wallet)</td>
                <td className="py-2 pr-4 font-semibold text-[#08776D]">Protected</td>
                <td className="py-2 text-[#667A76]">Not visible - can't intercept</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="space-y-3 border-l-2 border-[#A65B3D] bg-[#E1E9E5] p-6">
          <p className="text-sm font-bold">What GENESIS protects - and what it can't</p>
          <p className="text-sm text-[#465D5A]">
            <strong className="text-[#152626]">Protected:</strong> anything your own self-custody wallet
            (MetaMask, Trust Wallet, Coinbase Wallet, etc.) is asked to sign by a website - a DeFi swap, an
            NFT purchase, connecting to a new dapp. This works the same way no matter which token or chain
            is involved, because it's about <em>how</em> the transaction is created, not what it moves.
          </p>
          <p className="text-sm text-[#465D5A]">
            <strong className="text-[#152626]">Not protected:</strong> transfers from a custodial exchange app
            (Robinhood, Coinbase's exchange, Binance, Kraken, etc.). Those platforms hold your funds and send
            them from their own backend - there's no wallet-signing step in your browser for anything to
            screen. Same for non-EVM chains like Bitcoin or Dogecoin, and a wallet's own built-in swap/send
            screens (see the table above).
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#A65B3D]">What's next</p>
          <h2 className="mt-2 text-3xl font-black">Beyond crypto</h2>
          <p className="mt-2 max-w-2xl text-[#465D5A]">
            The same pre-sign, pre-click philosophy applies anywhere you're one wrong action from a bad day. These are
            early roadmap items, not funded or scheduled yet  -  see <a href="/whitepaper" className="text-[#08776D] hover:underline">Vision &amp; Roadmap</a> for the full thinking.
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

      <section className="space-y-3 border-t border-[#B8C8C3] py-8">
        <h2 className="text-2xl font-bold">Built by sadhutech</h2>
        <p className="max-w-xl text-[#465D5A]">
          <Genesis /> is sadhutech's first product. As new protection surfaces ship, they'll show up here first.
        </p>
        <a href="/whitepaper" className="mt-2 inline-block rounded-md bg-[#08776D] px-6 py-3 font-bold text-[#FFFFFF] transition-colors hover:bg-[#0B625B]">
          Read the full vision
        </a>
      </section>
    </div>
  );
}
