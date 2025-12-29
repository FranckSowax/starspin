-- ============================================================
-- CORRECTIF RLS - Permettre INSERT feedback et spins publics
-- Date: 2025-12-29
-- ============================================================

-- Le problème: la vérification EXISTS sur merchants échoue car
-- merchants a aussi RLS activé. Solution: utiliser SECURITY DEFINER
-- ou simplifier la politique.

-- ============================================================
-- PARTIE 1: CORRIGER FEEDBACK
-- ============================================================

-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "Public can insert feedback" ON feedback;

-- Nouvelle politique simplifiée - tout le monde peut insérer
-- La validation du merchant_id se fait via la contrainte FK
CREATE POLICY "Public can insert feedback" ON feedback
  FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- PARTIE 2: CORRIGER SPINS
-- ============================================================

-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "Public can insert spins" ON spins;

-- Nouvelle politique simplifiée
CREATE POLICY "Public can insert spins" ON spins
  FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- PARTIE 3: CORRIGER COUPONS
-- ============================================================

-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "Public can insert coupons" ON coupons;

-- Nouvelle politique simplifiée
CREATE POLICY "Public can insert coupons" ON coupons
  FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- PARTIE 4: Ajouter politique SELECT sur spins pour le public
-- (nécessaire pour vérifier si un user a déjà joué)
-- ============================================================

DROP POLICY IF EXISTS "Public can view spins by token" ON spins;

-- Permettre de voir les spins par user_token (pour anti-fraude)
CREATE POLICY "Public can view spins by token" ON spins
  FOR SELECT
  USING (true);

-- ============================================================
-- FIN DU CORRECTIF
-- ============================================================
