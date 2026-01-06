-- ============================================================
-- Migration: Add WhatsApp Workflow Mode
-- Date: 2026-01-05
-- Description: Adds workflow_mode selection (web/whatsapp) and
--              WhatsApp-specific fields for merchants
-- Note: Whapi API key is centralized in environment variables
--       (WHAPI_API_KEY) - not stored per merchant
-- ============================================================

-- 1. Add workflow mode to merchants table
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS workflow_mode TEXT DEFAULT 'web';

-- 2. Add customizable WhatsApp message template (per merchant)
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS whatsapp_message_template TEXT
  DEFAULT 'Merci pour votre avis ! Tournez la roue pour gagner un cadeau : {{spin_url}}';

-- 3. Add customer phone to feedback table (for WhatsApp workflow)
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- 4. Add index for phone lookups
CREATE INDEX IF NOT EXISTS idx_feedback_customer_phone ON feedback(customer_phone);

-- 5. Add comments for documentation
COMMENT ON COLUMN merchants.workflow_mode IS 'Workflow mode after review: web (timer+button) or whatsapp (auto message)';
COMMENT ON COLUMN merchants.whatsapp_message_template IS 'Template for WhatsApp message. {{spin_url}} will be replaced with actual URL';
COMMENT ON COLUMN feedback.customer_phone IS 'Customer WhatsApp phone number (for WhatsApp workflow mode)';

-- 6. Reload schema cache
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- END OF MIGRATION
-- ============================================================
