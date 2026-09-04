import { Icon } from "@/components/Icon";

const requestExample = `{
  "tx": {
    "chainId": 1,
    "from": "0x1111111111111111111111111111111111111111",
    "to": "0x2222222222222222222222222222222222222222",
    "data": "0x095ea7b3...",
    "value": "0"
  }
}`;

const responseExample = `{
  "verdict": "warn",
  "score": 45,
  "summary": "Unlimited approval detected",
  "plainEnglish": "This transaction grants broad access to your tokens. Review the spender before signing.",
  "findings": [
    {
      "id": "approval.unlimited",
      "severity": "high",
      "title": "Unlimited Token Approval"
    }
  ]
}`;

export default function DevelopersPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-14">
      <header className="max-w-3xl space-y-5">
        <div className="flex items-center gap-3 text-teal-300">
          <Icon name="code" className="w-8 h-8" />
          <span className="text-sm font-bold uppercase tracking-[0.2em]">Developer access</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white">Build transaction safety into your product.</h1>
        <p className="text-lg text-slate-300 leading-relaxed">
          Send a transaction to the GENESIS Gate API and receive a clear risk verdict before a wallet or application asks a user to sign.
          Use it in wallets, dapps, dashboards, and internal review tools.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <a href="/transaction-check" className="inline-flex items-center gap-2 rounded-lg bg-teal-400 px-5 py-3 font-bold text-slate-950 hover:bg-teal-300 transition">
            <Icon name="code" className="w-5 h-5" /> Try a request
          </a>
          <a href="/check" className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-5 py-3 font-bold text-white hover:border-teal-400 transition">
            <Icon name="search" className="w-5 h-5" /> Test without code
          </a>
        </div>
      </header>

      <section className="grid md:grid-cols-3 gap-5">
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-2">
          <Icon name="bolt" className="w-7 h-7 text-teal-400" />
          <h2 className="font-bold text-white">One endpoint</h2>
          <p className="text-sm text-slate-400">POST a transaction to receive the same verdict used by the GENESIS interface.</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-2">
          <Icon name="shield" className="w-7 h-7 text-teal-400" />
          <h2 className="font-bold text-white">Plain-English output</h2>
          <p className="text-sm text-slate-400">Give users a reason they can understand, alongside structured findings for your UI.</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-2">
          <Icon name="chart" className="w-7 h-7 text-teal-400" />
          <h2 className="font-bold text-white">Stable decisions</h2>
          <p className="text-sm text-slate-400">Use the allow, warn, or block verdict to drive your product&apos;s signing workflow.</p>
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Quick start</p>
          <h2 className="text-3xl font-black text-white mt-2">Analyze a transaction</h2>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900 overflow-hidden">
          <div className="border-b border-slate-700 px-5 py-3 text-sm font-bold text-white">Request</div>
          <pre className="overflow-x-auto p-5 text-sm leading-relaxed text-teal-200"><code>{requestExample}</code></pre>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900 overflow-hidden">
          <div className="border-b border-slate-700 px-5 py-3 text-sm font-bold text-white">Response</div>
          <pre className="overflow-x-auto p-5 text-sm leading-relaxed text-emerald-200"><code>{responseExample}</code></pre>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-teal-500/30 bg-teal-950/20 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Icon name="document" className="w-6 h-6 text-teal-300" />
            <h2 className="text-xl font-bold text-white">Transaction shape</h2>
          </div>
          <dl className="space-y-3 text-sm">
            <div><dt className="font-mono text-teal-300">chainId</dt><dd className="text-slate-300">EIP-155 network number, such as 1 for Ethereum.</dd></div>
            <div><dt className="font-mono text-teal-300">from</dt><dd className="text-slate-300">The wallet address that will sign the transaction.</dd></div>
            <div><dt className="font-mono text-teal-300">to</dt><dd className="text-slate-300">The contract or recipient address.</dd></div>
            <div><dt className="font-mono text-teal-300">data</dt><dd className="text-slate-300">Encoded calldata, including the method and arguments.</dd></div>
            <div><dt className="font-mono text-teal-300">value</dt><dd className="text-slate-300">Optional native token amount in wei as a decimal string.</dd></div>
          </dl>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Icon name="shield" className="w-6 h-6 text-teal-300" />
            <h2 className="text-xl font-bold text-white">Handling the verdict</h2>
          </div>
          <div className="space-y-4 text-sm text-slate-300">
            <p><strong className="text-emerald-300">ALLOW</strong> means no known risk was detected. Let the user continue, while keeping normal wallet safeguards.</p>
            <p><strong className="text-amber-300">WARN</strong> means the user should review the findings before signing. Keep the decision visible.</p>
            <p><strong className="text-rose-300">BLOCK</strong> means the transaction matches a high-confidence danger signal. Require an explicit override or stop it.</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-900 p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">Useful links</h2>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
          <a href="/transaction-check" className="text-teal-300 hover:text-white hover:underline">Interactive API request builder</a>
          <a href="/check" className="text-teal-300 hover:text-white hover:underline">User-facing checker</a>
          <a href="https://github.com/amaratisirs-ai/sadhutech" className="text-teal-300 hover:text-white hover:underline">Source on GitHub</a>
          <a href="mailto:contact@bhusoft.com" className="text-teal-300 hover:text-white hover:underline">Contact support</a>
        </div>
      </section>
    </div>
  );
}
