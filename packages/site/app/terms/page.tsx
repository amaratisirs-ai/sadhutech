import { Genesis } from "@/components/Genesis";

export const metadata = {
  title: "Terms of Service — GENESIS",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8 text-slate-200">
      <div className="rounded-xl border-2 border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
        <strong>Draft — pending attorney review.</strong> This page describes how <Genesis /> actually works today, in
        plain language, but it has not yet been reviewed by a lawyer and is not a final, binding legal document.
        Do not rely on it as legal advice; contact <a href="mailto:security@sadhutech.com" className="underline">security@sadhutech.com</a> with questions.
      </div>

      <header className="space-y-2">
        <h1 className="text-3xl font-black text-white">Terms of Service</h1>
        <p className="text-sm text-slate-400">Last updated: September 2026</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">1. What <Genesis /> is</h2>
        <p>
          <Genesis /> ("we", "us", operated by Bhusoft LLC) is a pre-sign transaction and signature analysis tool (the
          "Service"), offered as a website (sadhutech.com), a MetaMask Snap, and an HTTP API. The Service decodes a
          transaction or signature request, checks it against community-reported and third-party threat
          intelligence, and returns a verdict (allow / warn / block) with a plain-English explanation. By visiting
          the website, connecting a wallet, installing the Snap, or calling the API, you agree to these Terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">2. No custody, no financial advice</h2>
        <p>
          <Genesis /> never holds, controls, or has access to your private keys, seed phrase, or funds, and we will
          never ask you for them. Nothing <Genesis /> shows you is financial, investment, tax, or legal advice, and no
          verdict is a recommendation to buy, sell, or hold any asset. A verdict of "allow" is not a guarantee that
          a transaction is safe, and a verdict of "warn" or "block" is not a guarantee that it is unsafe — every
          verdict reflects the information available to <Genesis /> at the time of the check, which is necessarily
          incomplete, and heuristic/third-party detections can produce both false positives and false negatives.
          You alone are responsible for reviewing and deciding whether to sign any transaction or message, and for
          the security of your own wallet, device, and recovery phrase — including securing them against
          unauthorized access by anyone else.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">3. Your responsibilities</h2>
        <p>You agree that you will not use the Service to:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>violate any applicable law or regulation, or facilitate anyone else doing so;</li>
          <li>submit false threat reports, attempt to manipulate the quorum system, or otherwise abuse community reporting;</li>
          <li>probe, scan, or attempt to disrupt the Service's infrastructure, or circumvent rate limits or credit checks; or</li>
          <li>launder money, finance terrorism, or otherwise evade sanctions, anti-money-laundering, or export-control laws.</li>
        </ul>
        <p>
          You are responsible for all activity that occurs through your wallet address or API key, whether or not
          you personally authorized it, except to the extent it results from our own breach of these Terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">4. Assumption of risk</h2>
        <p>
          The Service depends on blockchains, smart contracts, and third-party data sources — technologies that are
          inherently outside our control. By using the Service, you acknowledge that: threat intelligence and
          heuristic scoring can be incomplete, delayed, or wrong; blockchain transactions you sign elsewhere are
          irreversible and we cannot recover funds sent as a result of your own decision, a phishing link, or a
          compromised wallet; third-party integrations (see Section 7) may be unavailable, rate-limited, or return
          incorrect data; and network congestion, gas prices, and protocol behavior are not controlled by us. We are
          not responsible for losses arising from any of the above.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">5. Community threat reports</h2>
        <p>
          Some threat data comes from community-submitted reports (see <a href="/report" className="underline text-teal-300">/report</a>).
          Reports are user submissions, not independently verified facts. <Genesis /> uses a quorum system (multiple
          independent reporters) before treating a report as confirmed, but disclaims responsibility for the accuracy
          of any individual report, confirmed or not. If you believe a report about an address you control is
          inaccurate, contact us to dispute it.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">6. Paid deep checks ("Pro")</h2>
        <p>
          <Genesis /> offers optional, pay-as-you-go "deep checks" paid in USDC on Base, credited to the paying wallet
          address.
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Irreversible, final, non-refundable.</strong> Payments are on-chain transactions; we do not hold custody of funds in transit and cannot reverse, cancel, or refund an on-chain payment once broadcast, except where required by applicable law. You are solely responsible for verifying the destination address and network before sending.</li>
          <li><strong>Network (gas) fees.</strong> Any blockchain network fee required to send a payment is separate from our pricing, is not collected by us, and is outside our control.</li>
          <li><strong>Credits.</strong> Credits have no cash value, cannot be redeemed for fiat currency, do not expire, and are not transferable between wallets.</li>
          <li><strong>No identity verification (yet).</strong> We do not currently perform KYC/identity verification on Pro purchases; we may introduce basic verification in the future to prevent abuse or comply with law, with notice on this page.</li>
          <li>We may change pricing or discontinue the deep-check feature at any time with notice on this page.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">7. Third-party services</h2>
        <p>
          The Service relies on third-party data and infrastructure providers, including GoPlus Security, ChainAbuse
          (TRM Labs), Blockaid, Reown/WalletConnect, Cloudflare Turnstile, Resend, and Neon (PostgreSQL hosting) —
          see the full list on our <a href="/partners" className="underline text-teal-300">Integrations &amp; Partners</a> page.
          We do not control, and are not responsible for the accuracy, availability, or actions of, any third-party
          provider. Your use of the Service is also subject to those providers' own terms where applicable, and any
          dealings with a third party (including a wallet, dApp, or marketplace you interact with) are solely
          between you and that party.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">8. Sanctions and eligibility</h2>
        <p>
          You may not use the Service if you are subject to sanctions administered by the U.S. Office of Foreign
          Assets Control (OFAC), the United Nations, the European Union, the United Kingdom, or another applicable
          authority, or if you are located in a comprehensively sanctioned jurisdiction. You must be of legal age in
          your jurisdiction to use the Service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">9. No guarantee, limitation of liability</h2>
        <p>
          The Service is provided "as is" and "as available," without warranties of any kind, express or implied. To
          the maximum extent permitted by law, <Genesis /> and Bhusoft LLC are not liable for any indirect, incidental,
          or consequential damages, or any loss of funds, data, or profits, arising from your use of, or inability
          to use, the Service — including losses that occur despite (or because of) a verdict <Genesis /> produced. To
          the extent any liability cannot be excluded, our aggregate liability for any claim will not exceed the
          total amount you paid us for the Service in the three months preceding the claim, or $100 if you have not
          paid us anything, whichever is greater. (This cap, and the governing law/dispute-resolution process for
          any claim, is still being finalized with counsel — see the draft notice above.)
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">10. Term and termination</h2>
        <p>
          These Terms apply for as long as you use the Service. We may suspend or terminate access to the Service,
          for you individually or generally, at any time — for example if we reasonably believe you've violated
          Section 3 or 8 — with or without notice. You may stop using the Service at any time; unused Pro credits
          are not refunded on termination (see Section 6).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">11. Changes</h2>
        <p>
          We may update these Terms from time to time. Continued use of the Service after a change constitutes
          acceptance of the updated Terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">12. Contact</h2>
        <p>
          Questions about these Terms: <a href="mailto:security@sadhutech.com" className="underline text-teal-300">security@sadhutech.com</a>.
          See also our <a href="/privacy" className="underline text-teal-300">Privacy Policy</a>.
        </p>
      </section>
    </div>
  );
}

