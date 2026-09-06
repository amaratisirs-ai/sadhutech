"use client";

import { useState } from "react";
import { ADMIN_WALLETS } from "@genesis/shared";
import { useWallet } from "@/src/wallet/useWallet";
import { Icon, type IconName } from "@/components/Icon";
import { Mermaid } from "@/src/Mermaid";

const STACK_DIAGRAM = `flowchart TD
    L4["L4 · Console<br/>(planned)"]
    L3["L3 · Hive Mind analytics<br/>(planned)"]
    L2H["Hive<br/>swarm quorum detection"]
    L2N["Nucleus<br/>atomic layered protection"]
    L2M["Multiverse<br/>deception &amp; resilience"]
    L15["L1.5 · Sutra<br/>connective mesh (planned)"]
    L1["L1 · Agent runtime<br/>Rust/WASM/eBPF (planned)"]
    L0["L0 · Entanglement Fabric<br/>quantum-safe trust (planned)"]

    L4 --> L3
    L3 --> L2H
    L3 --> L2N
    L3 --> L2M
    L2H --> L15
    L2N --> L15
    L2M --> L15
    L15 --> L1
    L1 --> L0`;

const REQUEST_FLOW_DIAGRAM = `sequenceDiagram
    participant W as Wallet
    participant C as Client (Site / Extension / Snap)
    participant G as Gate API (Fastify)
    participant I as Community Intel (quorum)
    participant X as External (GoPlus / ChainAbuse)
    W->>C: About to sign a transaction
    C->>G: POST /v1/analyze
    G->>G: decode.ts - parse calldata
    G->>I: look up counterparties
    G->>X: cross-check reputation
    G->>G: rules.ts findings + analyze.ts score
    G-->>C: verdict + plain-English explanation
    C-->>W: allow / warn / block`;

interface Pillar {
  key: string;
  name: string;
  icon: IconName;
  metaphor: string;
  percent: number;
  live: string[];
  planned: string[];
}

const PILLARS: Pillar[] = [
  {
    key: "hive",
    name: "Hive",
    icon: "users",
    metaphor: "A honeybee colony - decentralized, no single detection model. A threat is only confirmed once enough independent agents agree.",
    percent: 55,
    live: [
      "Community threat intel with reporter quorum (intel.ts / intel-postgres.ts)",
      "Curated/trusted entries bypass quorum",
      "GoPlus cross-check on flagged addresses",
      "Risk scoring, verdict generation (allow/warn/block)",
      "Plain-English explanation of every verdict",
    ],
    planned: [
      "Forager roles (employed/onlooker/scout) + Lévy-flight scan scheduling",
      "Waggle-dance recruitment bus (gossip between agents)",
      "Queen (Raft leader election + supersedure)",
      "Propolis - automatic quarantine response",
    ],
  },
  {
    key: "nucleus",
    name: "Nucleus",
    icon: "cube",
    metaphor: "An atom: a protected core, privilege tiers as electron shells, and step-up auth as quantized transitions.",
    percent: 35,
    live: [
      "Approval-pattern detection: unlimited allowance, setApprovalForAll, permit/Permit2 (rules.ts)",
      "Asset-movement and counterparty detection",
      "Severity scoring feeds directly into the block/warn/allow verdict",
    ],
    planned: [
      "Shell access engine (ABAC/ReBAC) with quantized step-up",
      "Decay engine - credentials auto-rotate on a half-life",
      "Vault / TEE / KMS root of trust",
      "Formal 'ionization' anomaly analyzer (today this is implicit in findings, not a standalone signal)",
    ],
  },
  {
    key: "entanglement",
    name: "Entanglement Fabric",
    icon: "sparkles",
    metaphor: "Quantum entanglement as a metaphor for unclonable, tamper-evident trust between two endpoints.",
    percent: 5,
    live: ["Shared type/constant definitions only (packages/shared) - no crypto implementation yet"],
    planned: [
      "Remote attestation ('Bell test') before two endpoints trust each other",
      "Hardware-bound keys (TPM / Secure Enclave / PUF) - stolen tokens are useless off-device",
      "Tamper-evident authenticated channels",
      "Post-quantum transport (hybrid Kyber/Dilithium)",
    ],
  },
  {
    key: "multiverse",
    name: "Multiverse",
    icon: "globe",
    metaphor: "Branching realities: risky sessions get diverted into decoy copies of the system while the real one stays safe.",
    percent: 0,
    live: [],
    planned: [
      "Decoy universes seeded with honeytokens for hostile sessions",
      "Shadow/speculative execution of borderline-risky requests",
      "N-version divergence detection (benign = identical behavior across copies)",
      "Checkpoint + rollback to the last clean state",
    ],
  },
  {
    key: "sutra",
    name: "Sutra (connective layer)",
    icon: "link",
    metaphor: "The links binding the other planes together - named after two Mahabharata-inspired mechanisms.",
    percent: 5,
    live: ["\"Chakravyuha pre-sign gate\" exists only as a name for today's MVP gate, not the rotating containment mesh"],
    planned: [
      "Ashwamedha Sweep - a roaming attestation token that proves estate-wide link integrity",
      "Chakravyuha Mesh - rotating containment rings, easy to enter, hard to exit for an intruder",
    ],
  },
];

const TOOLS = [
  { pkg: "packages/gate", purpose: "Pre-sign risk API (decode → rules → score → verdict)", tech: "Fastify, TypeScript, viem, Postgres (pg), Vitest" },
  { pkg: "packages/site", purpose: "Public web app - checker, pricing, admin, docs", tech: "Next.js 16, React 19, Tailwind, wagmi/Reown AppKit" },
  { pkg: "packages/snap", purpose: "MetaMask Snap - in-wallet verdict rendering", tech: "MetaMask Snaps SDK" },
  { pkg: "packages/extension", purpose: "Browser extension - any wallet, real-time popups", tech: "Manifest V3, content scripts" },
  { pkg: "packages/wc-middleware", purpose: "WalletConnect session middleware", tech: "TypeScript" },
  { pkg: "packages/shared", purpose: "Shared types, constants, SDK client", tech: "TypeScript (no runtime deps)" },
];

const ROADMAP: { theme: string; items: string[] }[] = [
  {
    theme: "Nucleus (data-centric protection)",
    items: [
      "Vault (TEE/KMS) + root of trust",
      "Shell access engine (ABAC/ReBAC) with quantized step-up",
      "Decay engine for automatic credential rotation",
      "Dual-control ('spin') for sensitive operations",
    ],
  },
  {
    theme: "Hive (swarm detection & response)",
    items: [
      "Full forager state machine (employed/onlooker/scout) + Lévy-flight scan scheduling",
      "Waggle-bus recruitment and pheromone decay",
      "Queen (Raft leader election) + guard-bee zero-trust gateway",
      "Propolis - automatic quarantine action wired to quorum",
    ],
  },
  {
    theme: "Multiverse (deception & resilience)",
    items: [
      "Ephemeral micro-VM decoy universes seeded with honeytokens",
      "Shadow/speculative execution for borderline-risky requests",
      "N-version divergence voting wired into Hive quorum",
      "Checkpoint/rollback self-healing",
    ],
  },
  {
    theme: "Entanglement Fabric (quantum-safe trust)",
    items: [
      "Remote attestation + hardware-bound key enrollment",
      "Entangled, tamper-evident token pairs",
      "Post-quantum hybrid transport (Kyber/Dilithium)",
      "Threshold signing / entanglement swapping for federation",
    ],
  },
  {
    theme: "Near-term production hardening",
    items: [
      "External security audit",
      "Expanded real-time threat feed integrations (beyond GoPlus/ChainAbuse)",
      "Cross-chain coverage beyond the 5 EVM chains supported today",
      "SLA documentation, monitoring & alerting for the gate API",
    ],
  },
];

const THREAT_MODEL = {
  inScope: [
    "Drainer contracts and unlimited/hidden approvals (setApprovalForAll, permit, Permit2)",
    "Known-malicious counterparties (community-reported + GoPlus/ChainAbuse cross-check)",
    "Deceptive calldata a wallet UI wouldn't otherwise decode for the user",
  ],
  outOfScope: [
    "Custodial exchange transfers (Robinhood, Coinbase exchange, Binance, Kraken) - no wallet-signing step to screen",
    "Non-EVM chains (Bitcoin, Dogecoin, etc.) - not decoded today",
    "A wallet's own native swap/send screens - not visible to a dapp-facing extension",
    "Physical hardware extraction, supply-chain compromise, TEE zero-days",
  ],
};

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
      <div
        className={`h-full rounded-full ${percent >= 50 ? "bg-teal-500" : percent >= 20 ? "bg-amber-500" : "bg-slate-600"}`}
        style={{ width: `${Math.max(4, percent)}%` }}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-teal-500/20 bg-slate-900/60 p-6 space-y-4">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      {children}
    </section>
  );
}

export default function AdminArchitecturePage() {
  const { address, isConnected, connect } = useWallet();
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

  const isAdmin = !!address && ADMIN_WALLETS.has(address.toLowerCase());

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto text-center py-24">
        <h1 className="text-2xl font-black text-white mb-3">Admin · Architecture</h1>
        <p className="text-sm text-slate-300 mb-6">Connect the admin wallet to view this page.</p>
        <button onClick={connect} className="px-5 py-2 rounded-lg bg-teal-500 text-slate-950 font-bold text-sm hover:bg-teal-400 transition">
          Connect Wallet
        </button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto text-center py-24">
        <Icon name="block" className="w-8 h-8 mx-auto text-rose-400 mb-3" />
        <h1 className="text-2xl font-black text-white mb-2">Not authorized</h1>
        <p className="text-sm text-slate-300">This wallet isn&apos;t on the admin list.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <a href="/admin" className="text-xs font-bold text-teal-300 hover:text-teal-100">← Back to Admin</a>
        <h1 className="text-3xl font-black text-white mt-2">Architecture &amp; Design</h1>
        <p className="text-sm text-slate-400 mt-1">
          How GENESIS is built today, how it maps to the nature-inspired vision, and what's left to build. Internal only - not for customer-facing use.
        </p>
      </div>

      <Section title="System architecture (vision layers)">
        <p className="text-sm text-slate-400">
          The long-term design is a layered stack, modeled loosely on natural/physical processes (see docs/WHITEPAPER.md, docs/hive.md,
          docs/nucleus.md, docs/entanglement-fabric.md, docs/multiverse.md, docs/connective-layer.md). Today's live product is the
          Hive + Nucleus slice - a transaction pre-sign gate; everything below L2 is design, not running code yet.
        </p>
        <Mermaid chart={STACK_DIAGRAM} />
      </Section>

      <Section title="MVP request flow (what actually runs today)">
        <p className="text-sm text-slate-400">
          Every check - free or Pro - goes through this exact path in packages/gate/src.
        </p>
        <Mermaid chart={REQUEST_FLOW_DIAGRAM} />
      </Section>

      <Section title="Nature's pillars: vision vs. reality">
        <p className="text-sm text-slate-400">
          % = concrete sub-capabilities shipped in code today, out of the sub-capabilities each pillar's concept doc describes.
          This is an internal planning estimate, not a customer-facing claim - see AGENTS.md honesty rules.
        </p>
        <div className="space-y-4">
          {PILLARS.map((p) => {
            const expanded = expandedPillar === p.key;
            return (
              <div key={p.key} className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                <button
                  type="button"
                  onClick={() => setExpandedPillar(expanded ? null : p.key)}
                  className="w-full flex items-center justify-between gap-4 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon name={p.icon} className="w-6 h-6 text-teal-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-white">{p.name}</p>
                      <p className="text-xs text-slate-400 truncate">{p.metaphor}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-black text-white w-10 text-right">{p.percent}%</span>
                    <Icon name={expanded ? "check" : "bolt"} className="w-4 h-4 text-slate-500" />
                  </div>
                </button>
                <div className="mt-3">
                  <ProgressBar percent={p.percent} />
                </div>
                {expanded && (
                  <div className="mt-4 grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-emerald-300 mb-1.5">Live today</p>
                      {p.live.length === 0 ? (
                        <p className="text-xs text-slate-500">Nothing shipped yet.</p>
                      ) : (
                        <ul className="space-y-1 text-slate-300 text-xs list-disc list-inside">
                          {p.live.map((l) => <li key={l}>{l}</li>)}
                        </ul>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-amber-300 mb-1.5">Planned</p>
                      <ul className="space-y-1 text-slate-300 text-xs list-disc list-inside">
                        {p.planned.map((l) => <li key={l}>{l}</li>)}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Tools &amp; tech stack">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-slate-500 uppercase text-xs tracking-wide">
                <th className="py-2 pr-4">Package</th>
                <th className="py-2 pr-4">Purpose</th>
                <th className="py-2">Key tech</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {TOOLS.map((t) => (
                <tr key={t.pkg} className="border-t border-slate-800">
                  <td className="py-2 pr-4 font-mono text-xs text-white whitespace-nowrap">{t.pkg}</td>
                  <td className="py-2 pr-4">{t.purpose}</td>
                  <td className="py-2 text-xs text-slate-400">{t.tech}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Future enhancements to the security model">
        <div className="grid sm:grid-cols-2 gap-4">
          {ROADMAP.map((group) => (
            <div key={group.theme} className="rounded-lg border border-slate-700 bg-slate-800/40 p-4">
              <p className="font-semibold text-white text-sm mb-2">{group.theme}</p>
              <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                {group.items.map((i) => <li key={i}>{i}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Threat model snapshot">
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold text-emerald-300 mb-1.5">In scope</p>
            <ul className="space-y-1 text-slate-300 text-xs list-disc list-inside">
              {THREAT_MODEL.inScope.map((i) => <li key={i}>{i}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-rose-300 mb-1.5">Out of scope</p>
            <ul className="space-y-1 text-slate-300 text-xs list-disc list-inside">
              {THREAT_MODEL.outOfScope.map((i) => <li key={i}>{i}</li>)}
            </ul>
          </div>
        </div>
        <p className="text-xs text-slate-500 border-t border-slate-800 pt-3">
          Note: a paid GoPlus tier only raises the request quota (CU) for chains/APIs we already call by chain_id (EVM) - it
          doesn't add non-EVM support. Bitcoin/Dogecoin aren't UTXO-decodable by decode.ts today because they have no ABI
          calldata to parse at all; adding them is a separate decoder, not a billing upgrade.
        </p>
      </Section>

      <Section title="Why this design">
        <p className="text-sm text-slate-300 leading-relaxed">
          Individual pillars have prior art elsewhere - autonomous ML response (Darktrace), decentralized threat-intel sharing
          (CrowdSec, MISP), deception (Thinkst Canary, Illusive), moving-target defense (Morphisec), eBPF runtime sensing
          (Cilium/Tetragon, Falco), micro-VM isolation (Firecracker, gVisor). What none of them do is bind detection, protection,
          trust, and deception into one system with no mandatory central control. Today's shipped slice (Hive quorum + Nucleus
          approval detection) already gets the low-false-positive benefit of requiring independent corroboration rather than a
          single tuned model - the rest of the roadmap extends that same principle to identity, session trust, and live-session
          resilience.
        </p>
      </Section>
    </div>
  );
}
