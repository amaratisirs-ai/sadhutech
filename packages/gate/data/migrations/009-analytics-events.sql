-- 360 view for the admin dashboard: logins, page views, transaction checks, errors, "stuck" reports.
CREATE TABLE IF NOT EXISTS analytics_events (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  wallet TEXT,
  page TEXT,
  chain_id INTEGER,
  verdict TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS analytics_events_type_created_idx ON analytics_events (event_type, created_at);
CREATE INDEX IF NOT EXISTS analytics_events_wallet_idx ON analytics_events (wallet);
