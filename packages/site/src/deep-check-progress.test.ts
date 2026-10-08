import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DeepCheckProgress, deepCheckProgress } from "../components/DeepCheckProgress";

describe("deep check progress", () => {
  it("clearly tells users when a wallet signature is required", () => {
    const markup = renderToStaticMarkup(createElement(DeepCheckProgress, { phase: "wallet" }));
    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain("Confirm in wallet");
    expect(markup).toContain("Open your wallet and confirm the signature request");
    expect(markup).toContain("phone");
    expect(markup).toContain("not an on-chain transaction");
  });

  it("distinguishes credit lookup and analysis from waiting for the wallet", () => {
    for (const phase of ["credits", "checking"] as const) {
      const markup = renderToStaticMarkup(createElement(DeepCheckProgress, { phase }));
      expect(markup).toContain(deepCheckProgress[phase].label);
      expect(markup).not.toContain("confirm the signature request");
    }
  });
});