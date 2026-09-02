-- GENESIS Threat Intel Schema (PostgreSQL)
-- Scalable, Sybil-resistant community threat intelligence with quorum confirmation.
-- Run once on Neon DB to initialize.

CREATE TABLE IF NOT EXISTS threat_intel (
  -- Primary key: Ethereum address (normalized to lowercase)
  address CHAR(42) PRIMARY KEY,

  -- Threat category (drainer | malicious-contract | decoy-tripwire | sanctioned | phishing)
  category TEXT NOT NULL CHECK (category IN ('drainer', 'malicious-contract', 'decoy-tripwire', 'sanctioned', 'phishing')),

  -- Array of distinct reporter IDs (for Sybil-resistant quorum counting)
  reporters TEXT[] NOT NULL DEFAULT '{}',

  -- True if from curated/seeded feed (bypasses quorum requirement)
  trusted BOOLEAN DEFAULT false,

  -- Timestamps
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),

  -- Extensible metadata (title, incident details, source URL, etc.)
  metadata JSONB DEFAULT '{}'
);

-- Indexes for fast lookups and analytics
CREATE INDEX IF NOT EXISTS idx_threat_intel_category 
  ON threat_intel(category);

CREATE INDEX IF NOT EXISTS idx_threat_intel_trusted 
  ON threat_intel(trusted);

CREATE INDEX IF NOT EXISTS idx_threat_intel_last_seen 
  ON threat_intel(last_seen DESC);

-- Partial index for active threats (recent activity)
CREATE INDEX IF NOT EXISTS idx_threat_intel_active 
  ON threat_intel(last_seen DESC) 
  WHERE last_seen > NOW() - INTERVAL '30 days';

-- Comment for schema documentation
COMMENT ON TABLE threat_intel IS 'Community threat intelligence with Sybil-resistant quorum. Supports multi-instance deployment via Neon DB.';
COMMENT ON COLUMN threat_intel.reporters IS 'Distinct reporter IDs. Count of array elements determines quorum level.';
COMMENT ON COLUMN threat_intel.trusted IS 'Curated entries from official feeds (trusted=true) bypass reporter quorum.';
