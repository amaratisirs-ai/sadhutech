export const metadata = {
  title: "Privacy Policy — GENESIS",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8 text-slate-200">
      <div className="rounded-xl border-2 border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
        <strong>Draft — pending attorney review.</strong> This page describes what GENESIS actually collects and why,
        in plain language, but it has not yet been reviewed by a lawyer and is not a final, binding legal document.
        Do not rely on it for GDPR/CCPA compliance sign-off without legal review; contact{" "}
        <a href="mailto:contact@bhusoft.com" className="underline">contact@bhusoft.com</a> with questions.
      </div>

      <header className="space-y-2">
        <h1 className="text-3xl font-black text-white">Privacy Policy</h1>
        <p className="text-sm text-slate-400">Last updated: September 2026</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">1. What we collect</h2>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Wallet addresses</strong> — when you check a transaction, connect a wallet, buy deep-check credits, or submit a threat report. Addresses are pseudonymous, public on-chain data.</li>
          <li><strong>Payment data</strong> — when you buy Pro credits, we record the paying wallet address, amount, and on-chain transaction hash (itself public on Base) to credit your balance and for the audit log described in Section 4. We do not collect card numbers, bank details, or run identity/KYC verification today.</li>
          <li><strong>Email address</strong> — only if you submit a threat report at <a href="/report" className="underline text-teal-300">/report</a>, to send a one-time confirmation link (Sybil-resistance). We store a one-way hash of your email as your reporter identity, not the raw address, once the report is confirmed.</li>
          <li><strong>Transaction/signature data you submit</strong> — to analyze it. This is processed to produce a verdict and is not sold or used for advertising.</li>
          <li><strong>Consent records</strong> — when you connect a wallet, install the Snap, or authorize the Snap's deep checks, we log that a specific address (where available) accepted a specific version of these Terms/this Policy, so we can demonstrate consent was given.</li>
          <li><strong>Basic request metadata</strong> (IP address, timestamps) for rate-limiting and abuse prevention, and for our security/audit logs (see below).</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">2. What we don't collect</h2>
        <p>
          We never see or request your private keys, seed phrase, or wallet password. We do not track your browsing
          activity outside GENESIS, and we do not sell personal data to third parties.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">3. Third-party processors</h2>
        <p>Data may pass through the following providers as part of running the Service. We don't control these providers and are not responsible for their independent handling of your data beyond what's described here; see our <a href="/partners" className="underline text-teal-300">Integrations &amp; Partners</a> page for what each one does.</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Resend</strong> — sends the report-confirmation email (sees your email address).</li>
          <li><strong>Cloudflare Turnstile</strong> — bot-check on the report form.</li>
          <li><strong>GoPlus Security, ChainAbuse (TRM Labs), Blockaid</strong> — receive addresses/origins you check, to look up threat intelligence. These providers, and we, may compare addresses against public sanctions and law-enforcement watchlists as part of that lookup.</li>
          <li><strong>Reown/WalletConnect</strong> — powers the "Connect wallet" flow.</li>
          <li><strong>Neon (PostgreSQL)</strong> — hosts our database (threat intel, credit balances, audit logs).</li>
          <li><strong>Render, Vercel</strong> — host our backend and website.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">4. Audit &amp; security logs</h2>
        <p>
          We keep internal records of deep-check credit spending, security-relevant flags (e.g. a known-malicious
          address or phishing site detected), and integration failures, to operate the Service reliably and
          investigate abuse. These logs are keyed by wallet address, not by real-world identity.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">5. Retention</h2>
        <p>
          We retain the data above for as long as needed to operate the Service (e.g. credit balances persist until
          spent; audit logs are retained for security investigation purposes). We have not yet finalized a formal
          deletion schedule — see the draft notice above.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">6. Your rights</h2>
        <p>
          Depending on where you live, you may have rights to access, correct, or delete personal data we hold about
          you (e.g. under GDPR or CCPA). Contact <a href="mailto:contact@bhusoft.com" className="underline text-teal-300">contact@bhusoft.com</a> to
          make a request.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">7. Changes</h2>
        <p>We may update this Privacy Policy from time to time. Material changes will be noted on this page.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">8. Contact</h2>
        <p>
          <a href="mailto:contact@bhusoft.com" className="underline text-teal-300">contact@bhusoft.com</a>. See
          also our <a href="/terms" className="underline text-teal-300">Terms of Service</a>.
        </p>
      </section>
    </div>
  );
}
