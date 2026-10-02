import { describe, expect, it } from "vitest";
import { requiresWalletRuntime } from "./routes";

describe("wallet runtime routes", () => {
  it("loads wallet tools for checks, paid features, and administration", () => {
    for (const route of ["/check", "/pro", "/admin", "/admin/todos", "/admin/architecture", "/extension-connect"]) {
      expect(requiresWalletRuntime(route)).toBe(true);
    }
  });

  it("keeps the homepage and public pages wallet-free", () => {
    for (const route of ["/", "/threats", "/privacy", "/products", "/connected", "/checkout"]) {
      expect(requiresWalletRuntime(route)).toBe(false);
    }
  });
});