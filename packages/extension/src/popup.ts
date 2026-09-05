// Toolbar popup - the only UI surface, just an on/off toggle read by content-script.ts.
const toggle = document.querySelector<HTMLInputElement>("#enabled-toggle");
if (toggle) {
  chrome.storage.local.get("genesisEnabled").then((s) => {
    toggle.checked = s.genesisEnabled !== false;
  });
  toggle.addEventListener("change", () => {
    chrome.storage.local.set({ genesisEnabled: toggle.checked });
  });
}
