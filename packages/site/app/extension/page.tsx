"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Genesis } from "@/components/Genesis";

const DOWNLOAD_URL = "/downloads/genesis-extension.zip";

export default function ExtensionPage() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="max-w-3xl mx-auto space-y-10 py-12">
      <div className="text-center space-y-4">
        <div className="flex justify-center text-teal-400"><Icon name="shield" className="w-12 h-12" /></div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          <Genesis /> Browser Extension
        </h1>
        <p className="text-slate-300 max-w-xl mx-auto">
          Screens every transaction and signature request before you sign - works with any
          wallet (MetaMask, Trust Wallet, Coinbase Wallet, Rabby, and more), on any site.
        </p>
        <a
          href={DOWNLOAD_URL}
          download
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 transition"
        >
          <Icon name="arrowRight" className="w-5 h-5" />
          Download for Chrome
        </a>
        <p className="text-xs text-slate-500">
          Not yet on the Chrome Web Store - install the downloaded file directly (takes about a minute).
        </p>
      </div>

      <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">How to install</h2>
        <ol className="list-decimal list-inside space-y-2 text-slate-300 text-sm">
          <li>Download the zip file above, then unzip it (double-click it on Mac, or right-click → Extract on Windows).</li>
          <li>Open <code className="text-teal-300 bg-slate-800 px-1.5 py-0.5 rounded">chrome://extensions</code> in Chrome.</li>
          <li>Turn on <strong className="text-white">Developer mode</strong> (top-right toggle).</li>
          <li>Click <strong className="text-white">Load unpacked</strong> and select the unzipped folder.</li>
          <li><Genesis /> is now active - it'll pop up a warning before any risky transaction or signature.</li>
        </ol>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs font-semibold text-teal-300 hover:text-white hover:underline"
        >
          {expanded ? "Hide details" : "Works in other Chromium browsers too (Brave, Edge) →"}
        </button>
        {expanded && (
          <p className="text-xs text-slate-400">
            Any Chromium-based browser supports "Load unpacked" the same way - just open its
            equivalent extensions page (e.g. <code className="text-teal-300">brave://extensions</code> or{" "}
            <code className="text-teal-300">edge://extensions</code>) and follow the same steps.
          </p>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-2">
          <Icon name="bolt" className="w-6 h-6 text-teal-400" />
          <h3 className="font-bold text-white text-sm">Instant Analysis</h3>
          <p className="text-xs text-slate-400">Under 200ms verdict before you ever sign.</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-2">
          <Icon name="globe" className="w-6 h-6 text-teal-400" />
          <h3 className="font-bold text-white text-sm">Works Everywhere</h3>
          <p className="text-xs text-slate-400">Any wallet, any dapp - not locked to one wallet.</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-2">
          <Icon name="lock" className="w-6 h-6 text-teal-400" />
          <h3 className="font-bold text-white text-sm">Non-Custodial</h3>
          <p className="text-xs text-slate-400">Never touches your keys or funds.</p>
        </div>
      </div>

      <p className="text-center text-sm text-slate-400">
        Prefer the free web checker instead? Try <a href="/check" className="text-teal-300 hover:underline">GENESIS Check</a>.
      </p>
    </div>
  );
}
