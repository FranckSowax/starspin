-- Migration: WhatsApp Business API integration
-- Replaces Whapi with official Meta WhatsApp Business Cloud API
-- Each merchant gets their own WABA credentials managed by super admin

-- ============================================
-- 1. WhatsApp Business config per merchant
-- ============================================
CREATE TABLE IF NOT EXISTS wa_business_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL UNIQUE REFERENCES merchants(id) ON DELETE CASCADE,
  waba_id TEXT NOT NULL,              -- WhatsApp Business Account ID
  phone_number_id TEXT NOT NULL,      -- Phone Number ID from Meta
  display_phone TEXT,                 -- Display phone number (e.g. +33612345678)
  access_token TEXT NOT NULL,         -- Permanent access token (system user token)
  business_id TEXT,                   -- Meta Business ID
  app_id TEXT,                        -- Meta App ID
  webhook_verify_token TEXT,          -- Token for webhook verification
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wa_business_config_merchant ON wa_business_config(merchant_id);

-- RLS: Only admin (service role) can manage this table
ALTER TABLE wa_business_config ENABLE ROW LEVEL SECURITY;

-- Merchants can read their own config (but not the access_token)
CREATE POLICY "Merchants can view own wa config"
  ON wa_business_config FOR SELECT
  USING (auth.uid() = merchant_id);

-- ============================================
-- 2. WhatsApp message templates (synced from Meta)
-- ============================================
CREATE TABLE IF NOT EXISTS wa_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  meta_template_id TEXT,              -- Template ID from Meta
  name TEXT NOT NULL,                 -- Template name (lowercase, underscores)
  language TEXT NOT NULL DEFAULT 'fr',
  category TEXT NOT NULL DEFAULT 'MARKETING', -- MARKETING, UTILITY, AUTHENTICATION
  status TEXT NOT NULL DEFAULT 'DRAFT',       -- DRAFT, PENDING, APPROVED, REJECTED
  -- Template components stored as JSONB
  header_type TEXT,                   -- NONE, TEXT, IMAGE, VIDEO, DOCUMENT
  header_content TEXT,                -- Text or media URL/handle
  body_text TEXT NOT NULL,            -- Body with {{1}}, {{2}} placeholders
  footer_text TEXT,
  buttons JSONB DEFAULT '[]',         -- [{type: 'URL'|'PHONE_NUMBER'|'QUICK_REPLY', text, url/phone}]
  -- Meta response data
  meta_response JSONB,                -- Full Meta API response for debugging
  rejection_reason TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_wa_templates_merchant ON wa_templates(merchant_id);
CREATE INDEX IF NOT EXISTS idx_wa_templates_status ON wa_templates(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wa_templates_name_lang ON wa_templates(merchant_id, name, language);

ALTER TABLE wa_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own templates"
  ON wa_templates FOR SELECT
  USING (auth.uid() = merchant_id);

CREATE POLICY "Merchants can insert own templates"
  ON wa_templates FOR INSERT
  WITH CHECK (auth.uid() = merchant_id);

CREATE POLICY "Merchants can update own templates"
  ON wa_templates FOR UPDATE
  USING (auth.uid() = merchant_id);

CREATE POLICY "Merchants can delete own templates"
  ON wa_templates FOR DELETE
  USING (auth.uid() = merchant_id);

-- ============================================
-- 3. Campaign sends with pricing & reporting
-- ============================================
CREATE TABLE IF NOT EXISTS wa_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES wa_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  -- Pricing
  total_recipients INTEGER NOT NULL DEFAULT 0,
  price_per_message NUMERIC(10,4) NOT NULL DEFAULT 0,  -- Set by admin
  total_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  is_paid BOOLEAN DEFAULT FALSE,
  -- Status
  status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, SCHEDULED, SENDING, SENT, FAILED
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  -- Results
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_read INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  -- Template variables (for personalization)
  template_variables JSONB DEFAULT '{}',
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wa_campaigns_merchant ON wa_campaigns(merchant_id);
CREATE INDEX IF NOT EXISTS idx_wa_campaigns_status ON wa_campaigns(status);

ALTER TABLE wa_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own campaigns"
  ON wa_campaigns FOR SELECT
  USING (auth.uid() = merchant_id);

CREATE POLICY "Merchants can insert own campaigns"
  ON wa_campaigns FOR INSERT
  WITH CHECK (auth.uid() = merchant_id);

CREATE POLICY "Merchants can update own campaigns"
  ON wa_campaigns FOR UPDATE
  USING (auth.uid() = merchant_id);

-- ============================================
-- 4. Individual message delivery tracking
-- ============================================
CREATE TABLE IF NOT EXISTS wa_campaign_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES wa_campaigns(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  wa_message_id TEXT,                 -- Message ID returned by Meta
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, SENT, DELIVERED, READ, FAILED
  error_code TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wa_campaign_messages_campaign ON wa_campaign_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_wa_campaign_messages_status ON wa_campaign_messages(status);
CREATE INDEX IF NOT EXISTS idx_wa_campaign_messages_wa_id ON wa_campaign_messages(wa_message_id);

ALTER TABLE wa_campaign_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own messages"
  ON wa_campaign_messages FOR SELECT
  USING (auth.uid() = merchant_id);

-- ============================================
-- 5. Pricing configuration (admin-managed)
-- ============================================
CREATE TABLE IF NOT EXISTS wa_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency TEXT NOT NULL DEFAULT 'EUR',
  price_per_message NUMERIC(10,4) NOT NULL DEFAULT 0.05,
  min_recipients INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default pricing
INSERT INTO wa_pricing (currency, price_per_message) VALUES
  ('EUR', 0.05),
  ('USD', 0.055),
  ('THB', 1.80),
  ('XAF', 35.00)
ON CONFLICT DO NOTHING;

ALTER TABLE wa_pricing ENABLE ROW LEVEL SECURITY;

-- Everyone can read pricing
CREATE POLICY "Anyone can view pricing"
  ON wa_pricing FOR SELECT
  USING (true);

-- ============================================
-- 6. Updated_at triggers
-- ============================================
CREATE OR REPLACE FUNCTION update_wa_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_wa_business_config_updated
  BEFORE UPDATE ON wa_business_config
  FOR EACH ROW EXECUTE FUNCTION update_wa_updated_at();

CREATE TRIGGER trigger_wa_templates_updated
  BEFORE UPDATE ON wa_templates
  FOR EACH ROW EXECUTE FUNCTION update_wa_updated_at();

CREATE TRIGGER trigger_wa_campaigns_updated
  BEFORE UPDATE ON wa_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_wa_updated_at();

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE wa_business_config IS 'WhatsApp Business API credentials per merchant (managed by admin)';
COMMENT ON TABLE wa_templates IS 'WhatsApp message templates synced with Meta';
COMMENT ON TABLE wa_campaigns IS 'WhatsApp marketing campaigns with pricing and reporting';
COMMENT ON TABLE wa_campaign_messages IS 'Individual message delivery tracking for campaigns';
COMMENT ON TABLE wa_pricing IS 'Per-message pricing configuration for WhatsApp campaigns';
