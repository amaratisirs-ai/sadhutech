import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Address } from "@genesis/shared";
import { analyze, analyzeSignature } from "./analyze.js";
import { createIntel } from "./index.js";
import { __resetGoPlusTokenCache } from "./goplus-lookup.js";

const FROM = "0x1111111111111111111111111111111111111111" as Address;
const SUSPECT = "0x6666666666666666666666666666666666666666" as Address;

function tx(to: Address) {
  return { chainId: 1, from: FROM, to, value: "1000", data: "0x" as const };
}

const TOKEN_RESPONSE = new Response(
  JSON.stringify({ code: 1, result: { access_token: "test-token", expires_in: 300 } }),
  { status: 200 }
);

describe("GoPlus Security cross-check", () => {
  const originalAppKey = process.env.GOPLUS_APP_KEY;
  const originalAppSecret = process.env.GOPLUS_APP_SECRET;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.GOPLUS_APP_KEY = "test-app-key";
    process.env.GOPLUS_APP_SECRET = "test-app-secret";
    __resetGoPlusTokenCache();
  });

  afterEach(() => {
    process.env.GOPLUS_APP_KEY = originalAppKey;
    process.env.GOPLUS_APP_SECRET = originalAppSecret;
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("flags an address GoPlus reports as malicious", async () => {
    global.fetch = vi.fn(async (url: string | URL | Request) => {
      if (url.toString().includes("/api/v1/token")) return TOKEN_RESPONSE.clone();
      return new Response(
        JSON.stringify({ code: 1, result: { phishing_activities: "1", stealing_attack: "1" } }),
        { status: 200 }
      );
    }) as unknown as typeof fetch;

    const result = await analyze({ tx: tx(SUSPECT) }, createIntel());
    expect(result.findings.map((f) => f.id)).toContain("goplus.malicious-address");
    expect(result.verdict).toBe("warn");
  });

  it("does not flag a clean address", async () => {
    global.fetch = vi.fn(async (url: string | URL | Request) => {
      if (url.toString().includes("/api/v1/token")) return TOKEN_RESPONSE.clone();
      return new Response(JSON.stringify({ code: 1, result: { phishing_activities: "0" } }), { status: 200 });
    }) as unknown as typeof fetch;

    const result = await analyze({ tx: tx(SUSPECT) }, createIntel());
    expect(result.findings.map((f) => f.id)).not.toContain("goplus.malicious-address");
    expect(result.verdict).toBe("allow");
  });

  it("fails open when GoPlus is unreachable", async () => {
    global.fetch = vi.fn(async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;

    const result = await analyze({ tx: tx(SUSPECT) }, createIntel());
    expect(result.findings.map((f) => f.id)).not.toContain("goplus.malicious-address");
    expect(result.verdict).toBe("allow");
  });

  it("skips GoPlus entirely when GOPLUS_APP_KEY/SECRET are unset", async () => {
    delete process.env.GOPLUS_APP_KEY;
    delete process.env.GOPLUS_APP_SECRET;
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    await analyze({ tx: tx(SUSPECT) }, createIntel());
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("blocks a signature request originating from a known phishing site", async () => {
    global.fetch = vi.fn(async (url: string | URL | Request) => {
      if (url.toString().includes("/api/v1/token")) return TOKEN_RESPONSE.clone();
      if (url.toString().includes("/api/v1/phishing_site")) {
        return new Response(JSON.stringify({ code: 1, result: { phishing_site: 1 } }), { status: 200 });
      }
      return new Response(JSON.stringify({ code: 1, result: {} }), { status: 200 });
    }) as unknown as typeof fetch;

    const result = await analyzeSignature(
      { sig: { chainId: 1, from: FROM, method: "personal_sign", data: "0xdeadbeef", origin: "https://evil-phish.example" } },
      createIntel()
    );
    expect(result.findings.map((f) => f.id)).toContain("goplus.phishing-site");
    expect(result.verdict).toBe("block");
  });

  it("does not flag a signature request from a clean origin", async () => {
    global.fetch = vi.fn(async (url: string | URL | Request) => {
      if (url.toString().includes("/api/v1/token")) return TOKEN_RESPONSE.clone();
      if (url.toString().includes("/api/v1/phishing_site")) {
        return new Response(JSON.stringify({ code: 1, result: { phishing_site: 0 } }), { status: 200 });
      }
      return new Response(JSON.stringify({ code: 1, result: {} }), { status: 200 });
    }) as unknown as typeof fetch;

    const result = await analyzeSignature(
      { sig: { chainId: 1, from: FROM, method: "personal_sign", data: "0xdeadbeef", origin: "https://uniswap.org" } },
      createIntel()
    );
    expect(result.findings.map((f) => f.id)).not.toContain("goplus.phishing-site");
    expect(result.verdict).toBe("allow");
  });

  it("skips the phishing-site check when no origin is provided", async () => {
    const fetchSpy = vi.fn(async (url: string | URL | Request) => {
      if (url.toString().includes("/api/v1/token")) return TOKEN_RESPONSE.clone();
      return new Response(JSON.stringify({ code: 1, result: {} }), { status: 200 });
    });
    global.fetch = fetchSpy as unknown as typeof fetch;

    await analyzeSignature({ sig: { chainId: 1, from: FROM, method: "personal_sign", data: "0xdeadbeef" } }, createIntel());
    const calledUrls = fetchSpy.mock.calls.map((c) => c[0]?.toString() ?? "");
    expect(calledUrls.some((u) => u.includes("phishing_site"))).toBe(false);
  });
});
