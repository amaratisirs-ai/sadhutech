// Renders a full-screen warning overlay directly into the page's DOM (isolated-world content
// scripts share the page's DOM even though they don't share its JS variables/objects).
import type { Verdict } from "./messages.js";

const THEME: Record<Exclude<Verdict, "allow">, { bg: string; border: string; label: string }> = {
  warn: { bg: "#451a03", border: "#f59e0b", label: "WARNING" },
  block: { bg: "#450a0a", border: "#ef4444", label: "BLOCKED BY GENESIS" },
};

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
