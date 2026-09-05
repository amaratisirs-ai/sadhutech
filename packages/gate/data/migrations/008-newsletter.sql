-- Newsletter/email-journey framework: consenting subscribers and a record of
-- which timed journey steps (welcome, tips, monthly newsletter, etc.) have
-- already been sent to each one, so re-runs never duplicate a send.

CREATE TABLE IF NOT EXISTS email_subscribers (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  wallet_address TEXT,
  consent_version TEXT,
  source TEXT,
  unsubscribe_token TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS email_sends (
  id SERIAL PRIMARY KEY,
  subscriber_id INTEGER NOT NULL REFERENCES email_subscribers(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON email_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_email_sends_subscriber ON email_sends(subscriber_id);
