-- ============================================
-- FIX COMPLETE - Toutes les colonnes manquantes
-- ============================================
-- Script complet pour ajouter TOUTES les colonnes manquantes à la table merchants

-- Ajouter toutes les colonnes de liens sociaux et autres
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS google_maps_url TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS tripadvisor_url TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS tiktok_url TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS weekly_schedule TEXT;

-- Vérifier toutes les colonnes de la table merchants
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'merchants'
ORDER BY ordinal_position;

-- Vérifier que le merchant a toutes les colonnes
SELECT id, email, name, business_name,
       google_maps_url, tripadvisor_url, 
       instagram_url, tiktok_url,
       weekly_schedule,
       unlucky_quantity, retry_quantity, prize_quantities
FROM merchants 
WHERE id = '158aed3e-d053-4d37-9824-3ea87af2ce9d';
