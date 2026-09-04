import type { OnHomePageHandler, OnSignatureHandler, OnTransactionHandler } from "@metamask/snaps-sdk";
import { panel, heading, text, divider } from "@metamask/snaps-sdk";

/**
 * URL of the GENESIS Chakravyuha pre-sign gate.
 * This is the production instance. For local dev, update this value.
 */
const GATE_URL = "https://genesis-gate.onrender.com/v1/analyze";
const GATE_SIGNATURE_URL = "https://genesis-gate.onrender.com/v1/analyze-signature";
const PRO_STATUS_URL = "https://genesis-gate.onrender.com/v1/pro/status";

/** Matches the server's extended freshness window for source:"snap" pro requests. */
const AUTH_TTL_MS = 24 * 60 * 60 * 1000;

/** Snap auto-consume only turns on once the wallet holds at least this many credits. */
const SNAP_MIN_CREDITS = 10;

interface GateFinding {
  id: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
}

interface GateResult {
  verdict: "allow" | "warn" | "block";
  score: number;
  findings: GateFinding[];
  summary: string;
  creditsLeft?: number;
}

interface DeepCheckAuth {
  wallet: string;
  message: string;
  signature: string;
  signedAt: number;
  /** Last known credit balance; undefined until the first status/consume response. */
  creditsLeft?: number;
}

const VERDICT_LABEL: Record<GateResult["verdict"], string> = {
  allow: "OK — no risks detected",
  warn: "CAUTION — review before signing",
  block: "DANGER — do not sign",
};

function short(address: string): string {
  return `${address.slice(0, 6)}\u2026${address.slice(-4)}`;
}

/** Reads the one-time-signed deep-check credential, ignoring it once it's past AUTH_TTL_MS. */
async function getStoredAuth(): Promise<DeepCheckAuth | null> {
  const state = (await snap.request({
    method: "snap_manageState",
    params: { operation: "get" },
  })) as { auth?: DeepCheckAuth } | null;
  const auth = state?.auth;
  if (!auth || Date.now() - auth.signedAt > AUTH_TTL_MS) return null;
  return auth;
}

async function storeAuth(auth: DeepCheckAuth): Promise<void> {
  await snap.request({
    method: "snap_manageState",
    params: { operation: "update", newState: { auth } },
  });
}

/** Whether the cached balance clears the SNAP_MIN_CREDITS bar (unknown balance = allow one attempt). */
function meetsMinimum(auth: DeepCheckAuth): boolean {
  return auth.creditsLeft === undefined || auth.creditsLeft >= SNAP_MIN_CREDITS;
}

function renderResult(result: GateResult) {
  const content = [
    heading("GENESIS Firewall"),
    text(`**${VERDICT_LABEL[result.verdict]}** (risk ${result.score}/100)`),
    text(result.summary),
  ];

  if (result.findings.length > 0) {
    content.push(divider(), heading("Findings"));
    for (const f of result.findings) {
      content.push(text(`**${f.severity.toUpperCase()}** — ${f.title}`));
      content.push(text(f.description));
    }
  }

  if (typeof result.creditsLeft === "number") {
    content.push(divider(), text(`— 1 deep-check credit used, ${result.creditsLeft} remaining`));
  }

  return { content: panel(content) };
}

const UNREACHABLE_RESULT = {
  content: panel([
    heading("GENESIS Firewall"),
    text("Could not reach the pre-sign gate. Proceed with caution."),
  ]),
};

/**
 * Snap's home page: one-time authorization for auto-consuming Pro deep-check
 * credits (already purchased on sadhutech.com/pro with the same wallet). Signs
 * once, caches the credential locally (snap_manageState) for AUTH_TTL_MS, then
 * onTransaction reuses it silently — no repeated signature prompts per check.
 * Requires endowment:page-home, endowment:ethereum-provider, snap_manageState
 * (all open permissions, no MetaMask allowlist review needed for these alone).
 */
export const onHomePage: OnHomePageHandler = async () => {
  let auth = await getStoredAuth();

  if (!auth) {
    try {
      const accounts = (await ethereum.request({ method: "eth_requestAccounts" })) as string[];
      const wallet = accounts[0];
      if (!wallet) throw new Error("no account");
      const message = `GENESIS deep check authorization\nwallet: ${wallet}\nts: ${new Date().toISOString()}`;
      const signature = (await ethereum.request({
        method: "personal_sign",
        params: [message, wallet],
      })) as string;
      auth = { wallet, message, signature, signedAt: Date.now() };
      await storeAuth(auth);
    } catch {
      return {
        content: panel([
          heading("GENESIS Firewall"),
          text("Deep checks are off."),
          text("Reopen this page and approve the signature request to enable automatic deep checks for any Pro credits you've bought at sadhutech.com/pro."),
        ]),
      };
    }
  }

  return {
    content: panel([
      heading("GENESIS Firewall"),
      ...(await deepCheckStatusLines(auth)),
    ]),
  };
};

/**
 * Fetches the real credit balance so onHomePage can surface "buy credits" right
 * at enrollment instead of the user discovering it's empty mid-transaction.
 * Also refreshes the cached balance on the stored auth so onTransaction's
 * SNAP_MIN_CREDITS gate reflects the latest purchase without an extra fetch
 * on every single transaction. Fails soft (assumes deep checks may work) if
 * the status call itself fails.
 */
async function deepCheckStatusLines(auth: DeepCheckAuth) {
  try {
    const res = await fetch(`${PRO_STATUS_URL}/${auth.wallet}`);
    const status = (await res.json()) as { credits?: number; premium?: boolean };
    const credits = status.credits ?? 0;
    await storeAuth({ ...auth, creditsLeft: credits });

    if (!status.premium) {
      return [text(`**Deep checks: authorized** for \`${short(auth.wallet)}\`.`), text("Deep checks are launching soon.")];
    }
    if (credits < SNAP_MIN_CREDITS) {
      return [
        text(`**Deep checks: authorized** for \`${short(auth.wallet)}\`, but you have **${credits} credit${credits === 1 ? "" : "s"}**.`),
        text(`A minimum of ${SNAP_MIN_CREDITS} credits is required to enable automatic deep checks in the Snap. Buy credits at sadhutech.com/pro.`),
      ];
    }
    return [
      text(`**Deep checks: ON** for \`${short(auth.wallet)}\` (${credits} credits left).`),
      text("Transactions and signatures are automatically screened. Buy more credits any time at sadhutech.com/pro."),
    ];
  } catch {
    return [
      text(`**Deep checks: authorized** for \`${short(auth.wallet)}\`.`),
      text("Couldn't reach the credit balance right now — deep checks will still run automatically if you have credits."),
    ];
  }
}

/**
 * Intercepts every transaction MetaMask is about to sign and shows the GENESIS
 * risk assessment inline in the confirmation UI. This is the wallet-boundary
 * interception point for the fast-path MVP — zero key custody.
 */
export const onTransaction: OnTransactionHandler = async ({ transaction, chainId }) => {
  const numericChainId = Number((chainId ?? "eip155:1").split(":")[1] ?? "1");
  const auth = await getStoredAuth();

  try {
    const response = await fetch(GATE_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        tx: {
          chainId: numericChainId,
          from: transaction.from,
          to: transaction.to,
          value: transaction.value,
          data: transaction.data ?? "0x",
        },
        ...(auth && meetsMinimum(auth)
          ? { pro: { wallet: auth.wallet, message: auth.message, signature: auth.signature, source: "snap" } }
          : {}),
      }),
    });
    const result = (await response.json()) as GateResult;
    if (auth && typeof result.creditsLeft === "number") {
      await storeAuth({ ...auth, creditsLeft: result.creditsLeft });
    }
    return renderResult(result);
  } catch {
    return UNREACHABLE_RESULT;
  }
};

/**
 * Intercepts personal_sign / eth_signTypedData* requests. Most modern drainers
 * steal funds via a blind signature (EIP-2612 permit, Permit2, Seaport order)
 * rather than an on-chain transaction, so this closes the gap onTransaction alone
 * leaves open. Requires the `endowment:signature-insight` permission.
 */
export const onSignature: OnSignatureHandler = async ({ signature, signatureOrigin }) => {
  const data =
    typeof signature.data === "string" ? signature.data : JSON.stringify(signature.data);

  try {
    const response = await fetch(GATE_SIGNATURE_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sig: {
          chainId: 1,
          from: signature.from,
          method: signature.signatureMethod,
          data,
          origin: signatureOrigin,
        },
      }),
    });
    return renderResult((await response.json()) as GateResult);
  } catch {
    return UNREACHABLE_RESULT;
  }
};
