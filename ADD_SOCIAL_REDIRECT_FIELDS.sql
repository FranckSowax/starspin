-- Add social media redirect links to merchants table
-- These links will be used to redirect customers with 4-5 star reviews

ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
ADD COLUMN IF NOT EXISTS tripadvisor_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS redirect_strategy TEXT DEFAULT 'google_maps' CHECK (redirect_strategy IN ('google_maps', 'tripadvisor', 'tiktok', 'instagram', 'none'));

-- Add comment for documentation
COMMENT ON COLUMN merchants.redirect_strategy IS 'Platform to redirect positive reviews (4-5 stars): google_maps, tripadvisor, tiktok, instagram, or none';

-- Example update for existing merchants (optional)
-- UPDATE merchants SET redirect_strategy = 'google_maps' WHERE redirect_strategy IS NULL;

-- Verify the columns were added
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'merchants' 
AND column_name IN ('google_maps_url', 'tripadvisor_url', 'tiktok_url', 'instagram_url', 'redirect_strategy')
ORDER BY column_name;
