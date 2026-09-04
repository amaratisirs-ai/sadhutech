"use client";

export default function Home() {
  const flowSteps = [
    { 
      icon: (
        <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      label: "You sign a\ntransaction", 
      step: "1" 
    },
    { 
      icon: (
        <svg className="w-12 h-12 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      label: "GENESIS\nanalyzes it", 
      step: "2" 
    },
    { 
      icon: (
        <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: "You get a\nverdict", 
      step: "3" 
    },
  ];

  const faqItems = [
    {
      title: "What's an 'approval'?",
      answer: "When you sign a transaction, you often give it permission to spend your tokens. GENESIS watches for suspicious permissions.",
    },
    {
      title: "Why is this dangerous?",
      answer: "A hacker can use an old permission you gave to another app to drain your wallet without you signing again.",
    },
    {
      title: "How does GENESIS know about threats?",
      answer: "Community members report dangerous addresses and malicious contracts. GENESIS checks if you're about to interact with one of them.",
    },
    {
      title: "What's a 'permit' signature?",
      answer: "A fancier way to give permission that's more secure and doesn't always cost gas.",
    },
  ];

  const features = [
    {
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
      title: "Real Threats",
      desc: "Curated list of known drainers and malicious contracts from the community.",
    },
    {
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
      title: "Complex Transactions",
      desc: "Handles smart transactions that call multiple functions in one go.",
    },
    {
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
      title: "Risk Scoring",
      desc: "Each transaction gets a score so you know how risky it is.",
    },
    {
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9-9a9 9 0 019 9" /></svg>,
      title: "Works Everywhere",
      desc: "Use it as a MetaMask Snap, HTTP API, or direct integration.",
    },
    {
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
      title: "Simple & Clear",
      desc: "Plain language verdicts. No crypto jargon, just what you need to know.",
    },
    {
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      title: "Always Synced",
      desc: "One threat feed across all your devices. Always up to date.",
    },
  ];

  return (
    <div className="space-y-16">
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="relative px-8 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-6xl md:text-7xl font-black text-white leading-tight">
                Milliseconds Matter
              </h1>

              <p className="text-xl text-slate-200 leading-relaxed">
                Transactions happen in milliseconds. So should your security. <strong>GENESIS analyzes every transaction instantly</strong> against community-verified threats—right inside your wallet.
              </p>

              <p className="text-lg text-slate-300">
                Get a clear verdict before you sign: <span className="font-bold text-green-400">✅ ALLOW</span>, <span className="font-bold text-yellow-400">⚠️ WARN</span>, or <span className="font-bold text-red-400">🚫 BLOCK</span>
              </p>

              <div className="flex gap-4 flex-wrap pt-2">
                <a
                  href="/check"
                  className="px-8 py-4 bg-gradient-to-r from-teal-500 to-teal-400 text-slate-950 rounded-lg font-bold hover:shadow-xl transition-all hover:shadow-teal-500/50 text-lg"
                >
                  🔎 Check a transaction — free
                </a>
                <a
                  href="/threats"
                  className="px-8 py-4 bg-slate-800 text-white rounded-lg font-bold border-2 border-teal-500 hover:border-teal-400 hover:shadow-lg transition-all"
                >
                  See live threats
                </a>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <img src="/images/hero-shield.svg" alt="Protection shield" className="w-96 h-auto drop-shadow-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW GENESIS WORKS ===== */}
      <section id="how-it-works" className="space-y-8">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">How GENESIS Works</h2>
          <p className="text-slate-200 text-lg">3 simple steps between you and a scam</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {flowSteps.map((step, i) => (
            <div key={i} className="relative">
              <div className="bg-gradient-to-br from-teal-500/10 to-indigo-500/10 border-2 border-teal-500/30 rounded-2xl p-8 h-full space-y-4">
                <div className="text-center">
                  {step.icon}
                  <h3 className="text-xl font-bold text-white mt-3">{step.label}</h3>
                </div>
                <p className="text-slate-300 text-sm text-center">
                  {i === 0 && "Click 'send' or 'approve' in any app. Uniswap, OpenSea, etc."}
                  {i === 1 && "GENESIS checks against community threat data in real-time. <200ms analysis."}
                  {i === 2 && "Clear verdict: is it safe to sign? Yes, maybe, or absolutely not."}
                </p>
              </div>
              {i < 2 && (
                <div className="hidden md:flex absolute top-1/2 -right-4 transform -translate-y-1/2 text-3xl text-teal-500">→</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ===== WHY THIS MATTERS ===== */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">The Risk Most People Don't See</h2>
          <p className="text-slate-200 text-lg font-medium">Every transaction carries risk. Here's what can go wrong.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Threat 1 */}
          <div className="flex gap-4 items-start rounded-2xl p-6 bg-slate-900 border-l-4 border-red-500 glow-red">
            <div className="flex-shrink-0 w-14 h-14 bg-red-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 5v.01M7.08 6.24l1.41 1.41m2.83-2.83l1.41-1.41m4.24 4.24l1.41 1.41m2.83-2.83l1.41-1.41M7.08 17.76l1.41-1.41m2.83 2.83l1.41 1.41m4.24-4.24l1.41-1.41m2.83 2.83l1.41 1.41" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white text-base mb-1">Phishing & Fake Apps</h3>
              <p className="text-sm text-slate-200 mb-2 font-medium">You click what looks like Uniswap, but it's a fake site. You sign a transaction giving them your tokens.</p>
              <p className="text-xs font-bold text-red-400">Could lose: Everything</p>
            </div>
          </div>

          {/* Threat 2 */}
          <div className="flex gap-4 items-start rounded-2xl p-6 bg-slate-900 border-l-4 border-orange-500 glow-orange">
            <div className="flex-shrink-0 w-14 h-14 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white text-base mb-1">Sneaky Permissions</h3>
              <p className="text-sm text-slate-200 mb-2 font-medium">You approve a swap, but the transaction gives unlimited spending access to a stranger's contract.</p>
              <p className="text-xs font-bold text-orange-400">Could lose: All tokens</p>
            </div>
          </div>

          {/* Threat 3 */}
          <div className="flex gap-4 items-start rounded-2xl p-6 bg-slate-900 border-l-4 border-yellow-500 glow-yellow">
            <div className="flex-shrink-0 w-14 h-14 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white text-base mb-1">Rug Pulls & Drains</h3>
              <p className="text-sm text-slate-200 mb-2 font-medium">You transfer your wallet's entire balance to what you think is a safe address.</p>
              <p className="text-xs font-bold text-yellow-400">Could lose: Everything</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border-2 border-teal-500/50 rounded-xl p-8 space-y-4">
          <h3 className="text-2xl font-black text-white">Here's the problem:</h3>
          <p className="text-slate-200 leading-relaxed font-medium">
            <strong>You can't see what a transaction really does</strong> by just looking at it. Your wallet shows you the fees and the destination, but not what the smart contract will actually execute once you sign. Scammers exploit this blind spot every day, draining thousands of wallets.
          </p>
          <p className="text-slate-200 leading-relaxed font-medium">
            <strong>Even experienced traders get caught.</strong> A convincing website, a typo in an address, or an overlooked permission and your entire portfolio disappears in seconds.
          </p>
        </div>

        <div className="bg-slate-900 border-2 border-teal-500/50 rounded-xl p-8 space-y-4 glow-teal">
          <h3 className="text-2xl font-black text-white">That's where GENESIS comes in:</h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="text-2xl flex-shrink-0 text-teal-400">✓</div>
              <p className="text-slate-200 font-medium"><strong>See what you're actually signing.</strong> GENESIS decodes the transaction and explains it in plain English.</p>
            </div>
            <div className="flex gap-3">
              <div className="text-2xl flex-shrink-0 text-teal-400">✓</div>
              <p className="text-slate-200 font-medium"><strong>Check against known threats.</strong> Powered by the community, we maintain a live list of known drainers and malicious contracts.</p>
            </div>
            <div className="flex gap-3">
              <div className="text-2xl flex-shrink-0 text-teal-400">✓</div>
              <p className="text-slate-200 font-medium"><strong>Get a clear verdict: ALLOW, WARN, or BLOCK.</strong> Before you ever sign.</p>
            </div>
            <div className="flex gap-3">
              <div className="text-2xl flex-shrink-0 text-teal-400">✓</div>
              <p className="text-slate-200 font-medium"><strong>Takes 2 seconds.</strong> Copy your transaction, paste it, get your answer. Then decide confidently.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== GETTING STARTED ===== */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Get started in seconds</h2>
          <p className="text-slate-200 text-lg font-medium">Choose what works for you</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Verify Transactions */}
          <div className="group bg-slate-900/90 rounded-2xl border border-slate-700 p-8 space-y-5 transition-all hover:border-teal-400 hover:shadow-lg hover:shadow-teal-500/10">
            <div className="w-14 h-14 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-center justify-center text-teal-400">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white">Verify Transactions</h3>
            <p className="text-sm text-slate-300 font-medium">Analyze real transactions and get instant verdicts. No signup required.</p>
            <div className="pt-2 space-y-2">
              <p className="text-sm font-semibold text-slate-200">✓ Real verdicts</p>
              <p className="text-sm font-semibold text-slate-200">✓ Any blockchain</p>
              <p className="text-sm font-semibold text-slate-200">✓ Instant results</p>
            </div>
            <a
              href="/check"
              className="inline-block mt-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold transition shadow-lg shadow-teal-900/30"
            >
              Check now →
            </a>
          </div>

          {/* Wallet Protection */}
          <div className="group bg-slate-900/90 rounded-2xl border border-slate-700 p-8 space-y-5 transition-all hover:border-teal-400 hover:shadow-lg hover:shadow-teal-500/10">
            <div className="w-14 h-14 bg-slate-800 border border-slate-600 rounded-xl flex items-center justify-center text-teal-400">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white">Automatic protection</h3>
            <p className="text-sm text-slate-300 font-medium">Coming soon: real-time checks built into your browser and wallet, so every transaction is screened as you sign.</p>
            <div className="pt-2 space-y-2">
              <p className="text-sm font-semibold text-slate-200">✓ Browser extension (in progress)</p>
              <p className="text-sm font-semibold text-slate-200">✓ In-wallet protection</p>
              <p className="text-sm font-semibold text-slate-200">✓ Same community threat feed</p>
            </div>
            <a
              href="/whitepaper"
              className="inline-block mt-2 px-6 py-3 bg-slate-800 border border-slate-600 hover:border-teal-400 text-white rounded-lg font-bold transition"
            >
              See the roadmap →
            </a>
          </div>

          {/* API Integration */}
          <div className="group bg-slate-900/90 rounded-2xl border border-slate-700 p-8 space-y-5 transition-all hover:border-teal-400 hover:shadow-lg hover:shadow-teal-500/10">
            <div className="w-14 h-14 bg-slate-800 border border-slate-600 rounded-xl flex items-center justify-center text-teal-400">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white">API Integration</h3>
            <p className="text-sm text-slate-300 font-medium">For developers. Build safer wallets and dapps with our HTTP API.</p>
            <div className="pt-2 space-y-2">
              <p className="text-sm font-semibold text-slate-200">✓ Production-ready</p>
              <p className="text-sm font-semibold text-slate-200">✓ Full documentation</p>
              <p className="text-sm font-semibold text-slate-200">✓ Available now</p>
            </div>
            <a
              href="/transaction-check"
              className="inline-block mt-2 px-6 py-3 bg-slate-800 border border-slate-600 hover:border-teal-400 text-white rounded-lg font-bold transition"
            >
              Check a Transaction →
            </a>
          </div>
        </div>
      </section>

      {/* ===== VISUAL: TRANSACTION FLOW ===== */}
      <section className="flex justify-center py-8">
        <img src="/images/transaction-flow.svg" alt="Transaction flow diagram" className="w-full max-w-2xl drop-shadow-xl rounded-2xl" />
      </section>

      {/* ===== VERDICT EXAMPLES ===== */}
      <section className="grid md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border-2 border-green-500/50 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-2xl font-black text-green-400">ALLOW</div>
          </div>
          <p className="text-green-300 font-bold">Safe to sign</p>
          <p className="text-sm text-slate-300">A simple transfer to a trusted address. No risks detected.</p>
        </div>
        <div className="bg-slate-900 border-2 border-yellow-500/50 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 5v.01M7.08 6.24l1.41 1.41m2.83-2.83l1.41-1.41m4.24 4.24l1.41 1.41m2.83-2.83l1.41-1.41M7.08 17.76l1.41-1.41m2.83 2.83l1.41 1.41m4.24-4.24l1.41-1.41m2.83 2.83l1.41 1.41" />
              </svg>
            </div>
            <div className="text-2xl font-black text-yellow-400">WARN</div>
          </div>
          <p className="text-yellow-300 font-bold">Caution advised</p>
          <p className="text-sm text-slate-300">Giving permissions to a new app. Verify you trust it.</p>
        </div>
        <div className="bg-slate-900 border-2 border-red-500/50 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="text-2xl font-black text-red-400">BLOCK</div>
          </div>
          <p className="text-red-300 font-bold">Don't sign</p>
          <p className="text-sm text-slate-300">Detected interaction with a known malicious address.</p>
        </div>
      </section>

      {/* ===== CORE FEATURES ===== */}
      <section className="space-y-8">
        <div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Why use GENESIS?</h2>
          <p className="text-slate-400 text-lg">Built for everyday crypto users and power users alike</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="group bg-slate-900 rounded-xl p-6 border-2 border-teal-500/30 hover:border-teal-400 hover:shadow-lg hover:shadow-teal-500/20 transition space-y-3"
            >
              <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center text-teal-400 group-hover:scale-110 transition">
                {f.icon}
              </div>
              <h3 className="font-bold text-white text-lg">{f.title}</h3>
              <p className="text-sm text-slate-300">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== THE BIGGER PICTURE ===== */}
      <section className="space-y-6 py-8">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">The bigger picture</h2>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">Checking crypto transactions is step one. Underneath, GENESIS is a simple idea: catch a risky action and explain it in plain English <em>before</em> you commit to it.</p>
        </div>
        <div className="bg-slate-900 border-2 border-teal-500/50 rounded-xl p-8 text-center space-y-4 max-w-3xl mx-auto">
          <p className="text-slate-300 leading-relaxed">
            The same safety check can protect far more than wallets. Curious where we're headed and how it works under the hood?
          </p>
          <a href="/whitepaper" className="inline-block px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold text-sm transition">
            Read the vision →
          </a>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="space-y-8">
        <div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Questions? We've got answers</h2>
          <p className="text-slate-400 text-lg">Understand the basics</p>
        </div>
        <div className="grid gap-6">
          {faqItems.map((item, i) => (
            <div key={i} className="bg-slate-900 rounded-lg border-2 border-teal-500/30 p-6 space-y-3 hover:border-teal-400 transition">
              <h3 className="font-bold text-white text-lg">{item.title}</h3>
              <p className="text-slate-300 leading-relaxed">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== INTEGRATION OPTIONS ===== */}
      <section className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">How to use GENESIS</h2>
          <p className="text-slate-700 dark:text-slate-400">Choose what works best for you</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* MetaMask Snap */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl border-2 border-orange-200 dark:border-orange-600 p-8 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🦊</span>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">MetaMask Snap</h3>
                <p className="text-sm text-slate-700 dark:text-slate-400">One-click install</p>
              </div>
            </div>
            <p className="text-slate-900 dark:text-slate-300">
              Add GENESIS to MetaMask. Every time you're about to sign a transaction, we'll pop up with a verdict.
            </p>
            <div className="bg-white/60 dark:bg-slate-700 rounded-lg p-3 text-xs font-mono text-slate-800 dark:text-slate-300">
              Coming soon: Full snap integration with MetaMask
            </div>
          </div>

          {/* HTTP API */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-50 dark:from-indigo-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-indigo-200 dark:border-indigo-600 p-8 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">⚙️</span>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">HTTP API</h3>
                <p className="text-sm text-slate-700 dark:text-slate-400">For developers</p>
              </div>
            </div>
            <p className="text-slate-900 dark:text-slate-300">
              Send us a transaction (any format) and we return a risk verdict. Integrate into your wallet, dashboard, or
              bot.
            </p>
            <a
              href="/transaction-check"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              Check a Transaction →
            </a>
          </div>
        </div>
      </section>

      {/* ===== WHO IS THIS FOR ===== */}
      <section className="space-y-8">
        <div className="flex justify-center mb-8">
          <img src="/images/community-network.svg" alt="Community network" className="w-full max-w-2xl drop-shadow-xl rounded-2xl" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Who is GENESIS for?</h2>
          <p className="text-slate-700 dark:text-slate-400">If you use crypto, GENESIS is built for you.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg border-2 border-slate-200 dark:border-slate-700 p-6 space-y-3 hover:border-indigo-300 dark:hover:border-indigo-500 transition">
            <div className="text-3xl">💰</div>
            <h3 className="font-bold text-slate-900 dark:text-white">DeFi Traders</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Swap, stake, and farm with confidence. GENESIS checks approvals before you risk your funds.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border-2 border-slate-200 dark:border-slate-700 p-6 space-y-3 hover:border-indigo-300 dark:hover:border-indigo-500 transition">
            <div className="text-3xl">🖼️</div>
            <h3 className="font-bold text-slate-900 dark:text-white">NFT Collectors</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Protect your valuable collections. GENESIS blocks approvals to known NFT thieves.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border-2 border-slate-200 dark:border-slate-700 p-6 space-y-3 hover:border-indigo-300 dark:hover:border-indigo-500 transition">
            <div className="text-3xl">🛡️</div>
            <h3 className="font-bold text-slate-900 dark:text-white">Crypto Beginners</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              New to crypto? GENESIS explains transactions in plain English, not jargon.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border-2 border-slate-200 dark:border-slate-700 p-6 space-y-3 hover:border-indigo-300 dark:hover:border-indigo-500 transition">
            <div className="text-3xl">🚀</div>
            <h3 className="font-bold text-slate-900 dark:text-white">Power Users</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Complex transactions? GENESIS decodes bundled actions and shows what each one really does.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border-2 border-slate-200 dark:border-slate-700 p-6 space-y-3 hover:border-indigo-300 dark:hover:border-indigo-500 transition">
            <div className="text-3xl">🔧</div>
            <h3 className="font-bold text-slate-900 dark:text-white">Developers</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Build safer wallets and apps. Our API returns a clear verdict for any transaction.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border-2 border-slate-200 dark:border-slate-700 p-6 space-y-3 hover:border-indigo-300 dark:hover:border-indigo-500 transition">
            <div className="text-3xl">🔍</div>
            <h3 className="font-bold text-slate-900 dark:text-white">Security Teams</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Community-verified threat intelligence — confirmed by multiple independent reporters before it counts.
            </p>
          </div>
        </div>
      </section>

      {/* ===== VISUAL ROADMAP ===== */}
      <section className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Our Journey</h2>
          <p className="text-slate-700 dark:text-slate-400">From today to a safer crypto future, one step at a time.</p>
        </div>

        <div className="flex justify-center mb-8">
          <img src="/images/wallet-protection.svg" alt="Wallet protection" className="w-full max-w-2xl drop-shadow-xl rounded-2xl" />
        </div>

        <div className="space-y-6">
          {/* Phase 1: MVP */}
          <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-teal-500/10 dark:from-emerald-500/5 dark:via-emerald-500/5 dark:to-teal-500/5 border border-emerald-400/30 dark:border-emerald-500/20 shadow-2xl hover:shadow-emerald-500/10 transition-all p-8 space-y-4">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-transparent pointer-events-none"></div>
            <div className="relative flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 backdrop-blur-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-bold mb-3 border border-emerald-400/30">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  LIVE NOW
                </div>
                <h3 className="text-2xl font-bold text-emerald-950 dark:text-white mb-2">Phase 1: Foundation (Sept 2026)</h3>
                <p className="text-emerald-900 dark:text-slate-300 mb-4 font-medium">Wallet protection you can trust, starting today</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 backdrop-blur-md border border-emerald-400/30">
                <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-emerald-950 dark:text-slate-300">
                We've built a working gate that checks crypto transactions before you sign. It blocks known scams, warns you about risky moves, and explains everything in plain English—no crypto jargon.
              </p>
              <p className="text-emerald-950 dark:text-slate-300">
                Try it with real transactions on our demo. The system learns from community reports, so it gets smarter over time.
              </p>
              <a href="/check" className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold hover:underline">
                → Try the free checker
              </a>
            </div>
          </div>

          {/* Phase 2: Adoption */}
          <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-indigo-500/10 dark:from-indigo-500/5 dark:via-indigo-500/5 dark:to-indigo-500/5 border border-indigo-400/30 dark:border-indigo-500/20 shadow-2xl hover:shadow-indigo-500/10 transition-all p-8 space-y-4">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/5 to-transparent pointer-events-none"></div>
            <div className="relative flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 backdrop-blur-md bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold mb-3 border border-indigo-400/30">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Q4 2026
                </div>
                <h3 className="text-2xl font-bold text-indigo-950 dark:text-white mb-2">Phase 2: In Your Wallet (Q4 2026)</h3>
                <p className="text-indigo-900 dark:text-slate-300 mb-4 font-medium">Protection built directly into MetaMask</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0 backdrop-blur-md border border-indigo-400/30">
                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-6" /></svg>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-indigo-950 dark:text-slate-300">
                Install GENESIS as a MetaMask Snap and get real-time protection every time you sign. No copy-pasting addresses or leaving your wallet—just one-click safety.
              </p>
              <p className="text-indigo-950 dark:text-slate-300">
                Works across Ethereum, Polygon, Base, and more. Whether you're trading, collecting NFTs, or doing DeFi, GENESIS watches your back.
              </p>
            </div>
          </div>

          {/* Phase 3: Scale */}
          <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-orange-500/10 via-red-500/5 to-orange-500/10 dark:from-orange-500/5 dark:via-red-500/5 dark:to-orange-500/5 border border-orange-400/30 dark:border-orange-500/20 shadow-2xl hover:shadow-orange-500/10 transition-all p-8 space-y-4">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400/5 to-transparent pointer-events-none"></div>
            <div className="relative flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 backdrop-blur-md bg-orange-500/20 text-orange-700 dark:text-orange-300 rounded-full text-xs font-bold mb-3 border border-orange-400/30">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  2027
                </div>
                <h3 className="text-2xl font-bold text-orange-950 dark:text-white mb-2">Phase 3: Community-Powered (2027)</h3>
                <p className="text-orange-900 dark:text-slate-300 mb-4 font-medium">Your network, your rules</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0 backdrop-blur-md border border-orange-400/30">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 0H3m9 9c-1.657 0-3-4.03-3-9s1.343-9 3-9m0 0h6" /></svg>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-orange-950 dark:text-slate-300">
                Threat intel is stronger when the community contributes. We're building tools for security researchers, white-hats, and everyday users to report scams and vote on what's dangerous.
              </p>
              <p className="text-orange-950 dark:text-slate-300">
                You'll earn rewards for helping protect others. Together, we grow the world's most trusted threat intelligence network—owned by the community, not by any corporation.
              </p>
            </div>
          </div>
        </div>

        {/* Threat Detection Image */}
        <div className="flex justify-center my-8">
          <img src="/images/threat-detection.svg" alt="Threat detection system" className="w-full max-w-2xl drop-shadow-xl rounded-2xl" />
        </div>

        {/* Not roadmap: What we won't do */}
        <div className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-lg p-6">
          <p className="font-semibold text-slate-900 dark:text-white mb-3">🎯 Our Promise</p>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-900 dark:text-slate-300">
            <div>
              <p className="font-medium text-red-600">❌ We won't</p>
              <ul className="mt-2 space-y-1">
                <li>Claim to be "hack-proof"</li>
                <li>Hide code or go closed-source</li>
                <li>Sell your transaction data</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-red-600">❌ We won't</p>
              <ul className="mt-2 space-y-1">
                <li>Custody your funds</li>
                <li>Lock basic safety behind a paywall</li>
                <li>Trace user wallets</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-green-600">✅ We will</p>
              <ul className="mt-2 space-y-1">
                <li>Keep code open-source</li>
                <li>Respect your privacy</li>
                <li>Ship features users need</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="text-center space-y-6">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Ready to protect your wallet?</h2>
        <p className="text-slate-600 dark:text-slate-400 text-lg">Join thousands of crypto users already using GENESIS</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <a
            href="/check"
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-xl transition-all hover:scale-105"
          >
            Check a transaction — free
          </a>
          <a
            href="https://github.com/amaratisirs-ai/sadhutech"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-semibold border-2 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 transition"
          >
            Star on GitHub
          </a>
        </div>
      </section>
    </div>
  );
}
