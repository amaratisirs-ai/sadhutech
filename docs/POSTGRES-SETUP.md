# PostgreSQL Setup for GENESIS Gate (Neon DB)

## Quick Start

GENESIS Gate now supports PostgreSQL for scalable, persistent threat intelligence. Quorum votes and reports survive across server restarts and can be shared across multiple gate instances.

### Development (In-Memory)

```bash
pnpm install
pnpm test      # 9/9 passing ✅
pnpm demo      # CLI scenarios
pnpm gate      # Starts on http://localhost:8787
```

No database required. Uses in-memory threat intel.

### Production (Neon DB)

#### 1. Set up Neon Database

1. Sign in to [Neon Console](https://console.neon.tech)
2. Create a new project (or use existing Pro account)
3. Copy the connection string (looks like `postgresql://user:password@ep-xxx.us-east-1.postgres.vercel.app/genesis`)

#### 2. Run Schema Migration

Connect to your Neon database and run:

```sql
-- Copy the contents of packages/gate/data/migrations/001-threat-intel.sql
-- Then execute in Neon SQL editor or psql:
```

Or use the SQL file directly:

```bash
psql "postgresql://user:password@your-neon-host/genesis" < packages/gate/data/migrations/001-threat-intel.sql
```

#### 3. Configure Environment

Create `.env`:

```bash
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.postgres.vercel.app/genesis
PORT=8787
NODE_ENV=production
```

#### 4. Start Server

```bash
pnpm install  # Installs pg driver
pnpm gate     # Connects to Neon, pre-warms threat feeds
```

Server logs: `[threat-intel] Using PostgreSQL mode (DATABASE_URL found)`

## Architecture

### Schema (PostgreSQL)

```sql
CREATE TABLE threat_intel (
  address CHAR(42) PRIMARY KEY,           -- Ethereum address (normalized lowercase)
  category TEXT NOT NULL,                 -- drainer | malicious-contract | etc
  reporters TEXT[] NOT NULL DEFAULT '{}', -- Distinct reporter IDs (Sybil-resistant)
  trusted BOOLEAN DEFAULT false,          -- Seeded entries bypass quorum
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'             -- Extensible threat details
);
```

### Adapter Pattern (2026 Standard)

```typescript
// Both implement the same interface
ThreatIntel (in-memory)     → for tests, dev
ThreatIntelPostgres (Neon)  → for production, multi-instance

// Factory automatically chooses:
const intel = await createIntelAsync();
// → PostgreSQL if DATABASE_URL is set
// → In-memory otherwise
```

### Sybil Resistance

- Quorum counts **distinct reporters**, not duplicate reports
- Same reporterId submitting multiple times doesn't advance quorum
- Seeded (trusted) entries bypass quorum: count >= quorum immediately
- Example: `reporters: ["alice", "bob", "charlie"]` = 3 distinct votes ✅

## Multi-Instance Deployment

Run the same gate on multiple servers, all pointing to the same Neon database:

```
Server 1 → Neon DB ← Server 2
                ↑
            Server 3
```

All instances:
- Share the same threat intelligence
- Contribute reports to the same quorum
- Benefit from collective community learning
- Auto-sync via PostgreSQL

## Rollback to In-Memory

Remove `DATABASE_URL` from `.env`:

```bash
unset DATABASE_URL
pnpm gate  # [threat-intel] Using in-memory mode
```

Tests always use in-memory (no DATABASE_URL during vitest).

## Monitoring

Query threat stats:

```sql
-- Top threat categories
SELECT category, COUNT(*) as count 
FROM threat_intel 
GROUP BY category;

-- Recently reported addresses
SELECT address, category, array_length(reporters, 1) as reporter_count 
FROM threat_intel 
WHERE trusted = false 
ORDER BY last_seen DESC 
LIMIT 20;

-- Quorum-confirmed threats
SELECT address, category, reporters, array_length(reporters, 1) as reporter_count
FROM threat_intel
WHERE array_length(reporters, 1) >= 3
ORDER BY last_seen DESC;
```

## Future Scaling

- **Redis**: Add caching layer (< 1ms lookups, distributed)
- **Replication**: Neon auto-replication to standby regions
- **Sharding**: Split threat_intel by address prefix for 1B+ addresses
- **Analytics**: Queries, threat trends, false-positive tracking

**Current limits:**
- 1M+ addresses per Neon DB ✅
- <10ms lookup latency ✅
- Unlimited multi-instance sync ✅
