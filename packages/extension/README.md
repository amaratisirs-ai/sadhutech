# GENESIS Firewall - Browser Extension (MVP)

Standalone Chrome/Firefox extension that screens transactions and signature
requests **before any wallet sees them** - works with MetaMask, Trust Wallet,
Coinbase Wallet, Rabby, or any other extension that injects `window.ethereum`.

Unlike the [MetaMask Snap](../snap), this doesn't run inside a specific
wallet's sandbox - it intercepts at the page level, so it isn't tied to any
one wallet's plugin API.

## How it works

1. **`inject.ts`** runs in the page's own JS context (declared as a `"world":
   "MAIN"` content script) and wraps `window.ethereum.request`, so it sees the
   exact same provider the dapp and wallet use.
2. When a dapp calls `eth_sendTransaction`, `personal_sign`, or
   `eth_signTypedData_v4`, `inject.ts` pauses the call and asks
   **`content-script.ts`** (an isolated-world script bridging via
   `window.dispatchEvent`) to analyze it.
3. `content-script.ts` forwards the request to **`background.ts`** (the
   service worker - the only context allowed to call the GENESIS gate), which
   hits `/v1/analyze` or `/v1/analyze-signature` and returns a verdict.
4. On `allow`, the original request proceeds silently. On `warn`/`block`,
   `content-script.ts` shows an in-page overlay (`overlay.ts`) and only lets
   the request through if the user clicks "Proceed anyway."

Fails open throughout: any network/gate error results in `allow`, never a
false block.

## Coverage: what it can and can't see

Any browser extension (this one included) can only intercept transactions
that a **website** asks the wallet to sign via `window.ethereum` - it cannot
reach into another extension's own sandboxed UI. A wallet's native, built-in
features (its own in-wallet swap/send/buy screens) never touch a webpage's
`window.ethereum`, so no browser extension can see or protect those.

| | Dapp-initiated txs (Uniswap, OpenSea, etc.) | Wallet's own native swap/send |
|---|---|---|
| This extension (any wallet) | Protected | Not visible - can't intercept |
| [GENESIS Snap](../snap) (MetaMask only) | Protected | Protected (MetaMask only, via `onTransaction`/`onSignature`) |

The Snap gets the extra native-flow coverage because MetaMask specifically
exposes `onTransaction`/`onSignature` hooks that fire for *any* transaction
it's about to confirm, regardless of origin - other wallets (Trust Wallet,
Coinbase Wallet, Rabby, ...) have no equivalent third-party plugin hook, so
this can't be replicated for them by an extension.

## Build

```bash
pnpm --filter genesis-extension build   # outputs to dist/
pnpm --filter genesis-extension watch   # rebuild on change
```

## Load unpacked (dev)

Chrome → `chrome://extensions` → enable Developer mode → "Load unpacked" →
select `packages/extension/dist`.

## Known limitations (MVP, not yet production-hardened)

- Only wraps a single `window.ethereum` - doesn't yet listen for EIP-6963
  `eip6963:announceProvider` events, so pages with multiple simultaneously
  announced providers may only get the first one wrapped.
- No real icon assets yet (manifest omits `icons` - Chrome shows a default
  placeholder). Needs real PNG icons before a Chrome Web Store submission.
- `personal_sign`/`eth_signTypedData_v4` params are read positionally per the
  standard EIP-1193 ordering; a small number of older wallets swap the order.
- Not yet submitted anywhere - dev/unpacked install only.
