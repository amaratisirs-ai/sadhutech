import type {
  Address,
  ReportRequest,
  ThreatCategory,
  ThreatEntry,
} from "@genesis/shared";
import { DEFAULT_QUORUM } from "@genesis/shared";

interface IntelRecord {
  category: ThreatCategory;
  reporters: Set<string>;
  /** Trusted/curated entries are confirmed regardless of reporter count. */
  trusted: boolean;
  firstSeen: number;
  lastSeen: number;
}

/**
 * Community threat intel with quorum confirmation — the "waggle-dance" signal
 * layer, lite. A reported address is only treated as confirmed once a quorum of
 * DISTINCT reporters agree (Sybil resistance), or if it came from a curated feed.
 * In-memory for the MVP; swappable for a shared store later.
 */
export class ThreatIntel {
  private readonly records = new Map<Address, IntelRecord>();

  constructor(private readonly quorum: number = DEFAULT_QUORUM) {}

  /** Load curated/known-bad entries (treated as immediately confirmed). */
  seed(entries: Array<{ address: Address; category: ThreatCategory }>): void {
    const now = Date.now();
    for (const e of entries) {
      const key = e.address.toLowerCase() as Address;
      this.records.set(key, {
        category: e.category,
        reporters: new Set(),
        trusted: true,
        firstSeen: now,
        lastSeen: now,
      });
    }
  }

  /** Record a community report; counts distinct reporters toward quorum. */
  report(req: ReportRequest): ThreatEntry {
    const key = req.address.toLowerCase() as Address;
    const now = Date.now();
    const existing = this.records.get(key);
    if (existing) {
      existing.reporters.add(req.reporterId);
      existing.lastSeen = now;
      // Escalating categories win (a drainer report upgrades a phishing flag).
      existing.category = req.category;
      return this.toEntry(key, existing);
    }
    const record: IntelRecord = {
      category: req.category,
      reporters: new Set([req.reporterId]),
      trusted: false,
      firstSeen: now,
      lastSeen: now,
    };
    this.records.set(key, record);
    return this.toEntry(key, record);
  }

  /** Return the confirmed/unconfirmed threat entry for an address, if any. */
  lookup(address: Address): ThreatEntry | undefined {
    const key = address.toLowerCase() as Address;
    const record = this.records.get(key);
    return record ? this.toEntry(key, record) : undefined;
  }

  private toEntry(address: Address, r: IntelRecord): ThreatEntry {
    const reports = r.trusted ? Math.max(this.quorum, r.reporters.size) : r.reporters.size;
    return {
      address,
      category: r.category,
      reports,
      quorumReached: r.trusted || r.reporters.size >= this.quorum,
      firstSeen: r.firstSeen,
      lastSeen: r.lastSeen,
    };
  }
}
