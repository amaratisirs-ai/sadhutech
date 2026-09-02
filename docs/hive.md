# Hive — Swarm Detection & Response Plane

Modeled on a honeybee colony. A swarm of lightweight **forager** agents travels to
assets ("flowers"), collects telemetry ("nectar"), and coordinates through genuine
swarm algorithms to produce **emergent**, low-false-positive threat verdicts and
automated responses — with no single point of failure.

## Components

| Component | Role |
|-----------|------|
| **Forager** | Autonomous agent (runtime role plug-in) that probes flowers via adapters |
| **Flower adapter** | Pluggable probe for a target type (HTTP/API, cloud, host, network, DB) |
| **Waggle bus** | Gossip pub/sub for recruitment and telemetry (libp2p / NATS) |
| **Comb** | Hexagonally-sharded storage of refined intelligence (honey) |
| **Queen** | Re-electable control plane: policy, root-of-trust, scheduling (Raft) |
| **Guard bee** | Zero-trust gateway verifying agent identity at boundaries |
| **Propolis** | Quarantine/isolation response module |
| **Hive Mind** | Analytics service running the algorithms below |

---

## Swarm algorithms

The metaphor is implemented literally. Each algorithm below has defined state, math,
and a response mapping.

### 1. Artificial Bee Colony (ABC) — agent role allocation

Food sources = (asset, check) pairs. The **fitness** of a source encodes how much
security attention it deserves (risk × value × novelty). Three roles:

- **Employed bees** exploit *known* sources (continuous monitoring of known assets).
- **Onlooker bees** choose sources *probabilistically by fitness* (focus effort where
  risk is highest).
- **Scout bees** *abandon* exhausted sources and explore randomly (discover shadow /
  unknown assets).

Onlooker selection probability for source $i$:

$$ p_i = \frac{f_i}{\sum_{j=1}^{S} f_j} $$

where $f_i$ is the fitness (risk-value score) of source $i$ and $S$ is the number of
known sources. A source is **abandoned** when its improvement counter (scans producing
no new findings) exceeds a `limit`, at which point an employed bee becomes a scout.

Fitness from a raw risk/anomaly cost $c_i$ (lower cost = safer):

$$ f_i = \begin{cases} \dfrac{1}{1 + c_i} & c_i \ge 0 \\[2mm] 1 + |c_i| & c_i < 0 \end{cases} $$

```text
loop:
  # employed phase — exploit known sources
  for each employed bee b on source i:
      candidate = perturb(i)                 # vary check params / neighbor asset
      if fitness(candidate) > fitness(i):
          i = candidate; reset_counter(i)
      else:
          increment_counter(i)

  # onlooker phase — probabilistic focus by fitness
  for each onlooker:
      i = select_source_by_probability(p)    # p_i above
      observe(i); update_fitness(i)

  # scout phase — abandon & explore
  for each source i with counter(i) > LIMIT:
      abandon(i)
      i = levy_scout()                        # random discovery (see §3)
```

### 2. Waggle-dance recruitment — decentralized intel sharing

When a forager finds something high-value (a vulnerability, an anomaly), it "dances":
it broadcasts a recruitment message on the waggle bus so more agents converge. The
message encodes the bee analogue of *direction + distance + quality*:

`Waggle { target_vector, severity s ∈ [0,1], confidence κ ∈ [0,1], ttl }`

Recruitment strength (expected number of recruited foragers) is proportional to
severity and confidence and decays with "distance" $d$ (topological/cost) and time:

$$ R = R_{\max}\cdot s \cdot \kappa \cdot e^{-\lambda d} \cdot e^{-t/\tau} $$

High-severity, high-confidence finds recruit a large sub-swarm quickly; weak or stale
signals fade. This yields fast convergence on real threats without central tasking.

### 3. Lévy-flight scouting — Moving Target Defense

Scouts schedule scans using a heavy-tailed **Lévy** step distribution rather than a
uniform/periodic scan. Step length $\ell$ is drawn from:

$$ P(\ell) \sim \ell^{-\mu}, \quad 1 < \mu \le 3 $$

Heavy tails mean mostly local exploration with occasional long jumps — optimal
coverage of an unknown space *and* an unpredictable scan order/timing an attacker
cannot model. This is the Hive's Moving Target Defense: no fixed scan cadence to
evade.

### 4. Quorum sensing — emergent, low-FP verdicts

A threat is **confirmed** only when an independent quorum of foragers agrees within a
time window — mirroring how a bee swarm commits to a nest site only past a quorum
threshold. This structurally suppresses false positives.

A finding is confirmed when:

$$ \sum_{a \in A} \kappa_a \cdot \mathbb{1}[\text{agent } a \text{ corroborates}] \ \ge\ \Theta $$

over distinct agents $A$ within window $\Delta t$, where $\kappa_a$ is agent $a$'s
confidence and $\Theta$ is the quorum threshold. Requiring *distinct* agents means an
attacker must fool many independent probes at once, not one model.

### 5. Pheromone / stigmergy — shared risk memory

Each asset carries a pheromone (risk) score that agents **deposit** onto and that
**decays** over time, guiding onlooker allocation (§1) without central bookkeeping:

$$ \phi_{t+1} = (1-\rho)\,\phi_t + \Delta\phi $$

where $\rho \in (0,1)$ is the evaporation rate and $\Delta\phi$ is the deposit from a
new finding. Persistent risk stays "hot"; resolved issues cool down automatically.

### 6. Queen supersedure — no single point of failure

The control plane elects a leader via **Raft**. If the leader underperforms, misses
heartbeats, or fails attestation (via the Entanglement Fabric), the swarm triggers
**supersedure** — a re-election — exactly as a colony raises a new queen. There is no
irreplaceable node.

---

## Flower adapters

Adapters make the swarm **generic**: any asset is a flower.

```rust
// Adapter contract (illustrative)
trait FlowerAdapter {
    fn kind(&self) -> AssetKind;                 // HTTP, Cloud, Host, Network, DB, ...
    async fn probe(&self, target: &Target) -> Nectar;   // collect telemetry
    fn cost(&self, n: &Nectar) -> f64;           // risk/anomaly cost → fitness
}
```

MVP adapters: **HTTP/API** (exposed endpoints, misconfig, auth weaknesses) and **Host**
(open ports, known-vuln surface). Both use the Lévy scheduler for MTD.

---

## Response actions

| Trigger | Action | Metaphor |
|---------|--------|----------|
| Quorum-confirmed compromise | Isolate workload | **Propolis** (seal the infection) |
| Confirmed leaked/abused secret | Rotate related secrets | Hygienic behavior (+ Nucleus decay) |
| Confirmed hostile session | Fork into decoy universe | Multiverse handoff |
| Node failing attestation | Supersede / evict | Colony hygiene |

Responses are layered and automatic. Detection without response is passive; the Hive
always closes the loop. See [integration.md](integration.md).

---

## Verification targets

- Unit/property tests: onlooker probability $p_i$ sums to 1; Lévy sample tail exponent
  matches $\mu$; pheromone decay follows the geometric curve; quorum fires exactly at
  $\Theta$; ABC abandonment triggers at `limit`.
- Simulation: injected threat is detected → recruited → quorum-confirmed → quarantined
  within target latency across a 5-forager swarm.
