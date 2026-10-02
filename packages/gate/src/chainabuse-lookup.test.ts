import { afterEach, describe, expect, it, vi } from "vitest";
import { lookupChainAbuse } from "./chainabuse-lookup.js";

describe("lookupChainAbuse", () => {
  const originalKey = process.env.CHAINABUSE_API_KEY;
  const originalFetch = global.fetch;

  afterEach(() => {
    if (originalKey === undefined) delete process.env.CHAINABUSE_API_KEY;
    else process.env.CHAINABUSE_API_KEY = originalKey;
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("uses the API key as both Basic-auth username and password", async () => {
    process.env.CHAINABUSE_API_KEY = "test-key";
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      count: 2,
      reports: [{ scamCategory: "PHISHING" }],
    }), { status: 200 }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(lookupChainAbuse("0xabc")).resolves.toEqual({ flagged: true, category: "PHISHING", reports: 2 });
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe(`Basic ${Buffer.from("test-key:test-key").toString("base64")}`);
  });

  it("returns a clean hit when the API responds with no reports", async () => {
    process.env.CHAINABUSE_API_KEY = "test-key";
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ count: 0, reports: [] }), { status: 200 })) as unknown as typeof fetch;

    await expect(lookupChainAbuse("0xabc")).resolves.toEqual({ flagged: false });
  });
});