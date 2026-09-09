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
   exact same provider the dapp and wallet use. It also listens for
   **EIP-6963** `eip6963:announceProvider` events and wraps every provider a
   wallet announces that way too - some dapps (Uniswap included) fetch a
   wallet's provider directly via EIP-6963 instead of `window.ethereum`, and
   missing that meant real transactions went completely unscreened.
2. When a dapp calls `eth_sendTransaction`, `personal_sign`,
   `eth_signTypedData_v3`/`_v4`, or `eth_sign`, `inject.ts` pauses the call and
   asks **`content-script.ts`** (an isolated-world script bridging via
   `window.dispatchEvent`) to analyze it.
3. `content-script.ts` forwards the request to **`background.ts`** (the
   service worker - the only context allowed to call the GENESIS gate), which
   hits `/v1/analyze` or `/v1/analyze-signature` and returns a verdict.
4. On `allow`, the original request proceeds silently. On `warn`/`block`,
   `content-script.ts` shows an in-page overlay (`overlay.ts`) and only lets
   the request through if the user clicks "Proceed anyway."

Fails open throughout: any network/gate error results in `allow`, never a
false block.

## Deep Check (Pro credits)

Off by default - the popup's "Deep Check protection" toggle enables it:

1. Enabling it (with no cached authorization yet) opens a new tab to
   `sadhutech.com/extension-connect` - a real, persistent page reusing the
   site's own wallet-connect + signing flow (`useWallet`/`useProAuth`, same
   wagmi/AppKit widget used on `/check` and `/pro`). Signing does **not**
   happen from the toolbar popup itself: popups close the instant a wallet's
   own approval dialog steals focus, and a popup has no access to whatever
   wallet is injected into some other tab - both of which made an earlier,
   popup-triggered version of this flow unreliable (wrong signing origin
   shown in the wallet, no way to pick between multiple installed wallets,
   and lost auth attempts when the popup got torn down mid-flow).
2. That page signs a one-time message
   (`SadhuTech pro check\nwallet: <addr>\nts: <ISO time>`) then hands the
   signed credential to the extension via `chrome.runtime.sendMessage`
   against a fixed `EXTENSION_ID`, which only works because `manifest.json`
   pins a stable ID (the `key` field) and declares `sadhutech.com` under
   `externally_connectable` - without pinning the key, an unpacked dev
   install gets a new random ID on every reload and this messaging breaks.
   `background.ts`'s `chrome.runtime.onMessageExternal` listener verifies
   `sender.origin` is an allowed one before writing `chrome.storage.local`.
3. The signed credential is cached in `chrome.storage.local` (key
   `genesisProAuth`) and reused for ~23h (matches the gate's 24h signature-
   freshness window in `server.ts`, same margin the site's `/check` page
   uses) - not re-signed on every transaction.
4. `background.ts` attaches `pro: {wallet, message, signature, source:
   "extension"}` to `/v1/analyze` calls (transaction checks only - signature
   checks have no server-side deep-check logic yet, see snap-registry-issue
   notes) whenever the toggle is on and the cached signature is still fresh.
   The gate spends 1 credit and adds ChainAbuse intel to the verdict.
5. `creditsLeft` comes back on the response either way: a small "N credits
   left" pill on `allow` (`overlay.ts`'s `showCreditNotice`), or appended to
   the warn/block overlay text.

Turning the toggle off just stops attaching `pro` on future requests - the
cached signature stays put so re-enabling doesn't require signing again
(until it expires). "Disconnect / switch wallet" (shown whenever a
credential is cached) clears it immediately, so a different wallet can
authorize next time instead of the cached one being reused.

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
select `packages/extension/dist`. Because `manifest.json` pins a `key`, this
loads with the same fixed ID every time
(`enibhabpohaallafhaobpojlmpcedehp`) instead of a new random one - required
for the Deep Check connect flow (`externally_connectable` messaging) to keep
working across reloads. If that keypair is ever regenerated, update
`EXTENSION_ID` in `packages/site/app/extension-connect/page.tsx` to match.

## Known limitations (MVP, not yet production-hardened)

- `personal_sign`/`eth_signTypedData_v3`/`_v4`/`eth_sign` params are read
  positionally per the standard EIP-1193 ordering; a small number of older
  wallets swap the order. Legacy `eth_signTypedData` (v1) is deliberately not
  intercepted - it reverses that ordering again AND uses a non-EIP-712
  message format, both of which made it too easy to get wrong for how rarely
  it's used by modern dapps.
- Not yet submitted anywhere - dev/unpacked install only.
