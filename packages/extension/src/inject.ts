// Runs in the page's MAIN world (declared via manifest content_scripts "world": "MAIN"),
// so it shares the same window.ethereum object the dapp and wallet actually use.
// Wraps window.ethereum.request so risky calls are screened by GENESIS before the wallet
// ever sees them - works with any wallet extension (MetaMask, Trust Wallet, Coinbase, Rabby...).
import {
  GENESIS_REQUEST_EVENT,
  GENESIS_RESPONSE_EVENT,
  type AnalyzeRequestMessage,
  type AnalyzeResponseMessage,
  type InterceptedMethod,
} from "./messages.js";

const INTERCEPTED: ReadonlySet<string> = new Set<InterceptedMethod>([
  "eth_sendTransaction",
  "personal_sign",
  "eth_signTypedData_v4",
]);

let nextId = 0;

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
