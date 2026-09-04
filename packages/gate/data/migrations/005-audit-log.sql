-- GENESIS audit logging: credit consumption history, security-event trail, and
-- integration-failure visibility (previously all completely unlogged).

CREATE TABLE IF NOT EXISTS credit_ledger (
  id SERIAL PRIMARY KEY,
  address TEXT NOT NULL,
  amount INTEGER NOT NULL,
  verdict TEXT,
  flagged BOOLEAN,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS security_events (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  subject TEXT,
  severity TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS integration_failures (
  id SERIAL PRIMARY KEY,
  integration TEXT NOT NULL,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_address ON credit_ledger(address);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_integration_failures_integration ON integration_failures(integration);
