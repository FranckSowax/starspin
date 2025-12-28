-- ============================================================
-- FIX PRIZES RLS POLICIES
-- ============================================================
-- Ce script corrige les politiques RLS pour la table 'prizes'
-- Il assure que :
-- 1. Les marchands peuvent gérer (Ajouter/Modifier/Supprimer) leurs PROPRES prix.
-- 2. Tout le monde (Anonyme et Connecté) peut VOIR les prix (pour la roue).
-- ============================================================

-- 1. Activer RLS
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer les anciennes politiques conflictuelles
DROP POLICY IF EXISTS "Merchants can view own prizes" ON prizes;
DROP POLICY IF EXISTS "Merchants can insert own prizes" ON prizes;
DROP POLICY IF EXISTS "Merchants can update own prizes" ON prizes;
DROP POLICY IF EXISTS "Merchants can delete own prizes" ON prizes;
DROP POLICY IF EXISTS "Public can view prizes" ON prizes;
DROP POLICY IF EXISTS "Public read access for prizes" ON prizes;
DROP POLICY IF EXISTS "prizes_select_own" ON prizes;
DROP POLICY IF EXISTS "prizes_insert_own" ON prizes;
DROP POLICY IF EXISTS "prizes_update_own" ON prizes;
DROP POLICY IF EXISTS "prizes_delete_own" ON prizes;
DROP POLICY IF EXISTS "prizes_public_read" ON prizes;

-- 3. Créer les nouvelles politiques

-- LECTURE : Tout le monde peut voir les prix (nécessaire pour le jeu)
CREATE POLICY "prizes_read_all"
ON prizes FOR SELECT
TO public
USING (true);

-- INSERTION : Uniquement le marchand propriétaire
CREATE POLICY "prizes_insert_own"
ON prizes FOR INSERT
TO authenticated
WITH CHECK (
  -- L'utilisateur doit être le propriétaire du prix
  merchant_id = auth.uid()
);

-- MODIFICATION : Uniquement le marchand propriétaire
CREATE POLICY "prizes_update_own"
ON prizes FOR UPDATE
TO authenticated
USING (merchant_id = auth.uid())
WITH CHECK (merchant_id = auth.uid());

-- SUPPRESSION : Uniquement le marchand propriétaire
CREATE POLICY "prizes_delete_own"
ON prizes FOR DELETE
TO authenticated
USING (merchant_id = auth.uid());

-- 4. Vérification des politiques actives
SELECT * FROM pg_policies WHERE tablename = 'prizes';
