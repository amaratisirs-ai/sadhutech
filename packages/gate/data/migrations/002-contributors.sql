-- GENESIS Contributors & Community Gamification Schema
-- Tracks reporter reputation, badges, and leaderboard stats
-- Run after 001-threat-intel.sql

-- Contributors table: track who's reporting threats
CREATE TABLE IF NOT EXISTS contributors (
  -- Unique reporter identifier (device/agent fingerprint or username)
  reporter_id TEXT PRIMARY KEY,
  
  -- Optional: reporter display name (for leaderboard)
  display_name TEXT DEFAULT NULL,
  
  -- Display avatar/badge (emoji or icon)
  avatar TEXT DEFAULT '🛡️',
  
  -- Total threats reported
  total_reports INT NOT NULL DEFAULT 0,
  
  -- Reputation score (0-100): based on accuracy, community feedback, verified reports
  reputation_score INT DEFAULT 50,
  
  -- Reputation badges: "scout" (1st), "guardian" (10), "sentinel" (50), "verified" (high accuracy), "champion" (100+)
  badges TEXT[] DEFAULT '{}',
  
  -- Status: active, inactive, banned
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
  
  -- Contact email (optional, for follow-up on major scams)
  email TEXT DEFAULT NULL,
  
  -- Join date
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Last report date
  last_report_at TIMESTAMPTZ DEFAULT NULL,
  
  -- Metadata: bio, twitter_handle, verified_by (admin name), notes
  metadata JSONB DEFAULT '{}'
);

-- Create contributor entry on first report (via database trigger or application logic)
-- Each report increments total_reports and updates last_report_at

-- Threat reports ledger: track individual reports for accuracy scoring
CREATE TABLE IF NOT EXISTS threat_reports_ledger (
  id BIGSERIAL PRIMARY KEY,
  
  -- Reference to threat address
  address CHAR(42) NOT NULL REFERENCES threat_intel(address) ON DELETE CASCADE,
  
  -- Who reported it
  reporter_id TEXT NOT NULL REFERENCES contributors(reporter_id) ON DELETE CASCADE,
  
  -- What they reported
  category TEXT NOT NULL CHECK (category IN ('drainer', 'malicious-contract', 'decoy-tripwire', 'sanctioned', 'phishing')),
  
  -- Description of the threat
  description TEXT DEFAULT NULL,
  
  -- Evidence: URL to screenshot, tweet, blockchain explorer link, etc.
  evidence_url TEXT DEFAULT NULL,
  
  -- Estimated victim count
  victim_count INT DEFAULT NULL,
  
  -- Affected chains (Ethereum, Polygon, Arbitrum, etc.)
  impacted_chains TEXT[] DEFAULT '{}',
  
  -- Reporter's contact email (optional, for follow-up)
  reporter_email TEXT DEFAULT NULL,
  
  -- Severity self-assessment (reporter's own rating)
  self_assessed_severity TEXT DEFAULT 'medium' CHECK (self_assessed_severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Community votes on accuracy (upvote, downvote, neutral)
  community_upvotes INT DEFAULT 0,
  community_downvotes INT DEFAULT 0,
  
  -- Admin verification: null (pending), true (verified), false (disputed)
  admin_verified BOOLEAN DEFAULT NULL,
  
  -- Timestamp
  reported_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_contributors_reputation 
  ON contributors(reputation_score DESC, total_reports DESC);

CREATE INDEX IF NOT EXISTS idx_contributors_last_report 
  ON contributors(last_report_at DESC);

CREATE INDEX IF NOT EXISTS idx_threat_reports_ledger_address 
  ON threat_reports_ledger(address);

CREATE INDEX IF NOT EXISTS idx_threat_reports_ledger_reporter 
  ON threat_reports_ledger(reporter_id);

CREATE INDEX IF NOT EXISTS idx_threat_reports_ledger_verified 
  ON threat_reports_ledger(admin_verified) WHERE admin_verified IS NOT NULL;

-- View: Top contributors leaderboard
CREATE OR REPLACE VIEW contributors_leaderboard AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY reputation_score DESC, total_reports DESC) as rank,
  reporter_id,
  display_name,
  avatar,
  total_reports,
  reputation_score,
  badges,
  last_report_at,
  status
FROM contributors
WHERE status = 'active'
ORDER BY reputation_score DESC, total_reports DESC
LIMIT 100;

-- Comments
COMMENT ON TABLE contributors IS 'Community threat reporters with reputation & badges';
COMMENT ON TABLE threat_reports_ledger IS 'Individual threat reports for accuracy tracking & community voting';
COMMENT ON VIEW contributors_leaderboard IS 'Top 100 active contributors ranked by reputation & report count';
COMMENT ON COLUMN contributors.reputation_score IS '0-100 scale: 50=neutral, 100=highly trusted, 0=disputed/banned';
COMMENT ON COLUMN contributors.badges IS 'Array of earned badges: scout, guardian, sentinel, verified, champion';
COMMENT ON COLUMN threat_reports_ledger.admin_verified IS 'true=verified authentic scam, false=disputed/false positive, null=pending review';
