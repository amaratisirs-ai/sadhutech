// Runs in the page's MAIN world (declared via manifest content_scripts "world": "MAIN"),
// so it shares the same window.ethereum object the dapp and wallet actually use.
// Wraps window.ethereum.request so risky calls are screened by GENESIS before the wallet
// ever sees them - works with any wallet extension (MetaMask, Trust Wallet, Coinbase, Rabby...).
import {
  GENESIS_REQUEST_EVENT,
  GENESIS_RESPONSE_EVENT,
  GENESIS_AUTH_REQUEST_EVENT,
  GENESIS_AUTH_RESPONSE_EVENT,
  type AnalyzeRequestMessage,
  type AnalyzeResponseMessage,
  type AuthResponseMessage,
  type InterceptedMethod,
} from "./messages.js";

const INTERCEPTED: ReadonlySet<string> = new Set<InterceptedMethod>([
  "eth_sendTransaction",
  "personal_sign",
  "eth_signTypedData_v4",
]);

let nextId = 0;
// The unwrapped provider.request, captured by wrapProvider() - GENESIS's own auth-signing
// call (below) must bypass its own interception, or personal_sign would recurse through
// the analyze pipeline as if it were a third-party dapp request.
let unwrappedRequest: ((args: { method: string; params?: unknown[] }) => Promise<any>) | null = null;
// Most recently wrapped provider (window.ethereum or an EIP-6963 announcement) - used as a
// fallback for the auth flow below in case a wallet only announces via EIP-6963.
let lastWrappedProvider: any = null;

function askGenesis(method: InterceptedMethod, params: unknown[]): Promise<AnalyzeResponseMessage> {
  const id = `genesis-${Date.now()}-${nextId++}`;
  return new Promise((resolve) => {
    const onResponse = (event: Event) => {
      const detail = (event as CustomEvent<AnalyzeResponseMessage>).detail;
      if (detail?.id !== id) return;
      window.removeEventListener(GENESIS_RESPONSE_EVENT, onResponse);
      resolve(detail);
    };
    window.addEventListener(GENESIS_RESPONSE_EVENT, onResponse);
    const message: AnalyzeRequestMessage = {
      type: GENESIS_REQUEST_EVENT,
      id,
      method,
      params,
      origin: window.location.origin,
    };
    window.dispatchEvent(new CustomEvent(GENESIS_REQUEST_EVENT, { detail: message }));
  });
}

function wrapProvider(provider: any): void {
  if (!provider || provider.__genesisWrapped) return;
  const originalRequest = provider.request?.bind(provider);
  if (typeof originalRequest !== "function") return;
  unwrappedRequest = originalRequest;
  lastWrappedProvider = provider;

  provider.request = async (args: { method: string; params?: unknown[] }) => {
    if (!INTERCEPTED.has(args.method)) {
      return originalRequest(args);
    }
    const result = await askGenesis(args.method as InterceptedMethod, args.params ?? []);
    if (!result.proceed) {
      throw new Error(result.error || `GENESIS blocked this request: ${result.plainEnglish}`);
    }
    return originalRequest(args);
  };
  provider.__genesisWrapped = true;
}

// Wallets inject window.ethereum at different times; poll briefly rather than assuming it's ready.
function watchForProvider(): void {
  const w = window as any;
  if (w.ethereum) {
    wrapProvider(w.ethereum);
    return;
  }
  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    if (w.ethereum) {
      wrapProvider(w.ethereum);
      clearInterval(timer);
    } else if (attempts > 40) {
      clearInterval(timer); // no wallet installed on this page - nothing to protect
    }
  }, 250);
}

watchForProvider();

// EIP-6963 (Multi Injected Provider Discovery): modern dapps (Uniswap included) increasingly
// fetch a wallet's provider directly via this event instead of the legacy window.ethereum
// singleton, especially when multiple wallets are installed. Missing this meant real
// transactions from EIP-6963-aware dapps went completely unscreened. Wrap every provider a
// wallet announces, and proactively ask wallets to (re-)announce in case they already fired
// before this listener attached.
window.addEventListener("eip6963:announceProvider", (event) => {
  const provider = (event as CustomEvent<{ provider?: any }>).detail?.provider;
  if (provider) wrapProvider(provider);
});
window.dispatchEvent(new Event("eip6963:requestProvider"));

// Deep Check authorization: content-script.ts (relaying a request from the popup) asks
// whatever wallet is on this page to sign a one-time proof-of-ownership message.
window.addEventListener(GENESIS_AUTH_REQUEST_EVENT, async (event) => {
  const request = (event as CustomEvent<{ id: string }>).detail;
  if (!request) return;
  const provider = (window as any).ethereum ?? lastWrappedProvider;
  const respond = (detail: AuthResponseMessage) =>
    window.dispatchEvent(new CustomEvent(GENESIS_AUTH_RESPONSE_EVENT, { detail }));

  if (!provider?.request) {
    respond({ type: GENESIS_AUTH_RESPONSE_EVENT, id: request.id, error: "No wallet found on this page." });
    return;
  }
  try {
    const rawRequest = unwrappedRequest ?? provider.request.bind(provider);
    const accounts = (await rawRequest({ method: "eth_requestAccounts" })) as string[];
    const address = accounts?.[0];
    if (!address) throw new Error("No account returned by wallet.");
    const message = `GENESIS Deep Check\nwallet: ${address}\nts: ${new Date().toISOString()}`;
    const signature = (await rawRequest({ method: "personal_sign", params: [message, address] })) as string;
    respond({ type: GENESIS_AUTH_RESPONSE_EVENT, id: request.id, address, message, signature });
  } catch (err) {
    respond({
      type: GENESIS_AUTH_RESPONSE_EVENT,
      id: request.id,
      error: err instanceof Error ? err.message : "Wallet authorization failed.",
    });
  }
});
