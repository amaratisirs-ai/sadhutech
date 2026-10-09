import { parse } from "csv-parse/sync";
import type { Address, ReportRequest, ThreatCategory } from "@genesis/shared";

export interface PublicAddressThreat {
  address: Address;
  category: ThreatCategory;
  source: string;
  title?: string;
}

const MAX_FEED_BYTES = 5 * 1024 * 1024;

function normalizeAddress(value: unknown): Address | null {
  if (typeof value !== "string") return null;
  const address = value.trim().toLowerCase();
  return /^0x[a-f0-9]{40}$/.test(address) && address !== `0x${"0".repeat(40)}` ? address as Address : null;
}

export function parsePublicAddressFeed(text: string, source: "myetherwallet" | "forta-phishing"): PublicAddressThreat[] {
  if (Buffer.byteLength(text, "utf8") > MAX_FEED_BYTES) throw new Error("Public address feed exceeds size limit");
  const records: unknown = source === "myetherwallet" ? JSON.parse(text) : parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });
  if (!Array.isArray(records)) throw new Error("Public address feed must contain records");
  const unique = new Map<string, PublicAddressThreat>();
  for (const record of records) {
    if (!record || typeof record !== "object") continue;
    const entry = record as Record<string, unknown>;
    if (source === "forta-phishing" && entry.etherscan_labels !== "phish-hack") continue;
    const address = normalizeAddress(entry.address);
    if (!address) continue;
    unique.set(address, {
      address,
      category: "phishing",
      source,
      title: source === "myetherwallet" ? "MyEtherWallet: Community Address Warning" : "Forta: Historical Etherscan Phishing Label",
    });
  }
  if (unique.size === 0) throw new Error("Public address feed contains no supported addresses");
  return [...unique.values()];
}

async function readFeed(response: Response): Promise<string> {
  if (!response.ok) throw new Error(`Public address feed returned HTTP ${response.status}`);
  if (!response.body) throw new Error("Public address feed has no body");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_FEED_BYTES) throw new Error("Public address feed exceeds size limit");
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
  return Buffer.concat(chunks).toString("utf8");
}

export const publicAddressFeeds = [
  { name: "myetherwallet", url: "https://raw.githubusercontent.com/MyEtherWallet/ethereum-lists/master/src/addresses/addresses-darklist.json" },
  { name: "forta-phishing", url: "https://raw.githubusercontent.com/forta-network/labelled-datasets/main/labels/1/phishing_scams.csv" },
] as const;

export async function fetchPublicAddressFeed(source: typeof publicAddressFeeds[number]): Promise<PublicAddressThreat[]> {
  const response = await fetch(source.url, {
    signal: AbortSignal.timeout(15_000),
    headers: { "User-Agent": "GENESIS-Gate/1.0" },
  });
  return parsePublicAddressFeed(await readFeed(response), source.name);
}

export function deduplicateThreatAddresses(threats: Array<{ address: string; category: ThreatCategory; source: string; title?: string }>): PublicAddressThreat[] {
  const unique = new Map<string, PublicAddressThreat>();
  for (const threat of threats) {
    const address = normalizeAddress(threat.address);
    if (address && !unique.has(address)) unique.set(address, { ...threat, address });
  }
  return [...unique.values()];
}

export async function persistThreatBatches(
  intel: { batchReport: (requests: ReportRequest[]) => Promise<number>; report: (request: ReportRequest) => Promise<unknown> },
  threats: PublicAddressThreat[]
): Promise<{ processed: number; errors: number }> {
  let processed = 0;
  let errors = 0;
  for (let offset = 0; offset < threats.length; offset += 250) {
    const requests = threats.slice(offset, offset + 250).map((threat) => ({
      address: threat.address,
      category: threat.category,
      reporterId: `sync-${threat.source}`,
    }));
    try {
      processed += await intel.batchReport(requests);
    } catch {
      for (const request of requests) {
        try {
          await intel.report(request);
          processed++;
        } catch {
          errors++;
        }
      }
    }
  }
  return { processed, errors };
}