-- ============================================================================
-- STARSPIN - CONFIGURATION DU STORAGE SUPABASE
-- ============================================================================
-- Ce script configure le bucket de stockage pour les assets des marchands.
-- Exécutez-le dans l'éditeur SQL de Supabase.
-- ============================================================================

-- ============================================================================
-- PARTIE 1: CRÉATION DU BUCKET
-- ============================================================================

-- Créer le bucket pour les assets marchands
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'merchant-assets',
    'merchant-assets',
    true,
    5242880, -- 5MB max
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

-- ============================================================================
-- PARTIE 2: POLITIQUES DE STOCKAGE
-- ============================================================================

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
DROP POLICY IF EXISTS "Auth Update" ON storage.objects;
DROP POLICY IF EXISTS "Auth Delete" ON storage.objects;

-- Politique: Accès public en lecture
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'merchant-assets');

-- Politique: Upload pour utilisateurs authentifiés
CREATE POLICY "Auth Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'merchant-assets');

-- Politique: Mise à jour pour utilisateurs authentifiés
CREATE POLICY "Auth Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'merchant-assets')
WITH CHECK (bucket_id = 'merchant-assets');

-- Politique: Suppression pour utilisateurs authentifiés
CREATE POLICY "Auth Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'merchant-assets');

-- ============================================================================
-- PARTIE 3: VÉRIFICATION
-- ============================================================================

-- Vérifier que le bucket existe
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id = 'merchant-assets';

-- Lister les politiques de storage
SELECT policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
