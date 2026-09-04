-- GENESIS Pro access (wallet-based, crypto pay-per-period)
-- A wallet gets Pro until expires_at. Payments are recorded once (tx_hash) to prevent double-redeem.

CREATE TABLE IF NOT EXISTS pro_access (
  address TEXT PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL,
  tx_hash TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pro_payments (
  tx_hash TEXT PRIMARY KEY,
  address TEXT NOT NULL,
  amount TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pro_access_expires ON pro_access(expires_at);
