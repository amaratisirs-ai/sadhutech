// Toolbar popup - protection on/off toggle, plus the Deep Check (Pro credits) enrollment flow.
import type { ProAuth } from "./messages.js";

const GATE_URL = "https://genesis-gate.onrender.com";
const CONNECT_URL = "https://sadhutech.com/extension-connect";
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
const disconnectLink = document.querySelector<HTMLAnchorElement>("#disconnect-link");

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
  if (disconnectLink) disconnectLink.style.display = auth ? "block" : "none";
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
  if (!connectBtn) return;
  connectBtn.disabled = true;
  connectBtn.textContent = "Opening connect tab\u2026";
  setStatus("Complete the connection in the new tab, then reopen this popup.");
  try {
    await chrome.tabs.create({ url: CONNECT_URL });
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

// If the connect tab (still open, or already closed) hands off a credential while this
// popup happens to be open, reflect it immediately instead of requiring a reopen.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.genesisProAuth?.newValue) return;
  loadDeepCheckState();
});

disconnectLink?.addEventListener("click", async (e) => {
  e.preventDefault();
  await chrome.storage.local.set({ deepCheckEnabled: false });
  await chrome.storage.local.remove("genesisProAuth");
  if (deepToggle) deepToggle.checked = false;
  if (connectBtn) connectBtn.style.display = "none";
  if (buyLink) buyLink.style.display = "none";
  disconnectLink.style.display = "none";
  setStatus("Off \u2014 checks the community threat feed only.");
});
