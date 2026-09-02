# Integration — How the Planes Mingle

GENESIS is not four products bolted together; it is one organism. The **Entanglement
Fabric** is the connective tissue, the **portable agent runtime** is the shared body,
and the three planes are organs that reinforce one another through a single closed loop:
**sense → decide → enforce → heal.**

## The organism model

| Plane | Biological analogue | Contribution |
|-------|--------------------|--------------|
| Nucleus | Cell nucleus / DNA | Protects the core; identity & structure (depth) |
| Hive | Immune swarm / nervous system | Senses everywhere; decides collectively (breadth) |
| Multiverse | Regeneration / alternate outcomes | Deceives and heals (resilience) |
| Entanglement Fabric | Bloodstream / signaling | Carries trust safely across the whole body |

## Why integration is nearly free

- **One agent binary** (Rust + WASM) plays either role — Hive **forager** or Nucleus
  **electron** — via a role plug-in. Same code, same identity, deployed once.
- **One identity/trust layer.** Every component roots identity in the Entanglement
  Fabric and must pass attestation to participate.
- **Mutual dependency, by design.** The Nucleus vault *is* the root of trust the Hive
  Queen uses; the Queen's re-election authenticates against it. Neither is complete
  alone.

## The closed loop

```mermaid
sequenceDiagram
    participant Nu as Nucleus
    participant W as Hive · Waggle bus
    participant Q as Hive · Quorum
    participant Mv as Multiverse
    participant Rz as Response
    Nu->>W: ionization (charge-imbalance) signal
    W->>Q: waggle-recruit agents; corroborate
    Q->>Q: N-of-M agreement within Δt
    Q-->>Mv: confirmed hostile → fork session into decoy universe
    Q-->>Rz: propolis isolate · decay rotate · fission contain
    Mv-->>Rz: compromised branch → rollback to clean timeline
    Rz-->>Nu: drop privilege shell · force re-attestation
```

Key properties this produces:

1. **Emergent verdicts.** No single model declares a threat; a quorum of independent
   agents must agree — structural false-positive suppression.
2. **Layered, automatic response.** Isolate (propolis), rotate (decay), fork (decoy),
   roll back — no human required.
3. **No safe foothold for the attacker.** Even a "successful" breach lands in a decoy
   universe with universe-bound credentials that work nowhere else.

## Signal flows between planes

| From → To | Signal | Effect |
|-----------|--------|--------|
| Nucleus → Hive | Ionization score (photon) | Seeds waggle-bus corroboration |
| Hive → Nucleus | Quorum verdict | Shell drop, decay rotation, fission |
| Hive → Multiverse | Confirmed hostile session | Fork into decoy; harvest TTPs |
| Multiverse → Hive | Divergence vote, TTP intel | Feeds quorum + threat model |
| Multiverse → Nucleus | Branch rollback outcome | Restore clean state |
| Fabric → all | Attestation, PQC, monogamy | Trust admission for every action |
| Hive scouts → Nucleus | Newly discovered asset | Auto-register as a protected atom |
| Sutra (Ashwamedha) → Hive | Contested edge on a link | Recruit the swarm ("the following army") |
| Hive quorum → Sutra | Confirmed threat | Switch mesh to Chakravyuha formation; funnel to decoy |

## Unified asset graph

One graph, three lenses:

- An asset is an **atom** (Nucleus: what to protect).
- Atoms **bond** into **molecules** — trusted service meshes (Nucleus bonding registry).
- Those molecules are the **flowers** the Hive swarm forages across (Hive).
- The **links** between them are walked and certified by the **Ashwamedha Sweep** and
  routed through the **Chakravyuha Mesh** (Sutra connective layer).
- Any of them can be **forked** into a universe branch (Multiverse).

---

## Real-world use cases (end-to-end)

### 1. Multi-tenant SaaS — automatic breach containment *(the MVP wedge)*
Per-tenant Nucleus vaults hold PII/tokens. A Hive forager finds an exposed endpoint or
leaked token → waggle recruitment → quorum confirms → the attacker session is **forked
into a decoy universe** (prime untouched), Nucleus **decay** rotates every related
secret, and **propolis** isolates the affected service. The stolen token is
universe-bound and useless. No human in the loop.

### 2. Fintech payments
Shell-model least privilege guards the payment service; **entangled tokens** catch
cross-region replay; the swarm detects lateral movement before it reaches the nucleus;
suspicious transactions are **shadow-executed** before touching the prod ledger.

### 3. Ransomware / lateral movement
Lévy-flight scouts spot anomalous east-west traffic → quorum → **fission** isolates the
host, **decay** revokes credentials, and per-session **universes** cap the blast radius;
the compromised branch is **rolled back**.

### 4. Supply chain / CI-CD
Build artifacts are atoms; a tampered artifact becomes **ionized** and is quarantined
pre-deploy; new builds are validated across **N universes** and rejected on divergence.

### 5. IoT / OT (physical + cloud)
WASM foragers run on edge devices/PLCs; Nucleus **spin** dual-control ensures no single
compromised node can issue a critical command; authorization is **teleported** (PAKE)
so the secret never crosses the wire.

### 6. Zero-trust workforce
Shell **step-up** auth; an impossible-travel anomaly raises **ionization** → the
identity dynamically **drops a shell** (loses privilege) in real time.

### 7. Insider threat
**Ionization** scoring on privilege accumulation + swarm **quorum** on behavioral drift;
risky actions are **shadow-executed** and rolled back if malicious.

### 8. Rogue link discovered and attacker trapped *(Sutra end-to-end)*
A full walk of the connective layer, showing Ashwamedha + Chakravyuha in action:

1. The Queen **consecrates an Ashwa** (roaming attestation token) and releases it to walk
   the estate's links on a Lévy-random route.
2. At each hop, nodes **co-sign** the edge — until the Ashwa reaches a link where a rogue
   proxy (an unauthorized MITM) sits. The rogue **cannot produce a valid co-signature**
   (it fails Entanglement Fabric attestation) → the Ashwa reports a **contested edge**.
3. The Queen dispatches **"the following army"**: Hive foragers swarm the segment (waggle
   recruitment), Nucleus **ionization** confirms a charge imbalance, and **quorum**
   confirms compromise.
4. The quorum verdict switches the **Chakravyuha Mesh** into containment **formation**.
   The hostile session is funneled inward (easy-in) into a **Multiverse decoy universe**,
   while the egress rings **rotate** — exfiltration is blocked (hard-out).
5. **Decay** rotates secrets on the affected molecule, **propolis** isolates the rogue
   node, and the decoy branch is later **rolled back**. The epoch **Sovereignty
   Attestation** is withheld until the edge is remediated.
6. The console shows it live: the contested edge, the swarm converging, the formation
   change, and the trapped session in its decoy.

---

See [architecture.md](architecture.md) for the layered stack and
[roadmap.md](roadmap.md) for how these are sequenced into a buildable plan.
