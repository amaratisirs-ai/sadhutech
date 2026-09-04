export const metadata = {
  title: "Terms of Service — GENESIS",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8 text-slate-200">
      <div className="rounded-xl border-2 border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
        <strong>Draft — pending attorney review.</strong> This page describes how GENESIS actually works today, in
        plain language, but it has not yet been reviewed by a lawyer and is not a final, binding legal document.
        Do not rely on it as legal advice; contact <a href="mailto:contact@bhusoft.com" className="underline">contact@bhusoft.com</a> with questions.
      </div>

      <header className="space-y-2">
        <h1 className="text-3xl font-black text-white">Terms of Service</h1>
        <p className="text-sm text-slate-400">Last updated: September 2026</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">1. What GENESIS is</h2>
        <p>
          GENESIS ("we", "us") is a pre-sign transaction and signature analysis tool (the "Service"), offered as a
          website (sadhutech.com), a MetaMask Snap, and an HTTP API. The Service decodes a transaction or signature
          request, checks it against community-reported and third-party threat intelligence, and returns a verdict
          (allow / warn / block) with a plain-English explanation.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">2. No custody, no financial advice</h2>
        <p>
          GENESIS never holds, controls, or has access to your private keys or funds. Nothing GENESIS shows you is
          financial, investment, or legal advice. A verdict of "allow" is not a guarantee that a transaction is safe,
          and a verdict of "warn" or "block" is not a guarantee that it is unsafe — it reflects the information
          available to GENESIS at the time of the check, which is necessarily incomplete. You are solely responsible
          for deciding whether to sign any transaction or message.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">3. No guarantee, limitation of liability</h2>
        <p>
          The Service is provided "as is" and "as available," without warranties of any kind. To the maximum extent
          permitted by law, GENESIS and Bhusoft LLC are not liable for any loss of funds, data, or other damages
          arising from your use of, or inability to use, the Service — including losses that occur despite (or
          because of) a verdict GENESIS produced.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">4. Community threat reports</h2>
        <p>
          Some threat data comes from community-submitted reports (see <a href="/report" className="underline text-teal-300">/report</a>).
          Reports are user submissions, not independently verified facts. GENESIS uses a quorum system (multiple
          independent reporters) before treating a report as confirmed, but disclaims responsibility for the accuracy
          of any individual report, confirmed or not. If you believe a report about an address you control is
          inaccurate, contact us to dispute it.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">5. Paid deep checks ("Pro")</h2>
        <p>
          GENESIS offers optional, pay-as-you-go "deep checks" paid in USDC on Base, credited to the paying wallet
          address. Payments are irreversible on-chain transactions; we do not hold custody of funds and cannot
          process refunds for on-chain payments. Credits do not expire but are not transferable between wallets. We
          may change pricing or discontinue the deep-check feature at any time with notice on this page.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">6. Third-party services</h2>
        <p>
          The Service relies on third-party data and infrastructure providers, including GoPlus Security, ChainAbuse
          (TRM Labs), Blockaid, Reown/WalletConnect, Cloudflare Turnstile, Resend, and Neon (PostgreSQL hosting).
          Your use of the Service is also subject to those providers' own terms where applicable. See the full list
          on our <a href="/partners" className="underline text-teal-300">Integrations &amp; Partners</a> page.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">7. Changes</h2>
        <p>
          We may update these Terms from time to time. Continued use of the Service after a change constitutes
          acceptance of the updated Terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">8. Contact</h2>
        <p>
          Questions about these Terms: <a href="mailto:contact@bhusoft.com" className="underline text-teal-300">contact@bhusoft.com</a>.
          See also our <a href="/privacy" className="underline text-teal-300">Privacy Policy</a>.
        </p>
      </section>
    </div>
  );
}
