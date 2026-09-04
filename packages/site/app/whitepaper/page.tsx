"use client";

import { Icon } from "@/components/Icon";

export default function WhitepaperPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-950 to-slate-950 py-16 px-6 border-b-2 border-teal-500/30">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-black text-teal-400 mb-4">
            GENESIS: Nature-Inspired Security Architecture
          </h1>
          <p className="text-xl text-slate-300 font-semibold">
            A Whitepaper on Decentralized, Emergent, and Self-Healing Defense
          </p>
          <p className="text-sm text-slate-500 mt-4">Version 1.0 | September 2026</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-16 space-y-16">
        
        {/* Problem Statement */}
        <section className="space-y-8">
          <div className="border-l-4 border-red-500 pl-6 py-4">
            <h2 className="text-3xl font-black text-red-400 mb-4">The Problem</h2>
            <p className="text-slate-300 text-lg leading-relaxed mb-4">
              Traditional security defends through <strong>centralization, predictability, and stasis</strong>. One gate, one detection model, fixed topology  -  breach one, lose all.
            </p>
          </div>

          {/* Fortress Paradox Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-950/40 border-2 border-red-500/30 rounded-lg p-6">
              <div className="mb-2 text-red-400"><Icon name="building" className="w-8 h-8" /></div>
              <h3 className="font-bold text-red-400 mb-2">Centralization</h3>
              <p className="text-slate-400 text-sm">Single control plane = single point of failure</p>
            </div>
            <div className="bg-red-950/40 border-2 border-red-500/30 rounded-lg p-6">
              <div className="mb-2 text-red-400"><Icon name="chart" className="w-8 h-8" /></div>
              <h3 className="font-bold text-red-400 mb-2">Predictability</h3>
              <p className="text-slate-400 text-sm">Known detection models can be bypassed</p>
            </div>
            <div className="bg-red-950/40 border-2 border-red-500/30 rounded-lg p-6">
              <div className="mb-2 text-red-400"><Icon name="map" className="w-8 h-8" /></div>
              <h3 className="font-bold text-red-400 mb-2">Fixed Topology</h3>
              <p className="text-slate-400 text-sm">Attackers can map the infrastructure</p>
            </div>
            <div className="bg-red-950/40 border-2 border-red-500/30 rounded-lg p-6">
              <div className="mb-2 text-red-400"><Icon name="fire" className="w-8 h-8" /></div>
              <h3 className="font-bold text-red-400 mb-2">Breach Cascade</h3>
              <p className="text-slate-400 text-sm">One bypass compromises everything</p>
            </div>
          </div>
        </section>

        {/* 4 Pillars */}
        <section className="space-y-8">
          <div className="border-l-4 border-teal-500 pl-6 py-4">
            <h2 className="text-3xl font-black text-teal-400 mb-2">The Solution: 4 Natural Pillars</h2>
            <p className="text-slate-300">GENESIS implements four mechanisms from nature, using cryptography and distributed systems.</p>
          </div>

          {/* Pillar 1: Hive */}
          <div className="bg-gradient-to-r from-amber-950/40 to-slate-900/40 border-l-4 border-amber-500 rounded-lg p-8 space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-amber-400"><Icon name="users" className="w-10 h-10" /></div>
              <div>
                <h3 className="text-2xl font-bold text-amber-400">Hive: Emergent Swarm Detection</h3>
                <p className="text-sm text-slate-400">No single decision-maker; consensus from the colony</p>
              </div>
            </div>
            <div className="bg-slate-900/50 rounded p-4 text-slate-300 text-sm space-y-2">
              <p><strong>How it works:</strong> Independent nodes analyze a transaction. Threats emerge from quorum voting, not a central algorithm.</p>
              <p><strong>Why it's resilient:</strong> Compromise one node, others still vote. Compromise 33%, consensus holds. Unpredictable decision topology.</p>
              <p><strong>Engineering:</strong> Threshold signatures, Byzantine consensus, Sybil-resistant threat feeds</p>
            </div>
          </div>

          {/* Pillar 2: Nucleus */}
          <div className="bg-gradient-to-r from-purple-950/40 to-slate-900/40 border-l-4 border-purple-500 rounded-lg p-8 space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-purple-400"><Icon name="atom" className="w-10 h-10" /></div>
              <div>
                <h3 className="text-2xl font-bold text-purple-400">Nucleus: Layered Atomic Protection</h3>
                <p className="text-sm text-slate-400">Concentric rings around the crown jewels</p>
              </div>
            </div>
            <div className="bg-slate-900/50 rounded p-4 text-slate-300 text-sm space-y-2">
              <p><strong>How it works:</strong> Critical assets (keys, permits, approvals) are wrapped in nested validation layers. Each layer is independent.</p>
              <p><strong>Why it's resilient:</strong> Bypass layer 1, you hit layer 2. Each layer has its own entropy and keypair. Attacker can't prepare a single universal exploit.</p>
              <p><strong>Engineering:</strong> Atomic transactions, key derivation, multi-sig quorum at each layer</p>
            </div>
          </div>

          {/* Pillar 3: Entanglement Fabric */}
          <div className="bg-gradient-to-r from-cyan-950/40 to-slate-900/40 border-l-4 border-cyan-500 rounded-lg p-8 space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-cyan-400"><Icon name="link" className="w-10 h-10" /></div>
              <div>
                <h3 className="text-2xl font-bold text-cyan-400">Entanglement Fabric: Quantum-Safe Trust</h3>
                <p className="text-sm text-slate-400">Unclonable bonds between participants</p>
              </div>
            </div>
            <div className="bg-slate-900/50 rounded p-4 text-slate-300 text-sm space-y-2">
              <p><strong>How it works:</strong> Trust relationships are established via PQC (post-quantum cryptography) and contextual binding. Credentials are tied to session state, not replayable.</p>
              <p><strong>Why it's resilient:</strong> Steal a certificate, it's useless without the context. Replay a transaction, entropy has changed. Quantum computers can't break the bonds.</p>
              <p><strong>Engineering:</strong> CRYSTALS-Kyber/Dilithium, session-scoped contexts, entropy mixing</p>
            </div>
          </div>

          {/* Pillar 4: Multiverse */}
          <div className="bg-gradient-to-r from-indigo-950/40 to-slate-900/40 border-l-4 border-indigo-500 rounded-lg p-8 space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-indigo-400"><Icon name="network" className="w-10 h-10" /></div>
              <div>
                <h3 className="text-2xl font-bold text-indigo-400">Multiverse: Deception & Self-Healing</h3>
                <p className="text-sm text-slate-400">Parallel universes for containment and rollback</p>
              </div>
            </div>
            <div className="bg-slate-900/50 rounded p-4 text-slate-300 text-sm space-y-2">
              <p><strong>How it works:</strong> When anomalies are detected, the session forks. User gets a decoy environment; attacker navigates a controlled labyrinth.</p>
              <p><strong>Why it's resilient:</strong> Attacker wastes resources in the decoy. Legitimate sessions roll back cleanly. Self-healing via retroactive consensus.</p>
              <p><strong>Engineering:</strong> Fork-on-risk, decoy honeypot generation, rollback journals, consensus-driven healing</p>
            </div>
          </div>
        </section>

        {/* Use Case Flow */}
        <section className="space-y-8">
          <div className="border-l-4 border-teal-500 pl-6 py-4">
            <h2 className="text-3xl font-black text-teal-400">Use Case: Transaction Analysis</h2>
          </div>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center font-bold text-white text-lg">1</div>
                <div className="w-1 h-16 bg-teal-500/30 mt-2"></div>
              </div>
              <div className="bg-slate-900/50 border-l-4 border-teal-500 rounded p-6 flex-1">
                <h3 className="font-bold text-teal-400 mb-2">User submits transaction</h3>
                <p className="text-slate-400 text-sm">Wallet sends calldata to GENESIS. No private keys leave the device.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center font-bold text-white text-lg">2</div>
                <div className="w-1 h-16 bg-amber-500/30 mt-2"></div>
              </div>
              <div className="bg-slate-900/50 border-l-4 border-amber-500 rounded p-6 flex-1">
                <h3 className="font-bold text-amber-400 mb-2">Hive votes on risk</h3>
                <p className="text-slate-400 text-sm">Swarm of independent nodes analyzes the calldata. Quorum determines severity: INFO, MEDIUM, HIGH, CRITICAL.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center font-bold text-white text-lg">3</div>
                <div className="w-1 h-16 bg-purple-500/30 mt-2"></div>
              </div>
              <div className="bg-slate-900/50 border-l-4 border-purple-500 rounded p-6 flex-1">
                <h3 className="font-bold text-purple-400 mb-2">Nucleus evaluates privilege</h3>
                <p className="text-slate-400 text-sm">If risky, Nucleus checks: Is this a critical asset? Is the user authorized? Are the amounts reasonable?</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center font-bold text-white text-lg">4</div>
                <div className="w-1 h-16 bg-cyan-500/30 mt-2"></div>
              </div>
              <div className="bg-slate-900/50 border-l-4 border-cyan-500 rounded p-6 flex-1">
                <h3 className="font-bold text-cyan-400 mb-2">Entanglement Fabric validates trust</h3>
                <p className="text-slate-400 text-sm">Session context is checked. Credentials verified against quantum-safe bonds. No replay attacks possible.</p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-white text-lg">5</div>
              </div>
              <div className="bg-slate-900/50 border-l-4 border-indigo-500 rounded p-6 flex-1">
                <h3 className="font-bold text-indigo-400 mb-2">Multiverse renders verdict</h3>
                <p className="text-slate-400 text-sm"><strong>ALLOW:</strong> Safe to sign. <strong>WARN:</strong> Risky but not malicious. <strong>BLOCK:</strong> Likely exploit; fork to decoy universe.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Architecture Diagram */}
        <section className="space-y-8">
          <div className="border-l-4 border-teal-500 pl-6 py-4">
            <h2 className="text-3xl font-black text-teal-400">High-Level Architecture</h2>
          </div>

          <div className="bg-gradient-to-b from-slate-900/50 to-slate-800/50 border-2 border-teal-500/30 rounded-lg p-4 overflow-x-auto">
            {/* Level 1: User Wallet */}
            <div className="flex justify-center mb-3">
              <div className="bg-gradient-to-r from-indigo-900/60 to-indigo-800/60 border-2 border-indigo-500/60 rounded-lg px-6 py-2 w-full max-w-xs text-center">
                <div className="text-sm font-bold text-indigo-300">User Wallet</div>
                <div className="text-xs text-indigo-400">Private keys stay local</div>
              </div>
            </div>

            {/* Arrow 1 */}
            <div className="flex justify-center mb-3">
              <div className="flex flex-col items-center">
                <svg className="w-5 h-6 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span className="text-xs text-teal-400 font-semibold mt-0.5">calldata</span>
              </div>
            </div>

            {/* Level 2: GENESIS Gate */}
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-teal-900/60 to-cyan-900/60 border-2 border-teal-500/70 rounded-lg px-6 py-2 w-full max-w-lg text-center">
                <div className="text-base font-black text-teal-300 flex items-center justify-center gap-2"><Icon name="bolt" className="w-5 h-5" /> GENESIS Gate</div>
                <div className="text-xs text-teal-400">(Pre-sign Analysis)</div>
              </div>
            </div>

            {/* Arrow 2 */}
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-3 w-full px-2">
                <div className="flex-1 h-0.5 bg-gradient-to-r from-teal-500/30 via-teal-500/60 to-teal-500/30 rounded-full"></div>
                <span className="text-xs text-teal-400 font-semibold whitespace-nowrap">Parallel</span>
                <div className="flex-1 h-0.5 bg-gradient-to-r from-teal-500/30 via-teal-500/60 to-teal-500/30 rounded-full"></div>
              </div>
            </div>

            {/* Level 3: 4 Pillars in Parallel */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {/* Hive */}
              <div className="bg-gradient-to-br from-amber-900/50 to-amber-800/40 border-2 border-amber-500/50 rounded p-2 text-center">
                <div className="flex justify-center text-amber-400"><Icon name="users" className="w-7 h-7" /></div>
                <div className="font-bold text-amber-400 text-xs">Hive</div>
              </div>

              {/* Nucleus */}
              <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/40 border-2 border-purple-500/50 rounded p-2 text-center">
                <div className="flex justify-center text-purple-400"><Icon name="atom" className="w-7 h-7" /></div>
                <div className="font-bold text-purple-400 text-xs">Nucleus</div>
              </div>

              {/* Entanglement */}
              <div className="bg-gradient-to-br from-cyan-900/50 to-cyan-800/40 border-2 border-cyan-500/50 rounded p-2 text-center">
                <div className="flex justify-center text-cyan-400"><Icon name="link" className="w-7 h-7" /></div>
                <div className="font-bold text-cyan-400 text-xs">Entanglement</div>
              </div>

              {/* Multiverse */}
              <div className="bg-gradient-to-br from-indigo-900/50 to-indigo-800/40 border-2 border-indigo-500/50 rounded p-2 text-center">
                <div className="flex justify-center text-indigo-400"><Icon name="network" className="w-7 h-7" /></div>
                <div className="font-bold text-indigo-400 text-xs">Multiverse</div>
              </div>
            </div>

            {/* Arrow 3: Convergence */}
            <div className="flex justify-center mb-3">
              <svg className="w-5 h-6 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>

            {/* Level 4: Verdict Box */}
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 border-2 border-teal-500/50 rounded-lg px-6 py-2 w-full max-w-sm text-center">
                <div className="text-base font-black text-white">Multiverse Verdict</div>
                <div className="text-xs text-slate-300">Risk Assessment & Action</div>
              </div>
            </div>

            {/* Arrow 4: Results */}
            <div className="flex justify-center mb-3">
              <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-teal-500/40 to-transparent rounded-full max-w-sm"></div>
            </div>

            {/* Level 5: Verdicts */}
            <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
              {/* Allow */}
              <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/30 border-2 border-green-500/60 rounded p-3 text-center">
                <div className="flex justify-center text-green-400"><Icon name="checkCircle" className="w-8 h-8" /></div>
                <div className="font-bold text-green-400 text-sm">ALLOW</div>
              </div>

              {/* Warn */}
              <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/30 border-2 border-yellow-500/60 rounded p-3 text-center">
                <div className="flex justify-center text-yellow-400"><Icon name="warning" className="w-8 h-8" /></div>
                <div className="font-bold text-yellow-400 text-sm">WARN</div>
              </div>

              {/* Block */}
              <div className="bg-gradient-to-br from-red-900/40 to-red-800/30 border-2 border-red-500/60 rounded p-3 text-center">
                <div className="flex justify-center text-red-400"><Icon name="block" className="w-8 h-8" /></div>
                <div className="font-bold text-red-400 text-sm">BLOCK</div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Nature's Approach Works */}
        <section className="space-y-8">
          <div className="border-l-4 border-teal-500 pl-6 py-4">
            <h2 className="text-3xl font-black text-teal-400">Why Nature's Approach Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-teal-950/30 border-2 border-teal-500/50 rounded-lg p-6">
              <h3 className="font-bold text-teal-400 mb-3">Decentralization</h3>
              <p className="text-slate-300 text-sm leading-relaxed">No central authority. Swarm consensus is resistant to compromise. Even if 30% of nodes are corrupted, the colony adapts.</p>
            </div>
            <div className="bg-teal-950/30 border-2 border-teal-500/50 rounded-lg p-6">
              <h3 className="font-bold text-teal-400 mb-3">Emergent Behavior</h3>
              <p className="text-slate-300 text-sm leading-relaxed">Threats arise from collective voting, not a hardcoded rule. Attackers can't predict what the swarm will decide.</p>
            </div>
            <div className="bg-teal-950/30 border-2 border-teal-500/50 rounded-lg p-6">
              <h3 className="font-bold text-teal-400 mb-3">Unpredictability</h3>
              <p className="text-slate-300 text-sm leading-relaxed">Topology is dynamic. Credentials are contextual and time-bound. Scan patterns rotate. Attackers see a moving target.</p>
            </div>
            <div className="bg-teal-950/30 border-2 border-teal-500/50 rounded-lg p-6">
              <h3 className="font-bold text-teal-400 mb-3">Self-Healing</h3>
              <p className="text-slate-300 text-sm leading-relaxed">Compromised branches are isolated via Multiverse. Rollback via consensus. The system regenerates without manual intervention.</p>
            </div>
          </div>
        </section>

        {/* Conclusion */}
        <section className="space-y-6">
          <div className="border-l-4 border-teal-500 pl-6 py-4">
            <h2 className="text-3xl font-black text-teal-400">Conclusion</h2>
          </div>

          <div className="bg-gradient-to-r from-teal-950/30 to-indigo-950/30 border-2 border-teal-500/30 rounded-lg p-8">
            <p className="text-slate-300 leading-relaxed mb-4">
              GENESIS is a security platform that embraces nature's wisdom: <strong>decentralization, emergent consensus, unpredictability, and self-healing</strong>. By modeling our architecture on biological systems, we create defenses that survive adversarial pressure  -  not because they're unbreakable, but because they're incomprehensibly adaptable.
            </p>
            <p className="text-slate-400 text-sm italic">
              "Nature doesn't build fortresses. It builds ecosystems."
            </p>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="border-t border-teal-500/20 mt-20 py-8 px-6 text-center text-slate-500 text-sm">
        <p>GENESIS Whitepaper v1.0 | September 2026</p>
        <p className="text-xs mt-2">Nature-Inspired Security Architecture</p>
      </div>
    </div>
  );
}
