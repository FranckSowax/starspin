-- ============================================================
-- CORRECTIF FEEDBACK - Supprimer TOUTES les politiques et recréer
-- Date: 2025-12-29
-- ============================================================

-- Lister et supprimer TOUTES les politiques sur feedback
DROP POLICY IF EXISTS "Public can insert feedback" ON feedback;
DROP POLICY IF EXISTS "Anyone can insert feedback" ON feedback;
DROP POLICY IF EXISTS "Merchants can view their feedback" ON feedback;
DROP POLICY IF EXISTS "allow_anonymous_insert" ON feedback;
DROP POLICY IF EXISTS "allow_insert" ON feedback;
DROP POLICY IF EXISTS "Enable insert for all users" ON feedback;
DROP POLICY IF EXISTS "Enable read access for all users" ON feedback;

-- Recréer les politiques proprement
-- 1. Tout le monde peut créer un feedback
CREATE POLICY "allow_public_insert_feedback" ON feedback
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 2. Les merchants authentifiés peuvent voir leurs feedbacks
CREATE POLICY "allow_merchant_select_feedback" ON feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = merchant_id);

-- 3. Service role peut tout voir (pour admin API)
CREATE POLICY "allow_service_role_all_feedback" ON feedback
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- FIN
-- ============================================================
