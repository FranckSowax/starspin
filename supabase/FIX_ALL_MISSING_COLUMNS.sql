-- ============================================
-- FIX ALL MISSING COLUMNS - Script Complet
-- ============================================
-- Ce script ajoute toutes les colonnes manquantes après l'exécution de schema.sql

-- 1. Ajouter google_maps_url à la table merchants
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS google_maps_url TEXT;

-- 2. Vérifier toutes les colonnes de merchants
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'merchants'
ORDER BY ordinal_position;

-- 3. Vérifier que le merchant existe
SELECT id, email, name, business_name, 
       unlucky_quantity, retry_quantity, prize_quantities,
       google_maps_url
FROM merchants 
WHERE id = '158aed3e-d053-4d37-9824-3ea87af2ce9d';
