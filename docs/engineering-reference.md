# Engineering Reference & Development Guide

Comprehensive reference for continuing development of the **GENESIS transaction
firewall** (MVP Path A). Written so any developer — or an AI coding agent such as
**Claude Haiku 4.5** — can pick up the work safely. Pair this with [AGENTS.md](../AGENTS.md)
(auto-read by coding agents) and the product docs in [docs/](README.md).

---

## 1. What this project is

A **no-custody pre-sign transaction firewall**: it intercepts a crypto transaction
*before* it is signed, decodes what the transaction would actually do, scores the risk
against community threat intel, and returns a verdict (`allow` / `warn` / `block`) with a
plain-English explanation. It never holds keys or funds.

This is the fast-path first slice of a larger vision (Hive / Nucleus / Entanglement
Fabric / Multiverse / Sutra). See [vision.md](vision.md) and [roadmap.md](roadmap.md).

**Status:** core built, 9/9 tests passing, runnable locally (web UI + CLI). Integration
pieces (MetaMask Snap build, real threat feed, persistence, fork simulation) are pending.

---

## 2. Can Claude Haiku 4.5 develop this? (agent suitability)

**Good fit — safe to hand to Haiku (with tests):**
- Adding a new decoded method / drainer pattern in `decode.ts`.
- Adding a risk rule + finding in `rules.ts` (stable `id`, severity).
- Adding a threat category or intel behavior in `intel.ts`.
- New API endpoints / validation in `server.ts`.
- UI tweaks in `ui.ts` (it's a plain HTML string).
- Writing/extending `vitest` tests.
- Wiring the WalletConnect middleware, persistence adapters, feed importers.

**Escalate to a stronger model or a human (do NOT let a fast model decide alone):**
- Cryptography: the **key model**, PQC selection, MPC/threshold, attestation design.
  *Never roll your own crypto.* Use vetted libraries only.
- Architecture changes across packages or the plane boundaries.
- Security-sensitive verdict logic changes (scoring thresholds affecting block/allow).
- Anything touching real user funds or custody boundaries.
- Ambiguous product/scope decisions.

**Rule of thumb:** if a task has a clear spec and a test can prove it, Haiku can do it.
If it requires judgment about security guarantees or architecture, escalate.

---

## 3. Repository structure

```
/                     pnpm workspace root (package.json, pnpm-workspace.yaml, tsconfig.base.json, vitest.config.ts)
/packages/shared      @genesis/shared  — domain types & constants (no deps)
/packages/gate        @genesis/gate    — the pre-sign gate (decode, intel, rules, analyze, server, ui, demo)
/packages/snap        @genesis/snap    — MetaMask Snap (onTransaction → calls the gate)
/docs                 product + engineering docs (this file lives here)
/docs/internal        internal-only docs (security-guarantees.md — never link publicly)
/content/blog         marketing blog content (Markdown + frontmatter)
```

---

## 4. Tech stack & tooling

- **Language:** TypeScript (ESM, `"type": "module"`), Node ≥ 20 (dev on Node 24).
- **Package manager:** pnpm 10 workspaces.
- **Web framework:** Fastify 5 (gate server).
- **EVM utils:** viem 2 (`decodeFunctionData`, `encodeFunctionData`, `isAddress`, `parseAbi`).
- **Tests:** vitest 2.
- **Run TS directly:** tsx.
- **Not installed:** Foundry/anvil — simulation is currently calldata-decode heuristics
  behind a `SimulationResult` interface (a fork simulator can be added later).

### Commands (from repo root)
```bash
pnpm install       # install workspace deps
pnpm test          # run vitest (currently 9 tests)
pnpm demo          # CLI scenario runner (colorized verdicts)
pnpm gate          # dev server (watch) → http://localhost:8787/  (web tester UI)
pnpm typecheck     # tsc -b
```
The gate listens on `PORT` (default **8787**).

---

## 5. Package reference

### 5.1 `@genesis/shared` — `packages/shared/src/index.ts`
Pure types + constants, no runtime deps. Key exports:

- Types: `ChainId`, `Address`, `TxRequest`, `Severity`, `Verdict`, `Autonomy`,
  `Approval`, `ApprovalKind`, `AssetChange`, `SimulationResult`, `RiskFinding`,
  `RiskAssessment`, `AnalyzeRequest`, `ThreatCategory`, `ThreatEntry`, `ReportRequest`.
- Constants:
  - `SEVERITY_SCORE` — maps severity → 0..100 contribution (`info 0, low 15, medium 40,
    high 70, critical 100`).
  - `DEFAULT_QUORUM = 3` — distinct reporters needed to confirm a threat.
  - `UNLIMITED_THRESHOLD = 2^255` — ERC-20 allowance at/above this is "unlimited".

### 5.2 `@genesis/gate` — `packages/gate/src/`

**`decode.ts` → `decodeTransaction(tx: TxRequest): SimulationResult`**
Heuristic, calldata-only decoder. Recognized methods (via `SUSPECT_ABI`):
`approve(address,uint256)`, `approve(address,address,uint160,uint48)` (Permit2),
`increaseAllowance`, `setApprovalForAll`, `permit`, `transfer`, `transferFrom`,
`multicall(bytes[])`. Native value transfers detected from `tx.value`.
`UNLIMITED_UINT160 = 2^159` marks Permit2 unlimited. Unknown selectors → `method:"unknown"`.
`heuristic: true` always (no fork yet). Addresses normalized to lowercase (no throw).

**`intel.ts` → `class ThreatIntel`**
Community threat feed with quorum.
- `constructor(quorum = DEFAULT_QUORUM)`
- `seed(entries)` — load curated/trusted entries (treated as confirmed immediately).
- `report(req: ReportRequest): ThreatEntry` — counts **distinct `reporterId`s** (Sybil
  resistance); duplicate reporters don't advance quorum.
- `lookup(address): ThreatEntry | undefined` — `quorumReached` true when trusted or
  distinct reporters ≥ quorum.

**`rules.ts` → `evaluate(sim, intel): RiskFinding[]`**
Produces findings (see the catalog in §7).

**`analyze.ts` → `analyze(req: AnalyzeRequest, intel): RiskAssessment`**
Pipeline: `decodeTransaction` → `evaluate` → `scoreOf` → `verdictOf` → `summarize` +
`explain` (plain-English). Verdict logic:
- any `critical` finding → **block**
- else score ≥ 40 → **warn**
- else → **allow**
Score = max finding severity + 5 per extra medium+ finding, capped at 100.

**`index.ts`** — re-exports `analyze`, `decodeTransaction`, `evaluate`, `ThreatIntel`, and
`createIntel()` (builds a `ThreatIntel` seeded with **placeholder** drainer / malicious /
decoy-tripwire addresses — replace with a real feed).

**`server.ts`** — Fastify app. Endpoints in §6. Permissive CORS for dev. Validates
`from`/`to` via `isAddress` and `data` as hex → clean `400`s; `analyze` wrapped in
try/catch.

**`ui.ts`** — `TESTER_HTML` (self-contained web tester served at `GET /`) and
`PRESET_CALLDATA()` (viem-encoded scenario calldata embedded in the page).

**`demo.ts`** — `pnpm demo` CLI runner over realistic scenarios.

### 5.3 `@genesis/snap` — `packages/snap/`
MetaMask transaction-insight Snap. `src/index.ts` exports `onTransaction`, which POSTs the
tx to `GATE_URL` (default `http://localhost:8787/v1/analyze`) and renders the verdict.
`snap.manifest.json` requests `endowment:transaction-insight` + `endowment:network-access`.
**Skeleton** — needs `@metamask/snaps-cli` (`mm-snap build`) + MetaMask Flask to run.

---

## 6. API contracts (gate server)

| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET | `/` | — | HTML tester UI |
| GET | `/health` | — | `{ status, service }` |
| POST | `/v1/analyze` | `AnalyzeRequest` (`{ tx, autonomy? }`) | `RiskAssessment` |
| POST | `/v1/report` | `ReportRequest` (`{ address, category, reporterId }`) | `ThreatEntry` |

`RiskAssessment` = `{ verdict, score, findings[], simulation, summary, plainEnglish }`.
Errors return `{ error: string }` with HTTP 400.

---

## 7. Detection rule catalog (finding ids)

| id | severity | Trigger |
|----|----------|---------|
| `intel.<category>` | critical (drainer/malicious-contract/sanctioned/decoy-tripwire) or high | counterparty is a **quorum-confirmed** threat |
| `intel.unconfirmed` | medium | counterparty reported but below quorum |
| `approval.setApprovalForAll` | high | grants operator control of all NFTs |
| `approval.unlimited` | high | unlimited ERC-20 / Permit2 allowance |
| `approval.limited` | low | bounded allowance |
| `approval.permit` | medium | gasless permit (off-chain approval) |
| `call.multicall` | medium | batched call hides sub-actions |

To add a detector: decode the pattern in `decode.ts`, emit a finding with a **new stable
id** in `rules.ts`, and add a `vitest` case. Keep severities consistent with `SEVERITY_SCORE`.

---

## 8. Conventions

- ESM only; import intra-package with `.js` extensions (TS ESM resolution).
- Cross-package imports via workspace names (`@genesis/shared`).
- Finding `id`s are stable and namespaced (`area.name`) — they are a tested contract.
- Comments only where code can't explain itself; one line max.
- Every behavior change ships with a test. Run `pnpm test` before done.
- Addresses compared lowercased everywhere.

---

## 9. Backlog / next steps (ordered)

1. **MetaMask Snap build** — `mm-snap build`, load in Flask, verify inline verdict.
2. **Real threat feed** — import curated drainer lists into `createIntel()`; scheduled refresh.
3. **Persistent/shared intel store** — replace in-memory `ThreatIntel` (DB / KV) so quorum
   survives restarts and is shared across nodes.
4. **WalletConnect middleware** — cover non-MetaMask wallets.
5. **Fork-backed simulator** — implement `SimulationResult` via anvil/Tenderly; decode
   *inside* `multicall`.
6. **Graduated enforcement** — honor `autonomy` (observe/warn/enforce); decoy handoff.
7. **Site** — Astro/Next app rendering `content/blog` + embedded live demo.
8. **(Later, escalate)** hardware key binding, PQC, MPC — the moat.

---

## 10. Security & safety notes

- **Never roll your own crypto.** Use audited libraries; escalate crypto design.
- The seeded threat addresses are **placeholders** — do not present as real.
- Keep [docs/internal/security-guarantees.md](internal/security-guarantees.md) internal;
  never claim "hack-proof." Claims must be specific and testable.
- Detection is advisory today (warn/block); it is not a guarantee of safety.
- Validate all external input at the API boundary (already done for addresses/hex).
