-- ============================================================
-- CORRECTIF - Politique INSERT merchants
-- Permettre aux utilisateurs authentifiés de créer leur profil
-- Date: 2025-12-29
-- ============================================================

-- Supprimer l'ancienne politique d'insertion
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON merchants;

-- Nouvelle politique : un utilisateur authentifié peut créer SON profil
-- (l'ID du merchant doit correspondre à l'ID de l'utilisateur auth)
CREATE POLICY "Users can create their own merchant profile" ON merchants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- FIN
-- ============================================================
