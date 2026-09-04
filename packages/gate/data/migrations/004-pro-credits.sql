-- GENESIS Pro credits (pay-as-you-go). A wallet buys check credits with USDC.
-- pro_payments (from 003) still records each redeemed tx to prevent double-credit.

CREATE TABLE IF NOT EXISTS pro_credits (
  address TEXT PRIMARY KEY,
  credits INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
