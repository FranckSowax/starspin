-- ============================================
-- FIX ALL RLS POLICIES - Script Complet
-- ============================================
-- Ce script ajoute toutes les policies RLS manquantes pour permettre
-- aux utilisateurs publics d'interagir avec l'application

-- 1. FEEDBACK - Permettre l'insertion publique
DROP POLICY IF EXISTS "Public can insert feedback" ON feedback;
CREATE POLICY "Public can insert feedback" ON feedback
  FOR INSERT 
  WITH CHECK (true);

-- 2. SPINS - Permettre l'insertion publique (pour la roue)
DROP POLICY IF EXISTS "Public can insert spins" ON spins;
CREATE POLICY "Public can insert spins" ON spins
  FOR INSERT 
  WITH CHECK (true);

-- Permettre la lecture publique des spins (pour vérifier si déjà joué)
DROP POLICY IF EXISTS "Public can view spins" ON spins;
CREATE POLICY "Public can view spins" ON spins
  FOR SELECT 
  USING (true);

-- 3. COUPONS - Permettre l'insertion publique (pour générer les coupons)
DROP POLICY IF EXISTS "Public can insert coupons" ON coupons;
CREATE POLICY "Public can insert coupons" ON coupons
  FOR INSERT 
  WITH CHECK (true);

-- Permettre la lecture publique des coupons (pour afficher le coupon gagné)
DROP POLICY IF EXISTS "Public can view own coupons" ON coupons;
CREATE POLICY "Public can view own coupons" ON coupons
  FOR SELECT 
  USING (true);

-- Permettre la mise à jour des coupons (pour marquer comme utilisé)
DROP POLICY IF EXISTS "Public can update coupons" ON coupons;
CREATE POLICY "Public can update coupons" ON coupons
  FOR UPDATE 
  USING (true)
  WITH CHECK (true);

-- 4. PRIZES - Permettre la lecture publique (pour afficher les prix sur la roue)
DROP POLICY IF EXISTS "Public can view prizes" ON prizes;
CREATE POLICY "Public can view prizes" ON prizes
  FOR SELECT 
  USING (true);

-- Vérifier toutes les policies créées
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies 
WHERE tablename IN ('feedback', 'spins', 'coupons', 'prizes')
ORDER BY tablename, policyname;
