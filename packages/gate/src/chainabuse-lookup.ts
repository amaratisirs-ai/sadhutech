// Per-address ChainAbuse lookup for Pro "deep checks" (activates when CHAINABUSE_API_KEY is set).
export interface ChainAbuseHit {
  flagged: boolean;
  category?: string;
  reports?: number;
}

export function premiumAvailable(): boolean {
  return !!process.env.CHAINABUSE_API_KEY;
}

export async function lookupChainAbuse(address: string): Promise<ChainAbuseHit | null> {
  const key = process.env.CHAINABUSE_API_KEY;
  if (!key) return null; // premium not configured — caller treats as "unavailable"
  try {
    const auth = Buffer.from(`${key}:`).toString("base64");
    const res = await fetch(
      `https://api.chainabuse.com/v0/reports?address=${encodeURIComponent(address)}&perPage=5`,
      { headers: { Authorization: `Basic ${auth}`, "User-Agent": "GENESIS-Gate/1.0" } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { reports?: { scamCategory?: string }[]; count?: number };
    const reports = data.reports ?? [];
    if (reports.length === 0) return { flagged: false };
    return { flagged: true, category: reports[0]?.scamCategory, reports: data.count ?? reports.length };
  } catch {
    return null;
  }
}
