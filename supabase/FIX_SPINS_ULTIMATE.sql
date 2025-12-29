-- ============================================
-- FIX SPINS TABLE 406 ERROR - ULTIMATE FIX
-- ============================================

-- 1. Forcer le rechargement du cache de schéma (C'est souvent la cause du 406)
NOTIFY pgrst, 'reload schema';

-- 2. Vérifier et réparer les permissions sur la table SPINS
GRANT ALL ON TABLE spins TO anon, authenticated, service_role;
GRANT ALL ON TABLE spins TO postgres;

-- 3. Vérifier les policies RLS (Les recréer pour être sûr)
ALTER TABLE spins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert spins" ON spins;
CREATE POLICY "Public can insert spins" ON spins FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view spins" ON spins;
CREATE POLICY "Public can view spins" ON spins FOR SELECT USING (true);

DROP POLICY IF EXISTS "Merchants can view own spins" ON spins;
CREATE POLICY "Merchants can view own spins" ON spins FOR SELECT USING (auth.uid()::text = merchant_id::text);

-- 4. Vérifier la structure de la table SPINS (s'assurer qu'elle correspond à ce que le client attend)
-- Le client fait un select * donc toutes ces colonnes doivent être accessibles
DO $$ 
BEGIN
    -- Vérifier que les colonnes existent et sont accessibles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'spins' AND column_name = 'id') THEN
        RAISE NOTICE 'Column id missing in spins';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'spins' AND column_name = 'merchant_id') THEN
        RAISE NOTICE 'Column merchant_id missing in spins';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'spins' AND column_name = 'user_token') THEN
        RAISE NOTICE 'Column user_token missing in spins';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'spins' AND column_name = 'created_at') THEN
        RAISE NOTICE 'Column created_at missing in spins';
    END IF;
END $$;

-- 5. Recharger le cache une seconde fois après les modifications
NOTIFY pgrst, 'reload schema';
