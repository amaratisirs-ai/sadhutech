import { afterEach, describe, expect, it, vi } from "vitest";
import { deduplicateThreatAddresses, fetchPublicAddressFeed, parsePublicAddressFeed, persistThreatBatches, publicAddressFeeds } from "./public-address-feeds.js";

const address = `0x${"ab".repeat(20)}`;
const otherAddress = `0x${"cd".repeat(20)}`;

afterEach(() => vi.unstubAllGlobals());

describe("public address feeds", () => {
  it("validates and deduplicates MyEtherWallet addresses case-insensitively", () => {
    const threats = parsePublicAddressFeed(JSON.stringify([
      { address: ` ${address.toUpperCase()} ` }, { address },
      { address: "phishing.example" }, { address: "0x123" },
      { address: `0x${"0".repeat(40)}` }, null, { comment: "missing" },
    ]), "myetherwallet");
    expect(threats).toEqual([expect.objectContaining({ address, category: "phishing", source: "myetherwallet" })]);
  });

  it("uses structured CSV parsing and only imports phishing labels", () => {
    const csv = `address,etherscan_tag,etherscan_labels,is_contract\r\n${address},"Fake, Phishing",phish-hack,False\r\n${address.toUpperCase()},Fake_Phishing,phish-hack,True\r\n${otherAddress},Whitehat,whitehat,False\r\ninvalid,Fake,phish-hack,False\r\n`;
    expect(parsePublicAddressFeed(csv, "forta-phishing")).toEqual([
      expect.objectContaining({ address, category: "phishing", source: "forta-phishing" }),
    ]);
  });

  it("deduplicates overlapping sources while preserving first-source classification", () => {
    const first = { address: address.toUpperCase() as `0x${string}`, category: "drainer" as const, source: "curated" };
    const overlap = { address: address as `0x${string}`, category: "phishing" as const, source: "myetherwallet" };
    expect(deduplicateThreatAddresses([first, overlap])).toEqual([{ ...first, address }]);
    expect(deduplicateThreatAddresses([first, overlap, first, overlap])).toHaveLength(1);
  });

  it("rejects malformed, empty and oversized data", () => {
    expect(() => parsePublicAddressFeed("{}", "myetherwallet")).toThrow("records");
    expect(() => parsePublicAddressFeed("[]", "myetherwallet")).toThrow("no supported");
    expect(() => parsePublicAddressFeed("<html>Error</html>", "forta-phishing")).toThrow();
    expect(() => parsePublicAddressFeed(" ".repeat(5 * 1024 * 1024 + 1), "myetherwallet")).toThrow("size limit");
  });

  it("fetches only configured sources with a deadline", async () => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify([{ address }])));
    vi.stubGlobal("fetch", request);
    expect(await fetchPublicAddressFeed(publicAddressFeeds[0])).toHaveLength(1);
    expect(request).toHaveBeenCalledWith(publicAddressFeeds[0].url, expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it("rejects failed HTTP responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("offline", { status: 503 })));
    await expect(fetchPublicAddressFeed(publicAddressFeeds[0])).rejects.toThrow("HTTP 503");
  });

  it("writes bounded batches with stable reporters and no trust escalation", async () => {
    const threats = Array.from({ length: 601 }, (_, index) => ({
      address: `0x${(index + 1).toString(16).padStart(40, "0")}` as `0x${string}`,
      category: "phishing" as const,
      source: "forta-phishing",
    }));
    const intel = { batchReport: vi.fn(async (requests) => requests.length), report: vi.fn() };
    expect(await persistThreatBatches(intel, threats)).toEqual({ processed: 601, errors: 0 });
    expect(intel.batchReport.mock.calls.map(([requests]) => requests.length)).toEqual([250, 250, 101]);
    expect(intel.batchReport.mock.calls[0]?.[0]?.[0]).toEqual({ address: threats[0]?.address, category: "phishing", reporterId: "sync-forta-phishing" });
    expect(intel.report).not.toHaveBeenCalled();
  });

  it("isolates bad rows when a batch fails", async () => {
    const threats = parsePublicAddressFeed(JSON.stringify([{ address }, { address: otherAddress }]), "myetherwallet");
    const intel = { batchReport: vi.fn().mockRejectedValue(new Error("batch failed")), report: vi.fn().mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("bad row")) };
    expect(await persistThreatBatches(intel, threats)).toEqual({ processed: 1, errors: 1 });
    expect(intel.report).toHaveBeenCalledTimes(2);
  });
});