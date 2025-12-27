-- Add weekly_schedule column to merchants table
-- This column stores a JSON array of 7 platform names (one for each day of the week)
-- Example: ["google_maps", "tiktok", "instagram", "google_maps", "tiktok", "instagram", "tripadvisor"]

ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS weekly_schedule TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN merchants.weekly_schedule IS 'JSON array of 7 platform names for weekly redirect scheduling (Monday to Sunday)';

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'merchants' 
AND column_name = 'weekly_schedule';
