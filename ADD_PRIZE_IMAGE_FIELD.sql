-- Add image_url column to prizes table for prize photos
-- This allows merchants to upload images for each prize on the wheel

ALTER TABLE prizes
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN prizes.image_url IS 'URL to the prize image stored in Supabase Storage';

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'prizes' 
AND column_name = 'image_url';
