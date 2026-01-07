-- ============================================================================
-- STARSPIN - SCRIPT DE VÉRIFICATION DE LA BASE DE DONNÉES
-- ============================================================================
-- Ce script vérifie que la base de données est correctement configurée.
-- Exécutez-le pour diagnostiquer d'éventuels problèmes.
-- ============================================================================

-- ============================================================================
-- 1. VÉRIFICATION DES TABLES
-- ============================================================================

SELECT '=== TABLES ===' as section;

SELECT
    table_name,
    CASE
        WHEN table_name IN ('merchants', 'prizes', 'feedback', 'spins', 'coupons', 'qr_codes', 'notifications', 'whatsapp_campaigns', 'subscription_tiers')
        THEN 'OK'
        ELSE 'EXTRA'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Tables attendues mais manquantes
SELECT 'MISSING: ' || t.name as missing_table
FROM (VALUES
    ('merchants'), ('prizes'), ('feedback'), ('spins'),
    ('coupons'), ('qr_codes'), ('notifications'),
    ('whatsapp_campaigns'), ('subscription_tiers')
) as t(name)
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = t.name
);

-- ============================================================================
-- 2. VÉRIFICATION DU ROW LEVEL SECURITY
-- ============================================================================

SELECT '=== RLS STATUS ===' as section;

SELECT
    tablename,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('merchants', 'prizes', 'feedback', 'spins', 'coupons', 'qr_codes', 'notifications', 'whatsapp_campaigns', 'subscription_tiers')
ORDER BY tablename;

-- ============================================================================
-- 3. VÉRIFICATION DES POLITIQUES RLS
-- ============================================================================

SELECT '=== RLS POLICIES ===' as section;

SELECT
    tablename,
    policyname,
    permissive,
    roles::text,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Compter les politiques par table
SELECT
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- 4. VÉRIFICATION DES INDEX
-- ============================================================================

SELECT '=== INDEXES ===' as section;

SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ============================================================================
-- 5. VÉRIFICATION DES TRIGGERS
-- ============================================================================

SELECT '=== TRIGGERS ===' as section;

SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- 6. VÉRIFICATION DES FONCTIONS
-- ============================================================================

SELECT '=== FUNCTIONS ===' as section;

SELECT
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- ============================================================================
-- 7. VÉRIFICATION DES FOREIGN KEYS
-- ============================================================================

SELECT '=== FOREIGN KEYS ===' as section;

SELECT
    tc.table_name as from_table,
    kcu.column_name as from_column,
    ccu.table_name AS to_table,
    ccu.column_name AS to_column,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ============================================================================
-- 8. VÉRIFICATION DU STORAGE
-- ============================================================================

SELECT '=== STORAGE BUCKETS ===' as section;

SELECT
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
WHERE id = 'merchant-assets';

-- Politiques de storage
SELECT
    policyname,
    permissive,
    roles::text,
    cmd
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
ORDER BY policyname;

-- ============================================================================
-- 9. STATISTIQUES DES DONNÉES
-- ============================================================================

SELECT '=== DATA STATISTICS ===' as section;

SELECT 'merchants' as table_name, COUNT(*) as total,
    COUNT(*) FILTER (WHERE is_active = true) as active
FROM merchants
UNION ALL
SELECT 'prizes', COUNT(*), NULL FROM prizes
UNION ALL
SELECT 'feedback', COUNT(*), COUNT(*) FILTER (WHERE is_positive = true) FROM feedback
UNION ALL
SELECT 'spins', COUNT(*), NULL FROM spins
UNION ALL
SELECT 'coupons', COUNT(*), COUNT(*) FILTER (WHERE used = true) FROM coupons
UNION ALL
SELECT 'notifications', COUNT(*), COUNT(*) FILTER (WHERE read = true) FROM notifications
UNION ALL
SELECT 'whatsapp_campaigns', COUNT(*), NULL FROM whatsapp_campaigns
UNION ALL
SELECT 'subscription_tiers', COUNT(*), NULL FROM subscription_tiers;

-- ============================================================================
-- 10. VÉRIFICATION DES COLONNES ESSENTIELLES
-- ============================================================================

SELECT '=== MERCHANTS COLUMNS ===' as section;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'merchants'
ORDER BY ordinal_position;

-- ============================================================================
-- 11. TEST DE CONNEXION AUTH
-- ============================================================================

SELECT '=== AUTH USERS ===' as section;

SELECT
    id,
    email,
    created_at,
    email_confirmed_at IS NOT NULL as email_verified,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
