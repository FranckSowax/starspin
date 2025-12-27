-- ============================================
-- CORRECTION DES POLITIQUES RLS POUR STARSPIN
-- Exécutez ce script dans Supabase SQL Editor
-- ============================================

-- 1. MERCHANTS - Accès public en lecture
DROP POLICY IF EXISTS "Public can view merchants" ON merchants;
CREATE POLICY "Public can view merchants" ON merchants
  FOR SELECT USING (true);

-- 2. PRIZES - Accès public en lecture
DROP POLICY IF EXISTS "Public can view prizes" ON prizes;
CREATE POLICY "Public can view prizes" ON prizes
  FOR SELECT USING (true);

-- 3. FEEDBACK - Insertion publique (clients peuvent donner des avis)
DROP POLICY IF EXISTS "Public can insert feedback" ON feedback;
CREATE POLICY "Public can insert feedback" ON feedback
  FOR INSERT WITH CHECK (true);

-- 4. SPINS - Insertion publique (clients peuvent tourner la roue)
DROP POLICY IF EXISTS "Public can insert spins" ON spins;
CREATE POLICY "Public can insert spins" ON spins
  FOR INSERT WITH CHECK (true);

-- 5. COUPONS - Accès public complet (lecture et insertion)
DROP POLICY IF EXISTS "Public can insert coupons" ON coupons;
CREATE POLICY "Public can insert coupons" ON coupons
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view coupons" ON coupons;
CREATE POLICY "Public can view coupons" ON coupons
  FOR SELECT USING (true);

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Vérifier que les politiques sont actives
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('merchants', 'prizes', 'feedback', 'spins', 'coupons')
ORDER BY tablename, policyname;

-- ============================================
-- RÉSULTAT ATTENDU
-- ============================================
-- Vous devriez voir les politiques "Public can..." pour chaque table
-- Les anciennes politiques "Merchants can..." restent actives
-- ============================================
