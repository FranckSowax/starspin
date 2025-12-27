-- ============================================
-- STARSPIN DATABASE SCHEMA
-- Copiez et collez ce fichier complet dans le SQL Editor de Supabase
-- Dashboard: https://supabase.com/dashboard/project/egemjezgejptazoucwci/editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Merchants table
DROP TABLE IF EXISTS merchants CASCADE;
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  business_name TEXT,
  logo_url TEXT,
  branding JSONB DEFAULT '{}',
  google_review_link TEXT,
  instagram_handle TEXT,
  tiktok_handle TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_tier TEXT DEFAULT 'starter',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Prizes table
DROP TABLE IF EXISTS prizes CASCADE;
CREATE TABLE prizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  probability DOUBLE PRECISION NOT NULL CHECK (probability >= 0 AND probability <= 100),
  quantity INTEGER DEFAULT -1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Feedback table
DROP TABLE IF EXISTS feedback CASCADE;
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_positive BOOLEAN NOT NULL,
  user_token TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Spins table
DROP TABLE IF EXISTS spins CASCADE;
CREATE TABLE spins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  prize_id UUID REFERENCES prizes(id),
  ip_hash TEXT,
  user_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Coupons table
DROP TABLE IF EXISTS coupons CASCADE;
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spin_id UUID REFERENCES spins(id) ON DELETE CASCADE,
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  prize_name TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. QR Codes table
DROP TABLE IF EXISTS qr_codes CASCADE;
CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  asset_url TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Subscription Tiers (static reference)
DROP TABLE IF EXISTS subscription_tiers CASCADE;
CREATE TABLE subscription_tiers (
  tier_name TEXT PRIMARY KEY,
  max_locations INTEGER NOT NULL,
  price NUMERIC(8,2) NOT NULL,
  features JSONB DEFAULT '{}'
);

-- Insert default subscription tiers
INSERT INTO subscription_tiers (tier_name, max_locations, price, features) VALUES
('starter', 1, 15.00, '{"features": ["Basic stats", "1 location", "QR code generation"]}'),
('pro', 3, 59.00, '{"features": ["Advanced stats", "3 locations", "Priority support", "Custom branding"]}'),
('multi-shop', -1, 99.00, '{"features": ["Unlimited locations", "All features", "API access", "White label"]}');

-- Create indexes for better query performance
CREATE INDEX idx_feedback_merchant_id ON feedback(merchant_id);
CREATE INDEX idx_feedback_created_at ON feedback(created_at);
CREATE INDEX idx_spins_merchant_id ON spins(merchant_id);
CREATE INDEX idx_spins_created_at ON spins(created_at);
CREATE INDEX idx_spins_ip_hash ON spins(ip_hash);
CREATE INDEX idx_coupons_merchant_id ON coupons(merchant_id);
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_prizes_merchant_id ON prizes(merchant_id);

-- Enable Row Level Security
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for merchants
CREATE POLICY "Merchants can view own data" ON merchants
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Merchants can update own data" ON merchants
  FOR UPDATE USING (auth.uid()::text = id::text);

-- RLS Policies for prizes
CREATE POLICY "Merchants can view own prizes" ON prizes
  FOR SELECT USING (merchant_id IN (SELECT id FROM merchants WHERE auth.uid()::text = id::text));

CREATE POLICY "Merchants can insert own prizes" ON prizes
  FOR INSERT WITH CHECK (merchant_id IN (SELECT id FROM merchants WHERE auth.uid()::text = id::text));

CREATE POLICY "Merchants can update own prizes" ON prizes
  FOR UPDATE USING (merchant_id IN (SELECT id FROM merchants WHERE auth.uid()::text = id::text));

CREATE POLICY "Merchants can delete own prizes" ON prizes
  FOR DELETE USING (merchant_id IN (SELECT id FROM merchants WHERE auth.uid()::text = id::text));

-- RLS Policies for feedback
CREATE POLICY "Merchants can view own feedback" ON feedback
  FOR SELECT USING (merchant_id IN (SELECT id FROM merchants WHERE auth.uid()::text = id::text));

-- RLS Policies for spins
CREATE POLICY "Merchants can view own spins" ON spins
  FOR SELECT USING (merchant_id IN (SELECT id FROM merchants WHERE auth.uid()::text = id::text));

-- RLS Policies for coupons
CREATE POLICY "Merchants can view own coupons" ON coupons
  FOR SELECT USING (merchant_id IN (SELECT id FROM merchants WHERE auth.uid()::text = id::text));

-- RLS Policies for qr_codes
CREATE POLICY "Merchants can view own qr_codes" ON qr_codes
  FOR SELECT USING (merchant_id IN (SELECT id FROM merchants WHERE auth.uid()::text = id::text));

CREATE POLICY "Merchants can insert own qr_codes" ON qr_codes
  FOR INSERT WITH CHECK (merchant_id IN (SELECT id FROM merchants WHERE auth.uid()::text = id::text));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON merchants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prizes_updated_at BEFORE UPDATE ON prizes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SCHEMA EXECUTION COMPLETE
-- Vérifiez que toutes les tables sont créées dans le Table Editor
-- ============================================
