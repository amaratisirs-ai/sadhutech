"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Genesis, withGenesisStyle } from "@/components/Genesis";

const slides = [
  {
    num: 1,
    title: "What is GENESIS?",
    subtitle: "Security that thinks like nature",
    content: "GENESIS is a pre-sign security gate that analyzes your crypto transactions before you sign them. It catches scams, drainers, and tricks  -  all without accessing your private keys.",
    icon: "shield",
  },
  {
    num: 2,
    title: "The Problem",
    subtitle: "Why crypto wallets need protection",
    content: "Hackers exploit old permissions and approvals to drain wallets. A single bad approval can lock attackers into your assets forever. Traditional security can't adapt fast enough.",
    icon: "warning",
  },
  {
    num: 3,
    title: "Nature's Solution",
    subtitle: "Four pillars of intelligent defense",
    content: "Just like ant colonies, immune systems, quantum entanglement, and biodiversity protect nature, GENESIS uses 4 natural mechanisms to build unbreakable security.",
    icon: "leaf",
  },
  {
    num: 4,
    title: "Pillar 1: Hive",
    subtitle: "Swarm voting (no single point of failure)",
    content: "Many independent security nodes analyze your transaction simultaneously. Like a colony, they vote on whether it's safe. No single node can be fooled or corrupted.",
    icon: "users",
  },
  {
    num: 5,
    title: "Pillar 2: Nucleus",
    subtitle: "Layered protection (like concentric circles)",
    content: "Your most valuable assets (keys, approvals, big transfers) are wrapped in nested layers of checks. Bypass one layer? You hit the next one. Each layer is independent.",
    icon: "atom",
  },
  {
    num: 6,
    title: "Pillar 3: Entanglement Fabric",
    subtitle: "Quantum-safe trust bonds (unbreakable connections)",
    content: "Your session and credentials are locked together with special cryptography. Steal a credential? It's useless without the session. Replay an attack? The bonds have changed.",
    icon: "link",
  },
  {
    num: 7,
    title: "Pillar 4: Multiverse",
    subtitle: "Deception & self-healing (parallel universes)",
    content: "If something looks wrong, your session forks. Attackers navigate a fake environment (honeypot) while your real transaction stays safe. System heals itself automatically.",
    icon: "network",
  },
  {
    num: 8,
    title: "How It Works: Step 1",
    subtitle: "You sign a transaction",
    content: "You open your wallet and try to approve a token swap, NFT mint, or DeFi interaction. Your private key stays in your wallet (never sent anywhere).",
    icon: "pencil",
  },
  {
    num: 9,
    title: "How It Works: Step 2",
    subtitle: "GENESIS analyzes it",
    content: "The Hive swarm instantly checks: Is this address known to be malicious? Are the token amounts reasonable? Does this violate your normal patterns? Is this a known exploit pattern?",
    icon: "search",
  },
  {
    num: 10,
    title: "How It Works: Step 3",
    subtitle: "You get a verdict",
    content: "ALLOW (safe to sign) | WARN (risky, double-check) | BLOCK (likely scam, don't sign)",
    icon: "chart",
  },
  {
    num: 11,
    title: "Real Example: Approval Attack",
    subtitle: "How GENESIS stops the most common scam",
    content: "You approve Token X for a swap. Hacker uses that old approval to drain your wallet. GENESIS catches it because: 1) Unusual recipient, 2) Unusual amount, 3) Known drainer address pattern.",
    icon: "block",
  },
  {
    num: 12,
    title: "Why Nature's Approach Wins",
    subtitle: "Comparison: Traditional vs. Natural",
    content: "Traditional security: One rule, one gate, one algorithm. Hackers know exactly what to bypass. Natural (GENESIS): Many nodes, emergent voting, moving target. Impossible to predict or prepare for.",
    icon: "trophy",
  },
  {
    num: 13,
    title: "Privacy: Your Keys Stay Yours",
    subtitle: "GENESIS never touches your private keys",
    content: "Only the transaction data (calldata) is analyzed. Your private keys never leave your wallet. You stay in full control. It's a guardian, not a gatekeeper.",
    icon: "lock",
  },
  {
    num: 14,
    title: "The Future",
    subtitle: "Crypto security that evolves",
    content: "As threats evolve, GENESIS adapts. The swarm learns. New patterns are detected. No firmware updates needed. The system self-heals and grows stronger, just like nature.",
    icon: "rocket",
  },
  {
    num: 15,
    title: "Ready to Protect Your Wallet?",
    subtitle: "Try GENESIS today",
    content: "Test it with your real transactions (GENESIS blocks nothing without your consent). See how it analyzes and explains every finding. Your crypto. Your control. Your security.",
    icon: "badge",
  },
];

export default function LaymansPPTPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slide = slides[currentSlide];

  const goNext = () => {
    if (currentSlide < slides.length - 1) setCurrentSlide(currentSlide + 1);
  };

  const goPrev = () => {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  };

  const goToSlide = (num: number) => {
    setCurrentSlide(num);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-950 to-slate-950 py-8 px-6 border-b-2 border-teal-500/30">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-black text-teal-400">
            <Genesis /> Layman's PPT
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Slide {currentSlide + 1} of {slides.length}
          </p>
        </div>
      </div>

      {/* Main Slide */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-teal-500/30 rounded-2xl p-12 md:p-16 min-h-96 flex flex-col justify-between glow-teal">
          {/* Slide Content */}
          <div>
            {/* Large Icon */}
            <div className="mb-8 flex justify-center text-teal-400"><Icon name={slide.icon as any} className="w-16 h-16" /></div>

            {/* Slide Number */}
            <div className="text-teal-500/50 text-sm font-mono mb-4">
              {String(slide.num).padStart(2, "0")}/15
            </div>

            {/* Title */}
            <h2 className="text-4xl md:text-5xl font-black text-teal-400 mb-4 leading-tight">
              {withGenesisStyle(slide.title)}
            </h2>

            {/* Subtitle */}
            <p className="text-xl text-teal-300/80 font-semibold mb-8">
              {withGenesisStyle(slide.subtitle)}
            </p>

            {/* Content */}
            <p className="text-lg text-slate-300 leading-relaxed mb-8">
              {withGenesisStyle(slide.content)}
            </p>
          </div>

          {/* Visual Divider */}
          <div className="h-1 bg-gradient-to-r from-teal-500/30 via-teal-500/60 to-teal-500/30 rounded-full"></div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-8 justify-center">
          <button
            onClick={goPrev}
            disabled={currentSlide === 0}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold transition border border-slate-600"
          >
            ← Previous
          </button>

          <div className="flex-1 flex items-center justify-center">
            <p className="text-slate-400 font-semibold">
              {currentSlide + 1} / {slides.length}
            </p>
          </div>

          <button
            onClick={goNext}
            disabled={currentSlide === slides.length - 1}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold transition"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Slide Thumbnails */}
      <div className="max-w-6xl mx-auto px-6 py-12 mt-8 border-t border-teal-500/20">
        <h3 className="text-sm font-bold text-teal-400 mb-4 uppercase tracking-widest">
          Jump to Slide
        </h3>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2 max-h-20 overflow-y-auto">
          {slides.map((s, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`
                w-12 h-12 rounded-lg font-bold text-sm transition-all
                ${
                  idx === currentSlide
                    ? "bg-teal-600 text-white border-2 border-teal-400"
                    : "bg-slate-800 text-slate-400 border-2 border-slate-700 hover:border-teal-500 hover:text-teal-400"
                }
              `}
            >
              {String(idx + 1).padStart(2, "0")}
            </button>
          ))}
        </div>
      </div>

      {/* Slide Key Points (Optional Summary) */}
      <div className="max-w-6xl mx-auto px-6 py-12 border-t border-teal-500/20">
        <h3 className="text-sm font-bold text-teal-400 mb-4 uppercase tracking-widest">
          4 Pillars Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/50 border-l-4 border-amber-500 rounded p-4">
            <div className="mb-2 text-amber-400"><Icon name="users" className="w-8 h-8" /></div>
            <p className="font-bold text-amber-400 text-sm">Hive: Swarm Voting</p>
            <p className="text-slate-400 text-xs mt-1">No single point of failure</p>
          </div>
          <div className="bg-slate-900/50 border-l-4 border-purple-500 rounded p-4">
            <div className="mb-2 text-purple-400"><Icon name="atom" className="w-8 h-8" /></div>
            <p className="font-bold text-purple-400 text-sm">Nucleus: Layered Protection</p>
            <p className="text-slate-400 text-xs mt-1">Nested security circles</p>
          </div>
          <div className="bg-slate-900/50 border-l-4 border-cyan-500 rounded p-4">
            <div className="mb-2 text-cyan-400"><Icon name="link" className="w-8 h-8" /></div>
            <p className="font-bold text-cyan-400 text-sm">Entanglement: Quantum-Safe</p>
            <p className="text-slate-400 text-xs mt-1">Unbreakable trust bonds</p>
          </div>
          <div className="bg-slate-900/50 border-l-4 border-indigo-500 rounded p-4">
            <div className="mb-2 text-indigo-400"><Icon name="network" className="w-8 h-8" /></div>
            <p className="font-bold text-indigo-400 text-sm">Multiverse: Deception</p>
            <p className="text-slate-400 text-xs mt-1">Self-healing via honeypots</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-teal-500/20 mt-12 py-8 px-6 text-center text-slate-500 text-sm">
        <p><Genesis /> Layman's Presentation | 15 Slides</p>
        <p className="text-xs mt-2">Nature-Inspired Crypto Security</p>
      </div>
    </div>
  );
}
