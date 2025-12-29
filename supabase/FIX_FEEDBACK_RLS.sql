-- ============================================
-- FIX FEEDBACK RLS POLICIES
-- ============================================
-- Ajouter les policies manquantes pour permettre l'insertion de feedback

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Anyone can insert feedback" ON feedback;
DROP POLICY IF EXISTS "Public can insert feedback" ON feedback;

-- Créer une policy pour permettre l'insertion publique de feedback
-- (nécessaire pour que les clients puissent laisser des avis)
CREATE POLICY "Public can insert feedback" ON feedback
  FOR INSERT 
  WITH CHECK (true);

-- Vérifier les policies existantes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'feedback';
