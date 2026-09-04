-- Consent acceptance audit trail: wallet-connect, Snap install, and Snap
-- one-time authorization all record acceptance of Terms/Privacy here.

CREATE TABLE IF NOT EXISTS consent_log (
  id SERIAL PRIMARY KEY,
  address TEXT,
  type TEXT NOT NULL,
  version TEXT NOT NULL,
  context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_log_address ON consent_log(address);
CREATE INDEX IF NOT EXISTS idx_consent_log_type ON consent_log(type);
