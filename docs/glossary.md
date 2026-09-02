# Glossary — Nature ↔ Security Mapping

Every GENESIS concept maps a natural/physical process to a concrete security meaning
and a real implementation primitive. This glossary is the canonical reference; each
plane doc expands on its own rows.

---

## Hive (honeybee colony)

| Nature | Security meaning | Real primitive |
|--------|------------------|----------------|
| Hexagonal comb | Cellular, compartmentalized storage; blast-radius isolation | Sharded/partitioned store, logical hex topology |
| Forager bee | Autonomous agent traveling to an asset to collect telemetry | Rust+WASM agent + flower adapter |
| Flower | A target asset (API, host, cloud account, DB, device) | Adapter-defined probe target |
| Nectar → honey | Raw telemetry refined into enriched intelligence | Ingest → enrich pipeline |
| Employed bee (ABC) | Agent assigned to a known asset (exploitation) | Scheduled monitor |
| Onlooker bee (ABC) | Agent that picks targets by risk/value (probabilistic) | Fitness-weighted selection |
| Scout bee (ABC) | Agent doing random discovery of unknown/shadow assets | Lévy-flight scanner |
| Abandonment | Dropping an exhausted source with no new findings | Counter-based reassignment |
| Lévy-flight foraging | Randomized scan order/timing → moving target | MTD scheduler (heavy-tailed steps) |
| Waggle dance | Recruiting agents to a high-value find | Gossip pub/sub recruitment |
| Pheromone / stigmergy | Shared risk marker on an asset that decays over time | Deposit + exponential decay score |
| Quorum sensing | Collective threat verdict; N-of-M agreement | Distributed consensus verdict |
| The Queen | Resilient control plane / root of trust | Raft leader + policy + KMS |
| Supersedure | Replacing an underperforming/compromised leader | Leader re-election |
| Guard bee | Identity check at every boundary | Zero-trust gateway (mTLS/SPIFFE) |
| Propolis | Sealing/quarantining an infection | Workload isolation action |
| Hygienic behavior | Removing infected larvae; auto-remediation | Automated remediation hook |
| Nurse bee | Colony health monitoring | Self-healing/health service |
| Swarming | Auto-scaling; spin-off response swarm | Horizontal agent scaling |
| Drone / honeypot | Decoy | Deception asset |

---

## Nucleus (atomic model)

| Nature | Security meaning | Real primitive |
|--------|------------------|----------------|
| Nucleus | Crown-jewel data + root secrets | Vault (TEE/HSM/KMS) |
| Strong nuclear force | Tight, short-range internal controls | Confidential computing / enclave |
| Proton (+ charge) | Authoritative identity/authorization assertion | Signed identity claim |
| Neutron | Neutral stabilizer (integrity monitor, redundancy) | Integrity/consistency checker |
| Isotope | Same principal, different context/session | Session/context variant |
| Electron | Policy-enforcement agent orbiting a resource | Identity-aware proxy (PEP) |
| Electron shell / orbital | Privilege tier / trust zone (discrete) | Access tier |
| Quantum jump (photon absorption) | Privilege escalation needs energy = step-up auth | Step-up / MFA challenge |
| Photon emission | Security event/alert as a discrete quantum | Event emission |
| Spin (up/down) | Paired / 2-factor / dual-control state | Dual-control verification |
| Pauli exclusion | No two sessions share a state | Token/session uniqueness |
| Ionization | Charge imbalance = anomaly / instability | Net-charge anomaly score |
| Radioactive decay / half-life | Auto credential/token expiry & rotation | Half-life rotation scheduler |
| Heisenberg uncertainty | Defense state unpredictable | MTD ambiguity |
| Quantum tunneling | Improbable barrier bypass | Boundary-crossing anomaly |
| Fission | Contain/isolate a compromised node | Node isolation |
| Fusion | Correlate weak signals into strong verdict | Signal correlation |
| Valence bonding | Trust federation between services ("molecules") | Service-mesh trust graph |

---

## Entanglement Fabric (quantum entanglement)

| Nature | Security meaning | Real primitive |
|--------|------------------|----------------|
| No-cloning theorem | Credentials that cannot be copied | Hardware-bound keys / PUF / FIDO2 |
| Measurement collapses state | Any interception is detectable | Tamper-evident channel / tripwire token |
| Correlated pair state | Observe one → know the other | Paired HMAC / threshold crypto / MPC |
| Monogamy of entanglement | Session bound to exactly one counterpart | Device/hardware binding |
| Bell-inequality test | Prove a pair is genuinely linked (not MITM) | Remote attestation (TPM/TEE) |
| Entanglement swapping | Chain trust across a mesh via intermediaries | Delegated attestation / federation |
| Quantum teleportation | Move trust without sending the secret | PAKE / OPAQUE / threshold signing |
| Superposition | Posture indeterminate until engaged | MTD ambiguity |
| Decoherence | Trust degrades → forced re-attestation | Trust half-life |
| Quantum-safe | Defeat "harvest now, decrypt later" | PQC (Kyber/Dilithium, NIST) |

---

## Multiverse (parallel universes / many-worlds)

| Nature | Security meaning | Real primitive |
|--------|------------------|----------------|
| Branching reality | Fork the system into parallel realities | Micro-VM fork (Firecracker) |
| Parallel decoy universe | Attacker in an isolated mirror of prod | Per-session VM + honeytokens |
| Speculative / shadow branch | Run risky request in a throwaway branch first | Traffic mirroring (shadow) |
| N-universe divergence | Replicas diverge → compromise detected | N-version execution + voting |
| Per-observer branch | Each session its own universe (containment) | Ephemeral micro-VM per identity |
| Branch rollback / alternate timeline | Discard compromised branch, restore clean | CRIU snapshot + rollback |
| Schrödinger (breached & not) | Attacker can't tell decoy from prime | Indistinguishable mirror envs |
| Prime universe | Golden production state | Canonical timeline |

---

## Sutra (Mahabharata — connective layer: links between planes)

| Source | Security meaning | Real primitive |
|--------|------------------|----------------|
| Ashwamedha horse (Ashwa) | Roaming attestation token released by the Queen | PQC-signed, monogamous nonce token |
| Horse roams freely | Unpredictable walk across the estate's links (MTD) | Lévy-random graph walk |
| Land lets the horse pass | Each hop/edge co-signs the link | Hop-by-hop co-signature + route accumulator |
| A king challenges the horse | A node blocks/tampers/intercepts the token | Contested-edge event |
| The following army | Response converges on the contested edge | Hive swarm (waggle recruitment) |
| Horse returns unchallenged | Estate-wide link trust proven for the epoch | Sovereignty Attestation |
| Chakravyuha (rotating maze) | Layered containment routing between edge and core | Ordered mesh rings |
| Rotating rings | Keys/order/routing reconfigure continuously | Short-lived cert rotation + dynamic routing (MTD) |
| Easy to enter | Permissive, inviting ingress (funnel) | Tarpit / decoy funnel |
| Hard to exit | Egress is the hardened moving target | Egress lockdown / DLP |
| Trapped intruder (Abhimanyu) | Penetrates but cannot exfiltrate | Containment + Multiverse decoy handoff |
| Alternate vyuhas (Padma, Suchi) | Adaptive defensive formations by threat level | Switchable routing/enforcement profiles |

---

## Cross-plane / suite

| Term | Meaning |
|------|---------|
| Prime universe | The single real production environment holding real crown jewels |
| Atom | A single protected asset (Nucleus unit) and node in the asset graph |
| Molecule | A bonded set of atoms = a trusted service / mesh |
| Flower | An atom/molecule as seen by the Hive swarm (a foraging target) |
| Closed loop | ionization → waggle → quorum → fission/decay/fork/rollback |
