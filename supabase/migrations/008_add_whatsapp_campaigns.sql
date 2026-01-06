-- Migration: Add WhatsApp Campaigns table for saving and reusing campaigns
-- Created: 2024

-- Create whatsapp_campaigns table
CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  main_message TEXT NOT NULL,
  cards JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_favorite BOOLEAN DEFAULT FALSE,
  send_count INTEGER DEFAULT 0,
  last_sent_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_merchant_id ON whatsapp_campaigns(merchant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_created_at ON whatsapp_campaigns(created_at DESC);

-- Enable RLS
ALTER TABLE whatsapp_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Merchants can only access their own campaigns
CREATE POLICY "Merchants can view own campaigns"
  ON whatsapp_campaigns FOR SELECT
  USING (auth.uid() = merchant_id);

CREATE POLICY "Merchants can insert own campaigns"
  ON whatsapp_campaigns FOR INSERT
  WITH CHECK (auth.uid() = merchant_id);

CREATE POLICY "Merchants can update own campaigns"
  ON whatsapp_campaigns FOR UPDATE
  USING (auth.uid() = merchant_id);

CREATE POLICY "Merchants can delete own campaigns"
  ON whatsapp_campaigns FOR DELETE
  USING (auth.uid() = merchant_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_whatsapp_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_whatsapp_campaigns_updated_at
  BEFORE UPDATE ON whatsapp_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_campaigns_updated_at();

-- Comment on table
COMMENT ON TABLE whatsapp_campaigns IS 'Saved WhatsApp carousel campaigns for reuse';
