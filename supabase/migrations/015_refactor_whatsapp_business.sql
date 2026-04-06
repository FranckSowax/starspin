-- Migration 015: Refactor WhatsApp Business to match full spec
-- Replaces tables from 014 with proper naming and credit system

-- ============================================
-- 1. Drop old tables from migration 014
-- ============================================
DROP TABLE IF EXISTS wa_campaign_messages CASCADE;
DROP TABLE IF EXISTS wa_campaigns CASCADE;
DROP TABLE IF EXISTS wa_templates CASCADE;
DROP TABLE IF EXISTS wa_business_config CASCADE;
DROP TABLE IF EXISTS wa_pricing CASCADE;

-- ============================================
-- 2. merchant_whatsapp_config (dual provider)
-- ============================================
CREATE TABLE IF NOT EXISTS merchant_whatsapp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL UNIQUE REFERENCES merchants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'meta' CHECK (provider IN ('meta', 'whapi')),
  -- Meta Cloud API credentials
  waba_id TEXT,
  phone_number_id TEXT,
  access_token TEXT,
  display_phone TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  webhook_verify_token TEXT,
  -- Whapi credentials (legacy / per-merchant override)
  whapi_api_key TEXT,
  -- Pricing
  message_price_fcfa INTEGER DEFAULT 50,
  -- Audit
  configured_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mwc_merchant ON merchant_whatsapp_config(merchant_id);
ALTER TABLE merchant_whatsapp_config ENABLE ROW LEVEL SECURITY;

-- Only service_role can write (sensitive tokens)
-- Merchants can read their own config
CREATE POLICY "Merchants can view own wa config"
  ON merchant_whatsapp_config FOR SELECT
  USING (auth.uid() = merchant_id);

-- ============================================
-- 3. whatsapp_templates (synced with Meta)
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  meta_template_id TEXT,
  name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'fr',
  category TEXT NOT NULL DEFAULT 'MARKETING' CHECK (category IN ('MARKETING', 'UTILITY', 'AUTHENTICATION')),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'PAUSED', 'DISABLED')),
  components JSONB DEFAULT '[]',
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wt_merchant ON whatsapp_templates(merchant_id);
CREATE INDEX IF NOT EXISTS idx_wt_status ON whatsapp_templates(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wt_name_lang ON whatsapp_templates(merchant_id, name, language);

ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own templates"
  ON whatsapp_templates FOR SELECT USING (auth.uid() = merchant_id);
CREATE POLICY "Merchants can insert own templates"
  ON whatsapp_templates FOR INSERT WITH CHECK (auth.uid() = merchant_id);
CREATE POLICY "Merchants can update own templates"
  ON whatsapp_templates FOR UPDATE USING (auth.uid() = merchant_id);
CREATE POLICY "Merchants can delete own templates"
  ON whatsapp_templates FOR DELETE USING (auth.uid() = merchant_id);

-- ============================================
-- 4. Extend whatsapp_campaigns with template + cost fields
-- ============================================
ALTER TABLE whatsapp_campaigns
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES whatsapp_templates(id),
  ADD COLUMN IF NOT EXISTS template_variables JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS estimated_cost_fcfa INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS actual_cost_fcfa INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_recipients INTEGER DEFAULT 0;

-- ============================================
-- 5. whatsapp_campaign_messages (delivery tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_campaign_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES whatsapp_campaigns(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  meta_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'read', 'failed')),
  error_message TEXT,
  cost_fcfa INTEGER DEFAULT 50,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wcm_campaign ON whatsapp_campaign_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_wcm_status ON whatsapp_campaign_messages(status);
CREATE INDEX IF NOT EXISTS idx_wcm_meta_id ON whatsapp_campaign_messages(meta_message_id);

ALTER TABLE whatsapp_campaign_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own messages"
  ON whatsapp_campaign_messages FOR SELECT USING (auth.uid() = merchant_id);

-- ============================================
-- 6. Credits system
-- ============================================
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS campaign_credits INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS campaign_credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  pack_name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price_fcfa INTEGER NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ccp_merchant ON campaign_credit_purchases(merchant_id);

ALTER TABLE campaign_credit_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own purchases"
  ON campaign_credit_purchases FOR SELECT USING (auth.uid() = merchant_id);

-- ============================================
-- 7. Updated_at triggers
-- ============================================
CREATE OR REPLACE FUNCTION update_wa_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_mwc_updated ON merchant_whatsapp_config;
CREATE TRIGGER trigger_mwc_updated
  BEFORE UPDATE ON merchant_whatsapp_config
  FOR EACH ROW EXECUTE FUNCTION update_wa_updated_at();

DROP TRIGGER IF EXISTS trigger_wt_updated ON whatsapp_templates;
CREATE TRIGGER trigger_wt_updated
  BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION update_wa_updated_at();

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE merchant_whatsapp_config IS 'WhatsApp Business API config per merchant (Meta or Whapi)';
COMMENT ON TABLE whatsapp_templates IS 'WhatsApp message templates synced with Meta';
COMMENT ON TABLE whatsapp_campaign_messages IS 'Per-recipient delivery tracking for campaigns';
COMMENT ON TABLE campaign_credit_purchases IS 'Credit pack purchase history for WhatsApp campaigns';
