-- Capture request context on consent events (IP, user agent, coarse geo) so
-- consent records are independently verifiable, not just self-reported.

ALTER TABLE consent_log ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE consent_log ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE consent_log ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE consent_log ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE consent_log ADD COLUMN IF NOT EXISTS city TEXT;
