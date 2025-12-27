-- Add QR code URL field to merchants table
-- This will store the generated QR code image URL for each merchant

ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS qr_code_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN merchants.qr_code_url IS 'URL of the generated QR code image stored in Supabase Storage';

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'merchants' 
AND column_name = 'qr_code_url';
