"use client";

import { Icon } from "@/components/Icon";
import { Genesis } from "@/components/Genesis";

export default function WhitepaperPage() {
  return (
    <article className="min-h-screen bg-[#F3F5F2] text-[#1D2A2A]">
      {/* Header */}
      <header className="border-b border-[#B8C8C3] bg-[#E1E9E5] px-5 py-9 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#A65B3D] sm:mb-6 sm:text-xs">Research note / September 2026</p>
          <h1 className="mb-5 max-w-4xl text-[clamp(1.6rem,6vw,3.6rem)] font-black leading-[1.14] text-[#152626]">
            <Genesis />: Nature-Inspired Security Architecture
          </h1>
          <p className="max-w-3xl text-lg leading-relaxed text-[#465D5A] sm:text-xl">
            A Whitepaper on Decentralized, Emergent, and Self-Healing Defense
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-[#B8C8C3] pt-5">
            <p className="text-sm font-medium text-[#465D5A]">Version 1.0 | September 2026</p>
            <span className="border-l-2 border-[#B06443] pl-3 text-xs font-bold uppercase leading-relaxed text-[#7A452F]">
              Vision &amp; roadmap  -  describes where we're headed, not everything below is live today
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-5xl space-y-16 px-5 py-14 sm:px-8 sm:py-20">

        {/* Design Philosophy */}
        <section className="border-t border-[#B8C8C3] pt-8">
          <div className="grid gap-5 md:grid-cols-[minmax(0,0.4fr)_minmax(0,1fr)] md:gap-10">
            <h2 className="text-2xl font-black text-[#152626]">Our Approach</h2>
            <p className="text-[#465D5A] text-base leading-relaxed sm:text-lg">
              Nature builds resilient systems through <strong>decentralization, emergence, and self-healing</strong>  -  a
              hive survives losing individual bees, an immune system adapts to new threats, an ecosystem recovers after
              damage. <Genesis /> is modeled on those same principles: instead of one gate and one detection model, we're
              building toward a layered, adaptive architecture where no single point of failure can bring the whole
              system down.
            </p>
          </div>
        </section>

        {/* sadhutech product roadmap */}
        <section className="space-y-6 border-t border-[#B8C8C3] pt-8">
          <div className="grid gap-4 md:grid-cols-[minmax(0,0.4fr)_minmax(0,1fr)] md:gap-10">
            <h2 className="text-2xl font-black text-[#152626]">The roadmap</h2>
            <p className="text-[#465D5A]">
              <Genesis />  -  for crypto  -  is live today across two surfaces; everything else is where the same
              philosophy goes next.
            </p>
          </div>
          <div className="grid border-t border-[#B8C8C3] sm:grid-cols-2">
            <div className="space-y-1 border-b border-[#B8C8C3] py-5 sm:pr-6">
              <p className="text-xs font-bold uppercase text-[#08776D]">Live</p>
              <h3 className="font-bold text-[#152626]"><Genesis /> Check &amp; <Genesis /> Extension</h3>
              <p className="text-[#465D5A] text-sm">Web checker (free + Pro) and a browser extension for real-time verdicts with any wallet.</p>
            </div>
            <div className="space-y-1 border-b border-[#B8C8C3] py-5 sm:border-l sm:pl-6">
              <p className="text-xs font-bold uppercase text-[#A65B3D]">Next</p>
              <h3 className="font-bold text-[#152626]"><Genesis /> Wallet Guard</h3>
              <p className="text-[#465D5A] text-sm">Automatic protection built into any wallet or browser, not just MetaMask.</p>
            </div>
            <div className="space-y-1 border-b border-[#B8C8C3] py-5 sm:pr-6">
              <p className="text-xs font-bold uppercase text-[#667A76]">Planned</p>
              <h3 className="font-bold text-[#152626]">Mobile &amp; laptop protection</h3>
              <p className="text-[#465D5A] text-sm">The same pre-action firewall model, applied to phones and computers.</p>
            </div>
            <div className="space-y-1 border-b border-[#B8C8C3] py-5 sm:border-l sm:pl-6">
              <p className="text-xs font-bold uppercase text-[#667A76]">Planned</p>
              <h3 className="font-bold text-[#152626]">SaaS protection</h3>
              <p className="text-[#465D5A] text-sm">Catching risky OAuth grants and integrations across your team's apps.</p>
            </div>
          </div>
          <a href="/products" className="inline-block text-[#08776D] hover:text-[#152626] hover:underline text-sm font-semibold">
            See the products page →
          </a>
        </section>

        {/* 4 Pillars */}
        <section className="space-y-8 border-t border-[#B8C8C3] pt-8">
          <div className="max-w-3xl">
            <h2 className="mb-2 text-2xl font-black text-[#152626]">The Solution: 4 Natural Pillars</h2>
            <p className="text-[#465D5A]"><Genesis /> implements four mechanisms from nature, using cryptography and distributed systems.</p>
          </div>

          {/* Pillar 1: Hive */}
          <div className="space-y-4 border-t border-[#B8C8C3] pt-6">
            <div className="flex items-center gap-4">
              <div className="text-[#A65B3D]"><Icon name="users" className="w-8 h-8" /></div>
              <div>
                <h3 className="text-xl font-bold text-[#152626]">Hive: Emergent Swarm Detection</h3>
                <p className="text-sm text-[#667A76]">No single decision-maker; consensus from the colony</p>
              </div>
            </div>
            <div className="space-y-2 pl-12 text-sm leading-relaxed text-[#465D5A]">
              <p><strong>How it works:</strong> Independent nodes analyze a transaction. Threats emerge from quorum voting, not a central algorithm.</p>
              <p><strong>Why it's resilient:</strong> Compromise one node, others still vote. Compromise 33%, consensus holds. Unpredictable decision topology.</p>
              <p><strong>Engineering:</strong> Threshold signatures, Byzantine consensus, Sybil-resistant threat feeds</p>
            </div>
          </div>

          {/* Pillar 2: Nucleus */}
          <div className="space-y-4 border-t border-[#B8C8C3] pt-6">
            <div className="flex items-center gap-4">
              <div className="text-[#08776D]"><Icon name="atom" className="w-8 h-8" /></div>
              <div>
                <h3 className="text-xl font-bold text-[#152626]">Nucleus: Layered Atomic Protection</h3>
                <p className="text-sm text-[#667A76]">Concentric rings around the crown jewels</p>
              </div>
            </div>
            <div className="space-y-2 pl-12 text-sm leading-relaxed text-[#465D5A]">
              <p><strong>How it works:</strong> Critical assets (keys, permits, approvals) are wrapped in nested validation layers. Each layer is independent.</p>
              <p><strong>Why it's resilient:</strong> Bypass layer 1, you hit layer 2. Each layer has its own entropy and keypair. Attacker can't prepare a single universal exploit.</p>
              <p><strong>Engineering:</strong> Atomic transactions, key derivation, multi-sig quorum at each layer</p>
            </div>
          </div>

          {/* Pillar 3: Entanglement Fabric */}
          <div className="space-y-4 border-t border-[#B8C8C3] pt-6">
            <div className="flex items-center gap-4">
              <div className="text-[#08776D]"><Icon name="link" className="w-8 h-8" /></div>
              <div>
                <h3 className="text-xl font-bold text-[#152626]">Entanglement Fabric: Quantum-Safe Trust</h3>
                <p className="text-sm text-[#667A76]">Unclonable bonds between participants</p>
              </div>
            </div>
            <div className="space-y-2 pl-12 text-sm leading-relaxed text-[#465D5A]">
              <p><strong>How it works:</strong> Trust relationships are established via PQC (post-quantum cryptography) and contextual binding. Credentials are tied to session state, not replayable.</p>
              <p><strong>Why it's resilient:</strong> Steal a certificate, it's useless without the context. Replay a transaction, entropy has changed. Post-quantum cryptography is designed to resist attacks from quantum computers, not just classical ones.</p>
              <p><strong>Engineering:</strong> CRYSTALS-Kyber/Dilithium, session-scoped contexts, entropy mixing</p>
            </div>
          </div>

          {/* Pillar 4: Multiverse */}
          <div className="space-y-4 border-t border-[#B8C8C3] pt-6">
            <div className="flex items-center gap-4">
              <div className="text-[#A65B3D]"><Icon name="network" className="w-8 h-8" /></div>
              <div>
                <h3 className="text-xl font-bold text-[#152626]">Multiverse: Deception & Self-Healing</h3>
                <p className="text-sm text-[#667A76]">Parallel universes for containment and rollback</p>
              </div>
            </div>
            <div className="space-y-2 pl-12 text-sm leading-relaxed text-[#465D5A]">
              <p><strong>How it works:</strong> When anomalies are detected, the session forks. User gets a decoy environment; attacker navigates a controlled labyrinth.</p>
              <p><strong>Why it's resilient:</strong> Attacker wastes resources in the decoy. Legitimate sessions roll back cleanly. Self-healing via retroactive consensus.</p>
              <p><strong>Engineering:</strong> Fork-on-risk, decoy honeypot generation, rollback journals, consensus-driven healing</p>
            </div>
          </div>
        </section>

        {/* Use Case Flow */}
        <section className="space-y-8 border-t border-[#B8C8C3] pt-8">
          <div>
            <h2 className="text-2xl font-black text-[#152626]">Use Case: Transaction Analysis</h2>
          </div>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-4 sm:gap-6">
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#08776D] font-bold text-white">1</div>
                <div className="mt-2 h-12 w-px bg-[#B8C8C3]"></div>
              </div>
              <div className="min-w-0 flex-1 border-t border-[#B8C8C3] py-3">
                <h3 className="mb-2 font-bold text-[#152626]">User submits transaction</h3>
                <p className="text-sm text-[#465D5A]">Wallet sends calldata to <Genesis />. No private keys leave the device.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4 sm:gap-6">
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#A65B3D] font-bold text-white">2</div>
                <div className="mt-2 h-12 w-px bg-[#B8C8C3]"></div>
              </div>
              <div className="min-w-0 flex-1 border-t border-[#B8C8C3] py-3">
                <h3 className="mb-2 font-bold text-[#152626]">Hive votes on risk</h3>
                <p className="text-sm text-[#465D5A]">Swarm of independent nodes analyzes the calldata. Quorum determines severity: INFO, MEDIUM, HIGH, CRITICAL.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4 sm:gap-6">
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#08776D] font-bold text-white">3</div>
                <div className="mt-2 h-12 w-px bg-[#B8C8C3]"></div>
              </div>
              <div className="min-w-0 flex-1 border-t border-[#B8C8C3] py-3">
                <h3 className="mb-2 font-bold text-[#152626]">Nucleus evaluates privilege</h3>
                <p className="text-sm text-[#465D5A]">If risky, Nucleus checks: Is this a critical asset? Is the user authorized? Are the amounts reasonable?</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4 sm:gap-6">
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#A65B3D] font-bold text-white">4</div>
                <div className="mt-2 h-12 w-px bg-[#B8C8C3]"></div>
              </div>
              <div className="min-w-0 flex-1 border-t border-[#B8C8C3] py-3">
                <h3 className="mb-2 font-bold text-[#152626]">Entanglement Fabric validates trust</h3>
                <p className="text-sm text-[#465D5A]">Session context is checked. Credentials verified against quantum-safe bonds. No replay attacks possible.</p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex gap-4 sm:gap-6">
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#08776D] font-bold text-white">5</div>
              </div>
              <div className="min-w-0 flex-1 border-t border-[#B8C8C3] py-3">
                <h3 className="mb-2 font-bold text-[#152626]">Multiverse renders verdict</h3>
                <p className="text-sm text-[#465D5A]"><strong>ALLOW:</strong> Safe to sign. <strong>WARN:</strong> Risky but not malicious. <strong>BLOCK:</strong> Likely exploit; fork to decoy universe.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Architecture Diagram */}
        <section className="space-y-6 border-t border-[#B8C8C3] pt-8">
          <h2 className="text-2xl font-black text-[#152626]">High-Level Architecture</h2>
          <details className="group border-y border-[#B8C8C3]">
            <summary className="flex cursor-pointer items-center justify-between py-4 text-sm font-bold text-[#08776D] focus-visible:outline-2 focus-visible:outline-[#08776D]">View proposed architecture diagram <span aria-hidden="true" className="transition-transform group-open:rotate-90">→</span></summary>
          <div className="overflow-x-auto rounded-md bg-[#152626] p-4">
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
                <div className="text-base font-black text-teal-300 flex items-center justify-center gap-2"><Icon name="bolt" className="w-5 h-5" /> <Genesis /> Gate</div>
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
          </details>
        </section>

        {/* Why Nature's Approach Works */}
        <section className="space-y-8 border-t border-[#B8C8C3] pt-8">
          <h2 className="text-2xl font-black text-[#152626]">Why Nature's Approach Works</h2>

          <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
            <div className="border-t border-[#B8C8C3] pt-5">
              <h3 className="mb-3 font-bold text-[#152626]">Decentralization</h3>
              <p className="text-sm leading-relaxed text-[#465D5A]">No central authority. Swarm consensus is resistant to compromise. Even if 30% of nodes are corrupted, the colony adapts.</p>
            </div>
            <div className="border-t border-[#B8C8C3] pt-5">
              <h3 className="mb-3 font-bold text-[#152626]">Emergent Behavior</h3>
              <p className="text-sm leading-relaxed text-[#465D5A]">Threats arise from collective voting, not a hardcoded rule. Attackers can't predict what the swarm will decide.</p>
            </div>
            <div className="border-t border-[#B8C8C3] pt-5">
              <h3 className="mb-3 font-bold text-[#152626]">Unpredictability</h3>
              <p className="text-sm leading-relaxed text-[#465D5A]">Topology is dynamic. Credentials are contextual and time-bound. Scan patterns rotate. Attackers see a moving target.</p>
            </div>
            <div className="border-t border-[#B8C8C3] pt-5">
              <h3 className="mb-3 font-bold text-[#152626]">Self-Healing</h3>
              <p className="text-sm leading-relaxed text-[#465D5A]">Compromised branches are isolated via Multiverse. Rollback via consensus. The system regenerates without manual intervention.</p>
            </div>
          </div>
        </section>

        {/* Conclusion */}
        <section className="space-y-6 border-t border-[#B8C8C3] pt-8">
          <h2 className="text-2xl font-black text-[#152626]">Conclusion</h2>

          <div className="border-l-2 border-[#A65B3D] pl-5 sm:pl-7">
            <p className="mb-4 leading-relaxed text-[#465D5A]">
              <Genesis /> is a security platform that embraces nature's wisdom: <strong>decentralization, emergent consensus, unpredictability, and self-healing</strong>. By modeling our architecture on biological systems, we create defenses that survive adversarial pressure  -  not because they're unbreakable, but because they're incomprehensibly adaptable.
            </p>
            <p className="text-sm italic text-[#667A76]">
              "Nature doesn't build fortresses. It builds ecosystems."
            </p>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="border-t border-[#B8C8C3] px-5 py-8 text-center text-sm text-[#667A76] sm:px-8">
        <p><Genesis /> Whitepaper v1.0 | September 2026</p>
        <p className="text-xs mt-2">Nature-Inspired Security Architecture</p>
      </div>
    </article>
  );
}
