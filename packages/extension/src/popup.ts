// Toolbar popup - protection on/off toggle, plus the Deep Check (Pro credits) enrollment flow.
import type { ProAuth } from "./messages.js";

const GATE_URL = "https://genesis-gate.onrender.com";
const PRO_AUTH_TTL_MS = 23 * 60 * 60 * 1000;

const toggle = document.querySelector<HTMLInputElement>("#enabled-toggle");
if (toggle) {
  chrome.storage.local.get("genesisEnabled").then((s) => {
    toggle.checked = s.genesisEnabled !== false;
  });
  toggle.addEventListener("change", () => {
    chrome.storage.local.set({ genesisEnabled: toggle.checked });
  });
}

const deepToggle = document.querySelector<HTMLInputElement>("#deep-check-toggle");
const statusEl = document.querySelector<HTMLDivElement>("#deep-check-status");
const connectBtn = document.querySelector<HTMLButtonElement>("#connect-btn");
const buyLink = document.querySelector<HTMLAnchorElement>("#buy-credits-link");

function short(addr: string): string {
  return `${addr.slice(0, 6)}\u2026${addr.slice(-4)}`;
}

function setStatus(text: string): void {
  if (statusEl) statusEl.textContent = text;
}

async function refreshCredits(address: string): Promise<void> {
  try {
    const res = await fetch(`${GATE_URL}/v1/pro/status/${address}`);
    if (!res.ok) throw new Error();
    const s = (await res.json()) as { premium?: boolean; credits?: number };
    if (!s.premium) {
      setStatus(`Connected: ${short(address)} \u2014 Deep Check launching soon.`);
      if (buyLink) buyLink.style.display = "none";
      return;
    }
    setStatus(`Connected: ${short(address)} \u2014 ${s.credits ?? 0} credit${s.credits === 1 ? "" : "s"} left`);
    if (buyLink) buyLink.style.display = !s.credits || s.credits < 1 ? "block" : "none";
  } catch {
    setStatus(`Connected: ${short(address)} \u2014 credit balance unavailable right now.`);
  }
}

async function loadDeepCheckState(): Promise<void> {
  const stored = await chrome.storage.local.get(["deepCheckEnabled", "genesisProAuth"]);
  const auth = stored.genesisProAuth as ProAuth | undefined;
  const fresh = !!auth && Date.now() - auth.ts < PRO_AUTH_TTL_MS;
  if (deepToggle) deepToggle.checked = !!stored.deepCheckEnabled && fresh;
  if (!auth) {
    setStatus("Off \u2014 checks the community threat feed only.");
    return;
  }
  if (stored.deepCheckEnabled && fresh) {
    await refreshCredits(auth.address);
  } else {
    setStatus(fresh ? "Off \u2014 checks the community threat feed only." : "Your authorization expired \u2014 reconnect to re-enable.");
  }
}

async function authorizeAndEnable(): Promise<void> {
  if (!deepToggle || !connectBtn) return;
  connectBtn.disabled = true;
  connectBtn.textContent = "Connecting\u2026";
  setStatus("Check your wallet for a signature request\u2026");
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error("No active tab found.");
    const response = await chrome.tabs.sendMessage(tab.id, { type: "genesis-authorize" });
    if (response?.error || !response?.address || !response?.signature) {
      throw new Error(response?.error || "Wallet did not return a signature.");
    }
    const auth: ProAuth = { address: response.address, message: response.message, signature: response.signature, ts: Date.now() };
    await chrome.storage.local.set({ deepCheckEnabled: true, genesisProAuth: auth });
    connectBtn.style.display = "none";
    await refreshCredits(auth.address);
  } catch (err) {
    deepToggle.checked = false;
    setStatus(
      err instanceof Error
        ? `Couldn't enable: ${err.message}`
        : "Couldn't enable Deep Check. Open a regular webpage (not a new tab) and try again."
    );
  } finally {
    connectBtn.disabled = false;
    connectBtn.textContent = "Connect wallet & enable";
  }
}

if (deepToggle && connectBtn) {
  deepToggle.addEventListener("change", async () => {
    if (!deepToggle.checked) {
      await chrome.storage.local.set({ deepCheckEnabled: false });
      connectBtn.style.display = "none";
      if (buyLink) buyLink.style.display = "none";
      setStatus("Off \u2014 checks the community threat feed only.");
      return;
    }
    const stored = await chrome.storage.local.get("genesisProAuth");
    const auth = stored.genesisProAuth as ProAuth | undefined;
    const fresh = !!auth && Date.now() - auth.ts < PRO_AUTH_TTL_MS;
    if (fresh && auth) {
      await chrome.storage.local.set({ deepCheckEnabled: true });
      await refreshCredits(auth.address);
      return;
    }
    connectBtn.style.display = "block";
    await authorizeAndEnable();
  });
  connectBtn.addEventListener("click", authorizeAndEnable);
  loadDeepCheckState();
}
