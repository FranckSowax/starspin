-- ============================================
-- FIX MERCHANT SIGNUP - STARSPIN
-- ============================================
-- Exécutez ce script dans Supabase SQL Editor pour permettre
-- l'inscription de nouveaux merchants.
-- ============================================

-- 1. S'assurer que RLS est activé sur la table merchants
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer les anciennes politiques INSERT qui pourraient bloquer
DROP POLICY IF EXISTS "Users can create their own merchant profile" ON merchants;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON merchants;
DROP POLICY IF EXISTS "Merchants can insert" ON merchants;

-- 3. Créer la politique INSERT correcte
-- Un utilisateur authentifié peut créer un profil merchant
-- UNIQUEMENT si l'ID du merchant correspond à son propre ID auth
CREATE POLICY "Users can create their own merchant profile" ON merchants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 4. Vérifier que les politiques SELECT et UPDATE existent aussi
DROP POLICY IF EXISTS "Public can view merchants" ON merchants;
CREATE POLICY "Public can view merchants" ON merchants
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Merchants can update own data" ON merchants;
CREATE POLICY "Merchants can update own data" ON merchants
  FOR UPDATE
  USING (auth.uid()::text = id::text);

-- 5. Rafraîchir le cache PostgREST
NOTIFY pgrst, 'reload schema';

-- 6. Vérification - Lister les politiques actives
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'merchants';

-- ============================================
-- FIN - Vous pouvez maintenant tester l'inscription
-- ============================================
