-- ============================================
-- CONFIGURATION COMPLÈTE DES POLITIQUES RLS POUR STARSPIN
-- Exécutez ce script dans Supabase SQL Editor
-- ============================================
-- Ce script configure toutes les politiques RLS nécessaires pour :
-- 1. L'inscription des nouveaux marchands
-- 2. L'accès des marchands à leurs propres données
-- 3. L'accès public pour les clients (rating, spin, coupons)
-- ============================================

-- ============================================
-- ÉTAPE 1: ACTIVER RLS SUR TOUTES LES TABLES
-- ============================================

ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ÉTAPE 2: SUPPRIMER TOUTES LES ANCIENNES POLITIQUES
-- ============================================

-- Merchants
DROP POLICY IF EXISTS "Merchants can view own data" ON merchants;
DROP POLICY IF EXISTS "Merchants can update own data" ON merchants;
DROP POLICY IF EXISTS "Merchants can insert own data" ON merchants;
DROP POLICY IF EXISTS "Public can view merchants" ON merchants;
DROP POLICY IF EXISTS "Public read access for merchants" ON merchants;
DROP POLICY IF EXISTS "Users can insert their own merchant record" ON merchants;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own merchant" ON merchants;

-- Prizes
DROP POLICY IF EXISTS "Merchants can view own prizes" ON prizes;
DROP POLICY IF EXISTS "Merchants can insert own prizes" ON prizes;
DROP POLICY IF EXISTS "Merchants can update own prizes" ON prizes;
DROP POLICY IF EXISTS "Merchants can delete own prizes" ON prizes;
DROP POLICY IF EXISTS "Public can view prizes" ON prizes;
DROP POLICY IF EXISTS "Public read access for prizes" ON prizes;

-- Feedback
DROP POLICY IF EXISTS "Merchants can view own feedback" ON feedback;
DROP POLICY IF EXISTS "Public can insert feedback" ON feedback;
DROP POLICY IF EXISTS "Public can view feedback" ON feedback;

-- Spins
DROP POLICY IF EXISTS "Merchants can view own spins" ON spins;
DROP POLICY IF EXISTS "Public can insert spins" ON spins;
DROP POLICY IF EXISTS "Public insert access for spins" ON spins;
DROP POLICY IF EXISTS "Public read access for spins" ON spins;

-- Coupons
DROP POLICY IF EXISTS "Merchants can view own coupons" ON coupons;
DROP POLICY IF EXISTS "Merchants can view their own coupons" ON coupons;
DROP POLICY IF EXISTS "Merchants can update their own coupons" ON coupons;
DROP POLICY IF EXISTS "Public can insert coupons" ON coupons;
DROP POLICY IF EXISTS "Public insert access for coupons" ON coupons;
DROP POLICY IF EXISTS "Public can view coupons" ON coupons;
DROP POLICY IF EXISTS "Public read access for coupons" ON coupons;

-- QR Codes
DROP POLICY IF EXISTS "Merchants can view own qr_codes" ON qr_codes;
DROP POLICY IF EXISTS "Merchants can insert own qr_codes" ON qr_codes;

-- ============================================
-- ÉTAPE 3: POLITIQUES POUR LA TABLE MERCHANTS
-- ============================================

-- 3.1 INSCRIPTION: Permettre aux utilisateurs authentifiés de créer leur propre profil marchand
-- CRITIQUE: L'ID du marchand DOIT correspondre à l'ID de l'utilisateur authentifié
CREATE POLICY "merchants_insert_own"
ON merchants FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 3.2 Marchands peuvent voir leur propre profil
CREATE POLICY "merchants_select_own"
ON merchants FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 3.3 Marchands peuvent mettre à jour leur propre profil
CREATE POLICY "merchants_update_own"
ON merchants FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3.4 Accès public en lecture (pour les pages de rating client)
CREATE POLICY "merchants_public_read"
ON merchants FOR SELECT
TO anon
USING (true);

-- ============================================
-- ÉTAPE 4: POLITIQUES POUR LA TABLE PRIZES
-- ============================================

-- 4.1 Marchands peuvent voir leurs propres prix
CREATE POLICY "prizes_select_own"
ON prizes FOR SELECT
TO authenticated
USING (merchant_id = auth.uid());

-- 4.2 Marchands peuvent créer des prix
CREATE POLICY "prizes_insert_own"
ON prizes FOR INSERT
TO authenticated
WITH CHECK (merchant_id = auth.uid());

-- 4.3 Marchands peuvent modifier leurs prix
CREATE POLICY "prizes_update_own"
ON prizes FOR UPDATE
TO authenticated
USING (merchant_id = auth.uid())
WITH CHECK (merchant_id = auth.uid());

-- 4.4 Marchands peuvent supprimer leurs prix
CREATE POLICY "prizes_delete_own"
ON prizes FOR DELETE
TO authenticated
USING (merchant_id = auth.uid());

-- 4.5 Accès public en lecture (pour la roue des clients)
CREATE POLICY "prizes_public_read"
ON prizes FOR SELECT
TO anon
USING (true);

-- ============================================
-- ÉTAPE 5: POLITIQUES POUR LA TABLE FEEDBACK
-- ============================================

-- 5.1 Marchands peuvent voir les feedbacks de leurs clients
CREATE POLICY "feedback_select_own"
ON feedback FOR SELECT
TO authenticated
USING (merchant_id = auth.uid());

-- 5.2 Clients (anonymes) peuvent soumettre des feedbacks
CREATE POLICY "feedback_public_insert"
ON feedback FOR INSERT
TO anon
WITH CHECK (true);

-- 5.3 Utilisateurs authentifiés peuvent aussi soumettre des feedbacks (si connectés)
CREATE POLICY "feedback_authenticated_insert"
ON feedback FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================
-- ÉTAPE 6: POLITIQUES POUR LA TABLE SPINS
-- ============================================

-- 6.1 Marchands peuvent voir les spins de leurs clients
CREATE POLICY "spins_select_own"
ON spins FOR SELECT
TO authenticated
USING (merchant_id = auth.uid());

-- 6.2 Clients (anonymes) peuvent créer des spins
CREATE POLICY "spins_public_insert"
ON spins FOR INSERT
TO anon
WITH CHECK (true);

-- 6.3 Utilisateurs authentifiés peuvent aussi créer des spins
CREATE POLICY "spins_authenticated_insert"
ON spins FOR INSERT
TO authenticated
WITH CHECK (true);

-- 6.4 Lecture publique pour récupérer le spin créé
CREATE POLICY "spins_public_read"
ON spins FOR SELECT
TO anon
USING (true);

-- ============================================
-- ÉTAPE 7: POLITIQUES POUR LA TABLE COUPONS
-- ============================================

-- 7.1 Marchands peuvent voir leurs coupons
CREATE POLICY "coupons_select_own"
ON coupons FOR SELECT
TO authenticated
USING (merchant_id = auth.uid());

-- 7.2 Marchands peuvent mettre à jour leurs coupons (marquer comme utilisé)
CREATE POLICY "coupons_update_own"
ON coupons FOR UPDATE
TO authenticated
USING (merchant_id = auth.uid())
WITH CHECK (merchant_id = auth.uid());

-- 7.3 Clients (anonymes) peuvent créer des coupons (après spin)
CREATE POLICY "coupons_public_insert"
ON coupons FOR INSERT
TO anon
WITH CHECK (true);

-- 7.4 Utilisateurs authentifiés peuvent aussi créer des coupons
CREATE POLICY "coupons_authenticated_insert"
ON coupons FOR INSERT
TO authenticated
WITH CHECK (true);

-- 7.5 Lecture publique pour afficher le coupon au client
CREATE POLICY "coupons_public_read"
ON coupons FOR SELECT
TO anon
USING (true);

-- ============================================
-- ÉTAPE 8: POLITIQUES POUR LA TABLE QR_CODES
-- ============================================

-- 8.1 Marchands peuvent voir leurs QR codes
CREATE POLICY "qr_codes_select_own"
ON qr_codes FOR SELECT
TO authenticated
USING (merchant_id = auth.uid());

-- 8.2 Marchands peuvent créer des QR codes
CREATE POLICY "qr_codes_insert_own"
ON qr_codes FOR INSERT
TO authenticated
WITH CHECK (merchant_id = auth.uid());

-- 8.3 Marchands peuvent supprimer leurs QR codes
CREATE POLICY "qr_codes_delete_own"
ON qr_codes FOR DELETE
TO authenticated
USING (merchant_id = auth.uid());

-- ============================================
-- ÉTAPE 9: POLITIQUES POUR LE STORAGE
-- ============================================

-- Créer le bucket s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('merchant-assets', 'merchant-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Supprimer les anciennes politiques de storage
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- 9.1 Lecture publique des assets
CREATE POLICY "storage_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'merchant-assets');

-- 9.2 Upload pour utilisateurs authentifiés (fichiers dans leur dossier)
CREATE POLICY "storage_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'merchant-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 9.3 Mise à jour pour utilisateurs authentifiés
CREATE POLICY "storage_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'merchant-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 9.4 Suppression pour utilisateurs authentifiés
CREATE POLICY "storage_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'merchant-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- ÉTAPE 10: VÉRIFICATION
-- ============================================

-- Afficher toutes les politiques créées
SELECT 
  schemaname,
  tablename, 
  policyname, 
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('merchants', 'prizes', 'feedback', 'spins', 'coupons', 'qr_codes')
ORDER BY tablename, policyname;

-- ============================================
-- RÉSUMÉ DES POLITIQUES
-- ============================================
-- 
-- MERCHANTS:
--   - INSERT: Utilisateurs authentifiés peuvent créer leur profil (id = auth.uid())
--   - SELECT: Marchands voient leur profil + Anonymes peuvent lire (pour rating)
--   - UPDATE: Marchands peuvent modifier leur profil
--
-- PRIZES:
--   - INSERT/UPDATE/DELETE: Marchands gèrent leurs prix
--   - SELECT: Marchands + Anonymes (pour la roue)
--
-- FEEDBACK:
--   - INSERT: Anonymes et authentifiés peuvent soumettre
--   - SELECT: Marchands voient leurs feedbacks
--
-- SPINS:
--   - INSERT: Anonymes et authentifiés peuvent créer
--   - SELECT: Marchands + Anonymes (pour récupérer le résultat)
--
-- COUPONS:
--   - INSERT: Anonymes et authentifiés peuvent créer
--   - SELECT: Marchands + Anonymes (pour afficher le coupon)
--   - UPDATE: Marchands peuvent marquer comme utilisé
--
-- QR_CODES:
--   - INSERT/SELECT/DELETE: Marchands uniquement
--
-- STORAGE:
--   - SELECT: Public
--   - INSERT/UPDATE/DELETE: Authentifiés dans leur dossier
-- ============================================
