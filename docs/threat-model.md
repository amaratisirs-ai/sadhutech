# Threat Model

This document defines what GENESIS protects, whom it defends against, and *why the
nature-modeled design produces security properties that centralized products cannot*.

## Assets

| Asset | Where | Protected by |
|-------|-------|--------------|
| Crown-jewel data (PII, secrets, keys) | Nucleus vault, prime universe | Nucleus shells, TEE/KMS |
| Workload identity & credentials | Entanglement Fabric | Unclonable, monogamous, attested tokens |
| Detection integrity (verdicts) | Hive quorum | Emergent N-of-M consensus |
| Control plane (the Queen) | Hive | Raft + supersedure, attestation |
| Telemetry & intelligence (honey) | Comb | Hex isolation, PQC transport |
| Production availability | Multiverse | Decoy diversion, branch rollback |

## Adversary model

We assume a capable, adaptive adversary who may:

- Enumerate and probe the external attack surface (APIs, hosts, cloud config).
- Steal credentials/tokens (phishing, leakage, memory scraping).
- Achieve code execution on a workload and attempt lateral movement.
- Attempt man-in-the-middle / replay on internal traffic.
- Attempt to identify, evade, or disable security agents.
- Attempt to compromise the control plane directly.
- "Harvest now, decrypt later" — capture traffic for future quantum decryption.
- Be an **insider** with legitimate but excessive/abused privilege.

Out of scope for the MVP: physical extraction of hardware secure elements; supply-chain
compromise of the underlying hardware/firmware root of trust; nation-state zero-days in
the TEE itself.

---

## STRIDE analysis

| Threat | Attack | GENESIS mitigation |
|--------|--------|--------------------|
| **Spoofing** | Fake agent / impersonated identity | Entanglement Fabric **attestation** (Bell test); a spoofed forager/electron fails to join |
| **Tampering** | Modify traffic / poison telemetry | **Tamper-evident** PQC channels; **quorum** requires many independent corroborations, so one poisoned probe cannot fabricate a verdict |
| **Repudiation** | Deny an action | Attested identities + append-only honey/event log |
| **Information disclosure** | Steal data / tokens | **Unclonable, monogamous** tokens (useless off-device); crown jewels only in prime universe; a breach lands in a **decoy** |
| **Denial of service** | Kill the control plane / agents | **No SPOF**: Queen **supersedure**; swarm degrades gracefully as agents drop |
| **Elevation of privilege** | Escalate access | **Quantized** shell transitions with selection rules; **ionization** flags charge imbalance; step-up required |

---

## Why the design wins (properties)

### 1. No single point of failure
Centralized products have one control plane and one detection model — a single target.
GENESIS re-elects its Queen (supersedure/Raft) and derives verdicts from an emergent
**quorum**. Removing any one node degrades but does not defeat the system.

### 2. Structural false-positive suppression
A verdict requires **distinct** agents to agree within a window ($\ge \Theta$). An
attacker must fool many independent probes simultaneously — far harder than evading one
tuned model — and benign noise rarely crosses quorum.

### 3. Genuine moving target
Lévy-flight scan scheduling (Hive), randomized enforcement placement (Nucleus/Heisenberg
MTD), and universe forking (Multiverse) mean the defended system is never in a fully
observable, predictable state. The attacker cannot build a reliable model to route
around.

### 4. Breaches land in a decoy
Even a *successful* intrusion is diverted into a **decoy universe** with honeytokens and
universe-bound credentials. The attacker burns effort in a fake reality, reveals TTPs,
and gains nothing usable against prime.

### 5. Self-healing containment
Response is automatic and layered — **propolis** isolation, **decay** rotation,
**fission** containment, branch **rollback** — shrinking dwell time and blast radius
without waiting on human responders.

### 6. Quantum-safe
Post-quantum crypto throughout defeats "harvest now, decrypt later"; unclonable,
attested identities defeat credential theft and MITM.

---

## Residual risks & assumptions

- **Hardware root of trust** (TPM/TEE/PUF) is assumed sound; its compromise undermines
  attestation and monogamy.
- **Decoy fidelity** must be high enough that an attacker cannot trivially distinguish a
  decoy from prime; imperfect mirrors risk tipping off sophisticated adversaries.
- **Quorum tuning** ($\Theta$, $\Delta t$) trades detection latency vs. false positives;
  mis-tuning either starves detection or floods it.
- **Agent coverage** — assets with no forager/electron present are unmonitored; scout
  discovery reduces but does not eliminate blind spots.
- **Cost** — per-session universes and N-version execution consume resources; policy
  must gate when forking is warranted.

These are tracked as explicit design constraints in [roadmap.md](roadmap.md).
