// Renders a full-screen warning overlay directly into the page's DOM (isolated-world content
// scripts share the page's DOM even though they don't share its JS variables/objects).
import type { Verdict } from "./messages.js";

const THEME: Record<Exclude<Verdict, "allow">, { bg: string; border: string; label: string }> = {
  warn: { bg: "#451a03", border: "#f59e0b", label: "WARNING" },
  block: { bg: "#450a0a", border: "#ef4444", label: "BLOCKED BY GENESIS" },
};

// Small non-blocking pill shown the instant a request is intercepted, so the page never looks
// frozen/unresponsive while the gate call is in flight. Call the returned function to dismiss it.
export function showChecking(): () => void {
  const pill = document.createElement("div");
  pill.style.cssText = `
    position: fixed; top: 16px; right: 16px; z-index: 2147483647; display: flex; align-items: center;
    gap: 8px; padding: 10px 14px; border-radius: 999px; background: #0f172a; border: 1px solid #334155;
    color: #cbd5e1; font: 600 12px system-ui, sans-serif; box-shadow: 0 8px 24px rgba(0,0,0,0.35);
  `;
  pill.innerHTML = `
    <span style="width: 12px; height: 12px; border: 2px solid #475569; border-top-color: #2dd4bf;
                 border-radius: 50%; display: inline-block; animation: genesis-spin 0.7s linear infinite;"></span>
    GENESIS checking...
    <style>@keyframes genesis-spin { to { transform: rotate(360deg); } }</style>
  `;
  document.documentElement.appendChild(pill);
  return () => pill.remove();
}

// Brief, auto-dismissing notice shown when a request silently passes (verdict "allow") but
// still spent a Deep Check credit, so the user isn't surprised by their balance dropping.
export function showCreditNotice(creditsLeft: number): void {
  const pill = document.createElement("div");
  pill.style.cssText = `
    position: fixed; top: 16px; right: 16px; z-index: 2147483647; padding: 10px 14px;
    border-radius: 999px; background: #0f172a; border: 1px solid #2dd4bf; color: #5eead4;
    font: 600 12px system-ui, sans-serif; box-shadow: 0 8px 24px rgba(0,0,0,0.35);
  `;
  pill.textContent = `\u{1F6E1} Deep Check used \u2014 ${creditsLeft} credit${creditsLeft === 1 ? "" : "s"} left`;
  document.documentElement.appendChild(pill);
  setTimeout(() => pill.remove(), 3000);
}

export function showOverlay(verdict: Exclude<Verdict, "allow">, plainEnglish: string): Promise<boolean> {
  return new Promise((resolve) => {
    const theme = THEME[verdict];
    const root = document.createElement("div");
    root.style.cssText = `
      position: fixed; inset: 0; z-index: 2147483647; display: flex; align-items: center;
      justify-content: center; background: rgba(0,0,0,0.75); font-family: system-ui, sans-serif;
    `;
    root.innerHTML = `
      <div style="max-width: 420px; width: 90%; background: ${theme.bg}; border: 2px solid ${theme.border};
                  border-radius: 16px; padding: 24px; color: #f1f5f9; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
        <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.05em; color: ${theme.border}; margin-bottom: 8px;">
          🛡 GENESIS &middot; ${theme.label}
        </div>
        <p style="font-size: 14px; line-height: 1.5; margin: 0 0 20px;">${plainEnglish}</p>
        <div style="display: flex; gap: 10px;">
          <button id="genesis-cancel" style="flex: 1; padding: 10px; border-radius: 8px; border: none;
                  background: #1e293b; color: #f1f5f9; font-weight: 600; cursor: pointer;">Cancel</button>
          <button id="genesis-proceed" style="flex: 1; padding: 10px; border-radius: 8px; border: none;
                  background: ${theme.border}; color: #0f172a; font-weight: 700; cursor: pointer;">Proceed anyway</button>
        </div>
      </div>
    `;
    document.documentElement.appendChild(root);

    const cleanup = (proceed: boolean) => {
      root.remove();
      resolve(proceed);
    };
    root.querySelector("#genesis-cancel")?.addEventListener("click", () => cleanup(false));
    root.querySelector("#genesis-proceed")?.addEventListener("click", () => cleanup(true));
  });
}
