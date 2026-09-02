# AGENTS.md

Guidance for AI coding agents (e.g. Claude Haiku 4.5) working in this repo. Read this
first, then [docs/engineering-reference.md](docs/engineering-reference.md) for full detail.

## Project
GENESIS transaction firewall (MVP): a no-custody pre-sign gate that decodes a crypto
transaction, scores risk against community threat intel, and returns `allow`/`warn`/`block`
with a plain-English explanation. TypeScript, pnpm workspaces.

## Commands
```bash
pnpm install
pnpm test        # vitest — MUST pass before finishing
pnpm demo        # CLI scenario runner
pnpm gate        # dev server → http://localhost:8787/
pnpm typecheck
```

## Where things live
- `packages/shared/src/index.ts` — types & constants (SEVERITY_SCORE, DEFAULT_QUORUM, UNLIMITED_THRESHOLD)
- `packages/gate/src/decode.ts` — calldata decoder (add new drainer patterns here)
- `packages/gate/src/rules.ts` — risk findings (stable, namespaced ids)
- `packages/gate/src/intel.ts` — community threat feed + quorum (Sybil-resistant)
- `packages/gate/src/analyze.ts` — pipeline + verdict + plain-English
- `packages/gate/src/server.ts` — Fastify API (`/v1/analyze`, `/v1/report`, `/health`, `/`)
- `packages/gate/src/ui.ts` — web tester (HTML string)
- `packages/snap/` — MetaMask Snap (skeleton)

## Rules for agents
- Every behavior change ships with a `vitest` test; run `pnpm test` before done.
- Finding `id`s are a tested contract — don't rename without updating tests.
- ESM: intra-package imports use `.js` extensions.
- Comments only when code can't explain itself; one line.
- Addresses are compared lowercased.

## SAFE to do autonomously
Add decoders (`decode.ts`), rules (`rules.ts`), intel behavior (`intel.ts`), endpoints
(`server.ts`), UI tweaks (`ui.ts`), tests, WalletConnect/persistence/feed wiring.

## ESCALATE (do not decide alone)
- Any cryptography (key model, PQC, MPC, attestation). NEVER roll your own crypto.
- Cross-package architecture changes.
- Verdict threshold changes that affect block/allow.
- Anything touching real keys, funds, or custody.

## Honesty rules
- Never claim "hack-proof" / "unhackable". Claims must be specific and testable.
- Seeded threat addresses are placeholders, not real data.
- Keep `docs/internal/` out of public/customer-facing surfaces.
