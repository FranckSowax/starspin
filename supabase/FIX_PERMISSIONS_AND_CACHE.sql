-- ============================================
-- FIX PERMISSIONS & CACHE - Script Vital
-- ============================================
-- Ce script rétablit les permissions d'accès aux tables et recharge le cache

-- 1. Accorder les permissions aux rôles Supabase (anon et authenticated)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- 2. Recharger le cache de schéma (pour corriger l'erreur 406)
NOTIFY pgrst, 'reload schema';

-- 3. Vérification finale des accès (juste pour être sûr)
-- On s'assure que les policies sont bien actives sur spins
ALTER TABLE spins ENABLE ROW LEVEL SECURITY;

-- 4. Rappel des policies publiques pour spins (au cas où)
DROP POLICY IF EXISTS "Public can insert spins" ON spins;
CREATE POLICY "Public can insert spins" ON spins FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view spins" ON spins;
CREATE POLICY "Public can view spins" ON spins FOR SELECT USING (true);
