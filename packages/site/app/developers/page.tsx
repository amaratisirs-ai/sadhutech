import { Icon } from "@/components/Icon";
import { DeveloperTryIt } from "@/components/DeveloperTryIt";
import { Genesis } from "@/components/Genesis";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developers — GENESIS",
  description: "Integrate GENESIS's /v1/analyze API to screen crypto transactions for drainer patterns and risky approvals before they're signed.",
};

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
    <div className="-mx-4 space-y-14 bg-[#F3F5F2] px-5 py-10 text-[#152626] sm:-mx-6 sm:px-8 sm:py-16 lg:-mx-8">
      <div className="mx-auto max-w-5xl space-y-14">
      <header className="max-w-3xl space-y-5">
        <div className="flex items-center gap-3 text-[#A65B3D]">
          <Icon name="code" className="w-8 h-8" />
          <span className="text-sm font-bold uppercase tracking-[0.2em]">Developer access</span>
        </div>
        <h1 className="text-4xl font-black sm:text-5xl">Build transaction safety into your product.</h1>
        <p className="text-lg leading-relaxed text-[#465D5A]">
          Send a transaction to the <Genesis /> Gate API and receive a clear risk verdict before a wallet or application asks a user to sign.
          Use it in wallets, dapps, dashboards, and internal review tools.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <a href="#try-it" className="inline-flex items-center gap-2 rounded-md bg-[#08776D] px-5 py-3 font-bold text-[#FFFFFF] transition-colors hover:bg-[#0B625B]">
            <Icon name="code" className="w-5 h-5" /> Try a request
          </a>
          <a href="/check" className="inline-flex items-center gap-2 rounded-md border border-[#152626] px-5 py-3 font-bold text-[#152626] transition-colors hover:bg-[#E1E9E5]">
            <Icon name="search" className="w-5 h-5" /> Test without code
          </a>
        </div>
      </header>

      <section className="grid gap-5 border-y border-[#B8C8C3] py-6 md:grid-cols-3">
        <div className="space-y-2 border-l-2 border-[#08776D] pl-4">
          <Icon name="bolt" className="h-6 w-6 text-[#08776D]" />
          <h2 className="font-bold">One endpoint</h2>
          <p className="text-sm text-[#465D5A]">POST a transaction to receive the same verdict used by the <Genesis /> interface.</p>
        </div>
        <div className="space-y-2 border-l-2 border-[#08776D] pl-4">
          <Icon name="shield" className="h-6 w-6 text-[#08776D]" />
          <h2 className="font-bold">Plain-English output</h2>
          <p className="text-sm text-[#465D5A]">Give users a reason they can understand, alongside structured findings for your UI.</p>
        </div>
        <div className="space-y-2 border-l-2 border-[#08776D] pl-4">
          <Icon name="chart" className="h-6 w-6 text-[#08776D]" />
          <h2 className="font-bold">Stable decisions</h2>
          <p className="text-sm text-[#465D5A]">Use the allow, warn, or block verdict to drive your product&apos;s signing workflow.</p>
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#A65B3D]">Quick start</p>
          <h2 className="mt-2 text-3xl font-black">Analyze a transaction</h2>
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

      <section className="space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#A65B3D]">Playground</p>
          <h2 className="mt-2 text-3xl font-black">Send a real request, right here</h2>
          <p className="mt-2 text-[#465D5A]">Pick a scenario or edit the JSON, then hit send. This calls the live <Genesis /> Gate API  -  no signup, no API key needed for the free tier.</p>
        </div>
        <DeveloperTryIt />
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4 border-t border-[#B8C8C3] pt-6">
          <div className="flex items-center gap-3">
            <Icon name="document" className="h-6 w-6 text-[#08776D]" />
            <h2 className="text-xl font-bold">Transaction shape</h2>
          </div>
          <dl className="space-y-3 text-sm">
            <div><dt className="font-mono text-[#08776D]">chainId</dt><dd className="text-[#465D5A]">EIP-155 network number, such as 1 for Ethereum.</dd></div>
            <div><dt className="font-mono text-[#08776D]">from</dt><dd className="text-[#465D5A]">The wallet address that will sign the transaction.</dd></div>
            <div><dt className="font-mono text-[#08776D]">to</dt><dd className="text-[#465D5A]">The contract or recipient address.</dd></div>
            <div><dt className="font-mono text-[#08776D]">data</dt><dd className="text-[#465D5A]">Encoded calldata, including the method and arguments.</dd></div>
            <div><dt className="font-mono text-[#08776D]">value</dt><dd className="text-[#465D5A]">Optional native token amount in wei as a decimal string.</dd></div>
          </dl>
        </div>
        <div className="space-y-4 border-t border-[#B8C8C3] pt-6">
          <div className="flex items-center gap-3">
            <Icon name="shield" className="h-6 w-6 text-[#08776D]" />
            <h2 className="text-xl font-bold">Handling the verdict</h2>
          </div>
          <div className="space-y-4 text-sm text-[#465D5A]">
            <p><strong className="text-[#08776D]">ALLOW</strong> means no known risk was detected. Let the user continue, while keeping normal wallet safeguards.</p>
            <p><strong className="text-[#996516]">WARN</strong> means the user should review the findings before signing. Keep the decision visible.</p>
            <p><strong className="text-[#A63937]">BLOCK</strong> means the transaction matches a high-confidence danger signal. Require an explicit override or stop it.</p>
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t border-[#B8C8C3] pt-6">
        <h2 className="text-xl font-bold">Useful links</h2>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
          <a href="#try-it" className="text-[#08776D] hover:underline">Jump to the live API tester</a>
          <a href="/check" className="text-[#08776D] hover:underline">User-facing checker</a>
          <a href="https://github.com/amaratisirs-ai/sadhutech" className="text-[#08776D] hover:underline">Source on GitHub</a>
          <a href="mailto:security@sadhutech.com" className="text-[#08776D] hover:underline">Contact support</a>
        </div>
      </section>
      </div>
    </div>
  );
}
