-- ============================================
-- FIX MERCHANTS TABLE - MISSING COLUMNS
-- ============================================
-- Ce script ajoute toutes les colonnes manquantes qui causent l'erreur 400

-- Ajouter les colonnes manquantes (si elles n'existent pas)
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS background_url TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{}'::jsonb;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS google_review_link TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS google_maps_url TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS tripadvisor_url TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS instagram_handle TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS tiktok_handle TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS tiktok_url TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS weekly_schedule TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS qr_code_url TEXT;

-- Vérifier les colonnes existantes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'merchants'
ORDER BY ordinal_position;

-- Recharger le cache
NOTIFY pgrst, 'reload schema';
