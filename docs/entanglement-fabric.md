# Entanglement Fabric — Quantum-Safe Trust Foundation

Modeled on quantum entanglement, implemented with **real, classical, post-quantum-safe
cryptography** — no quantum hardware required. The Fabric is the shared foundation
(L0) that binds every plane across distance: multi-cloud, multi-region, and
physical ↔ cloud. It provides four guarantees to everything above it — **unclonable**
credentials, **tamper-evident** channels, **monogamous** binding, and **attested**
pairing — all over post-quantum crypto.

> **Design rule:** entanglement gives us the *properties* we want; classical primitives
> give us the *implementation*. Every mapping below is buildable today.

## Physics → security → primitive

| Entanglement property | Security guarantee | Real primitive |
|-----------------------|--------------------|----------------|
| **No-cloning theorem** | Credentials that cannot be copied | Hardware-bound keys (TPM/HSM/Secure Enclave), **PUFs**, FIDO2/WebAuthn |
| **Measurement collapses state** | Any interception is detectable | Tamper-evident channels, tripwire/canary tokens, MACs |
| **Correlated pair state** | Observe one endpoint → know the other | Paired HMAC tokens, ledger commitments, **threshold crypto / MPC** |
| **Monogamy of entanglement** | A session bound to exactly one counterpart | Device/hardware binding |
| **Bell-inequality test** | Prove a pair is genuinely linked, not MITM'd | **Remote attestation** (TPM quote, TEE attestation) |
| **Entanglement swapping** | Chain trust across a mesh without exposing secrets | Delegated attestation, federation |
| **Quantum teleportation** | Move trust without sending the secret | **PAKE / OPAQUE**, threshold signing |
| **Superposition** | Defense posture indeterminate until engaged | MTD ambiguity |
| **Decoherence** | Trust degrades over time → re-attestation | Trust half-life (ties to Nucleus decay) |
| **Quantum-safe theme** | Defeat "harvest now, decrypt later" | **PQC** (Kyber/Dilithium, NIST) |

---

## Guarantees provided to the platform

### 1. Unclonable credentials (no-cloning + monogamy)

Credentials are bound to hardware (TPM/Enclave) or a **Physically Unclonable Function**.
A stolen token is useless off its bound device — it cannot be copied to another. This
enforces Nucleus **Pauli exclusion** (session uniqueness) at the hardware level and
means token theft/replay simply does not work.

### 2. Tamper-evident channels (measurement collapse)

Any interception or modification of an entangled channel is detectable, analogous to
how measuring a quantum state disturbs it. Implemented with authenticated, tripwire-laced
channels: a passive eavesdropper or active MITM perturbs verifiable state and is caught.

### 3. Attested pairing (Bell test)

Before two endpoints trust each other, they run a "Bell test" — **remote attestation**
proving each is a genuine, unmodified GENESIS component on trusted hardware, and that
they are genuinely paired (not relayed through a MITM). Foragers, electrons, and the
Queen all attest via the Fabric; a spoofed agent fails the test and is rejected.

### 4. Post-quantum transport

All GENESIS traffic uses NIST post-quantum algorithms (e.g. **Kyber** KEM, **Dilithium**
signatures), typically in hybrid mode with a classical algorithm. This defends against
"harvest now, decrypt later" — captured traffic cannot be decrypted by a future quantum
adversary.

---

## Entangled tokens

The core object is the **entangled token pair** — two correlated tokens issued to two
endpoints (or two regions/clouds):

```text
EntangledPair {
  id, pqc_public_keys,
  correlation: threshold-shared secret,   // observe one → constrains the other
  monogamy: device_binding,               // valid only on its bound endpoint
  attestation: bell_quote,                // proves genuine, unrelayed pairing
  coherence_ttl                           // decoherence → forced re-attestation
}
```

- **Tamper on one → the pair breaks**, giving instant cross-region integrity detection.
- **Monogamy** means neither half is usable off its bound device.
- **Teleportation** (PAKE/threshold) lets endpoints prove/transfer trust without ever
  sending the underlying secret over the wire.

## Entanglement swapping — trust chaining

To federate trust across organizations or mesh hops without sharing secrets, the Fabric
performs **entanglement swapping**: an intermediary attests to two parties, chaining
their trust so A and B become effectively paired via I — mirroring how quantum repeaters
extend entanglement across distance.

---

## How each plane uses the Fabric

- **Runtime / all agents** — root their SPIFFE identity in Fabric attestation; every
  agent must pass a Bell test to join.
- **Hive** — waggle-bus messages and quorum verdicts travel on tamper-evident, PQC
  channels; a spoofed forager fails attestation.
- **Nucleus** — spin/entangled tokens become real: monogamy enforces single-device
  session binding; decoherence TTL ties to secret decay.
- **Multiverse** — per-universe identity binding: an entangled token is valid **only in
  its universe**, so an attacker cannot escape a decoy branch with usable credentials,
  and attestation blocks branch-hopping.

See [integration.md](integration.md).

## Build phases

1. **EF-A** — attestation (Bell test) + hardware-bound keys / PUF enrollment.
2. **EF-B** — entangled token pairs (correlated + tamper-evident) + monogamy binding.
3. **EF-C** — post-quantum transport (hybrid Kyber/Dilithium).
4. **EF-D** — teleportation (PAKE/OPAQUE) + threshold signing + swapping (federation).

## Verification targets

- A cloned token fails on a second device (monogamy).
- A MITM'd channel fails attestation (Bell test).
- Tampering with one token of a pair is detected on the other.
- PQC handshake interoperates in hybrid mode and rejects downgrade.
