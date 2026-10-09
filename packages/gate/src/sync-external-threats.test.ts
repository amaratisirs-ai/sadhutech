import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReportRequest } from "@genesis/shared";
import type { ThreatIntelPostgres } from "./intel-postgres.js";
import { syncExternalThreats } from "./sync-external-threats.js";

const address = (index: number) => `0x${index.toString(16).padStart(40, "0")}`;

vi.mock("fs/promises", () => ({
  readFile: vi.fn(async () => JSON.stringify({ entries: [{ address: `0x${"1".padStart(40, "0")}`, category: "drainer" }] })),
}));

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("public threat sync", () => {
  it("imports the full feed, avoids paid APIs and keeps one row per address on repeat", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const request = vi.fn(async (url: string) => {
      if (url.includes("scamsniffer")) return new Response(JSON.stringify(Array.from({ length: 1005 }, (_, index) => address(index + 1))));
      if (url.includes("CryptoScamDB")) return new Response(`addresses: [${address(1006)}]`);
      if (url.includes("MyEtherWallet")) return new Response(JSON.stringify([{ address: address(1).toUpperCase() }, { address: address(1007) }]));
      if (url.includes("forta-network")) return new Response(`address,etherscan_tag,etherscan_labels,is_contract\n${address(1007)},Fake,phish-hack,False\n${address(1008)},Fake,phish-hack,False\n`);
      throw new Error("Unexpected non-public source");
    });
    vi.stubGlobal("fetch", request);
    const rows = new Map<string, { category: string; reporters: Set<string> }>();
    const batchReport = vi.fn(async (reports: ReportRequest[]) => {
      for (const report of reports) {
        const existing = rows.get(report.address);
        const reporters = existing?.reporters ?? new Set<string>();
        reporters.add(report.reporterId);
        rows.set(report.address, { category: report.category, reporters });
      }
      return reports.length;
    });
    const intel = { batchReport, report: vi.fn() } as unknown as ThreatIntelPostgres;
    const first = await syncExternalThreats(intel, { publicOnly: true });
    const second = await syncExternalThreats(intel, { publicOnly: true });
    expect(first).toMatchObject({ total_threats: 1008, total_errors: 0, deduplication_removed: 3 });
    expect(second.total_threats).toBe(1008);
    expect(rows.size).toBe(1008);
    expect(rows.get(address(1005))).toBeDefined();
    expect(rows.get(address(1))?.category).toBe("drainer");
    expect(rows.get(address(1007))?.reporters).toEqual(new Set(["sync-myetherwallet"]));
    expect(rows.get(address(1008))?.reporters).toEqual(new Set(["sync-forta-phishing"]));
    expect(first.sources.map((source) => source.name)).toEqual(["curated", "scam-sniffer", "cryptoscamdb", "myetherwallet", "forta-phishing"]);
    expect(batchReport.mock.calls.every(([reports]) => reports.length <= 250)).toBe(true);
    expect(request).toHaveBeenCalledTimes(8);
  });

  it("continues importing other feeds when a new source fails", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("scamsniffer")) return new Response(JSON.stringify([address(2)]));
      if (url.includes("MyEtherWallet")) return new Response("offline", { status: 503 });
      if (url.includes("forta-network")) return new Response(`address,etherscan_tag,etherscan_labels,is_contract\n${address(3)},Fake,phish-hack,False\n`);
      return new Response("[]");
    }));
    const intel = { batchReport: vi.fn(async (reports: ReportRequest[]) => reports.length), report: vi.fn() } as unknown as ThreatIntelPostgres;
    const result = await syncExternalThreats(intel, { publicOnly: true });
    expect(result.total_threats).toBe(3);
    expect(result.sources.find((source) => source.name === "myetherwallet")).toMatchObject({ status: "failed", errors: 1 });
    expect(result.sources.find((source) => source.name === "forta-phishing")?.count).toBe(1);
  });
});