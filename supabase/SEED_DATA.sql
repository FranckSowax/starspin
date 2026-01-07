-- ============================================================================
-- STARSPIN - DONNÉES DE TEST (SEED)
-- ============================================================================
-- Ce script ajoute des données de test pour vérifier le bon fonctionnement.
-- Exécutez-le APRÈS le script FULL_DATABASE_SETUP.sql
--
-- IMPORTANT: Remplacez les UUIDs et emails par vos propres valeurs.
-- ============================================================================

-- ============================================================================
-- PARTIE 1: CRÉER UN UTILISATEUR AUTH (à faire dans Supabase Dashboard)
-- ============================================================================
-- 1. Allez dans Authentication > Users
-- 2. Cliquez sur "Add user"
-- 3. Email: demo@starspin.app
-- 4. Password: Demo2024!
-- 5. Copiez l'UUID généré et utilisez-le ci-dessous

-- ============================================================================
-- PARTIE 2: CRÉER UN MARCHAND DE TEST
-- ============================================================================

-- Remplacez ce UUID par l'UUID de l'utilisateur créé dans Auth
-- Exemple: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

DO $$
DECLARE
    demo_merchant_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'; -- REMPLACEZ PAR L'UUID RÉEL
BEGIN
    -- Insérer le marchand de démonstration
    INSERT INTO merchants (
        id,
        email,
        name,
        business_name,
        subscription_tier,
        redirect_strategy,
        google_maps_url,
        unlucky_probability,
        retry_probability,
        is_active,
        workflow_mode,
        whatsapp_message_template
    ) VALUES (
        demo_merchant_id,
        'demo@starspin.app',
        'Demo User',
        'Restaurant Demo',
        'starter',
        'google_maps',
        'https://g.page/r/example-review-link',
        20,
        10,
        true,
        'web',
        'Merci pour votre avis ! Voici votre lien pour tourner la roue : {{spin_link}}'
    )
    ON CONFLICT (id) DO UPDATE SET
        business_name = EXCLUDED.business_name,
        subscription_tier = EXCLUDED.subscription_tier;

    -- Insérer les lots par défaut
    INSERT INTO prizes (merchant_id, name, description, probability, quantity) VALUES
        (demo_merchant_id, '10% de réduction', 'Remise de 10% sur votre prochaine commande', 30, -1),
        (demo_merchant_id, '15% de réduction', 'Remise de 15% sur votre prochaine commande', 20, 50),
        (demo_merchant_id, 'Dessert offert', 'Un dessert gratuit de votre choix', 15, 30),
        (demo_merchant_id, 'Boisson offerte', 'Une boisson gratuite', 25, -1),
        (demo_merchant_id, 'Pas de chance', 'Tentez votre chance une prochaine fois !', 10, -1)
    ON CONFLICT DO NOTHING;

    -- Insérer quelques avis de test
    INSERT INTO feedback (merchant_id, rating, comment, customer_email, is_positive, user_token) VALUES
        (demo_merchant_id, 5, 'Excellent service et nourriture délicieuse !', 'client1@example.com', true, 'token_001'),
        (demo_merchant_id, 4, 'Très bon, je reviendrai', 'client2@example.com', true, 'token_002'),
        (demo_merchant_id, 5, 'Le meilleur restaurant du quartier', 'client3@example.com', true, 'token_003'),
        (demo_merchant_id, 3, 'Correct mais un peu cher', 'client4@example.com', false, 'token_004'),
        (demo_merchant_id, 5, 'Service impeccable', 'client5@example.com', true, 'token_005')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Marchand de démonstration créé avec ID: %', demo_merchant_id;
END $$;

-- ============================================================================
-- PARTIE 3: CRÉER DES SPINS DE TEST
-- ============================================================================

-- Note: Les spins sont liés aux prizes, donc on les crée après

DO $$
DECLARE
    demo_merchant_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'; -- MÊME UUID QUE CI-DESSUS
    prize_10_id UUID;
    prize_15_id UUID;
    prize_dessert_id UUID;
    spin_id_1 UUID;
    spin_id_2 UUID;
BEGIN
    -- Récupérer les IDs des lots
    SELECT id INTO prize_10_id FROM prizes WHERE merchant_id = demo_merchant_id AND name = '10% de réduction' LIMIT 1;
    SELECT id INTO prize_15_id FROM prizes WHERE merchant_id = demo_merchant_id AND name = '15% de réduction' LIMIT 1;
    SELECT id INTO prize_dessert_id FROM prizes WHERE merchant_id = demo_merchant_id AND name = 'Dessert offert' LIMIT 1;

    -- Créer des spins de test
    IF prize_10_id IS NOT NULL THEN
        INSERT INTO spins (merchant_id, prize_id, user_token, ip_hash)
        VALUES (demo_merchant_id, prize_10_id, 'token_001', 'hash_001')
        RETURNING id INTO spin_id_1;

        -- Créer un coupon pour ce spin
        INSERT INTO coupons (spin_id, merchant_id, code, prize_name, expires_at)
        VALUES (spin_id_1, demo_merchant_id, 'DEMO-10OFF-001', '10% de réduction', NOW() + INTERVAL '30 days');
    END IF;

    IF prize_dessert_id IS NOT NULL THEN
        INSERT INTO spins (merchant_id, prize_id, user_token, ip_hash)
        VALUES (demo_merchant_id, prize_dessert_id, 'token_003', 'hash_003')
        RETURNING id INTO spin_id_2;

        -- Créer un coupon utilisé pour ce spin
        INSERT INTO coupons (spin_id, merchant_id, code, prize_name, expires_at, used, used_at)
        VALUES (spin_id_2, demo_merchant_id, 'DEMO-DESSERT-001', 'Dessert offert', NOW() + INTERVAL '30 days', true, NOW() - INTERVAL '2 days');
    END IF;

    RAISE NOTICE 'Spins et coupons de test créés';
END $$;

-- ============================================================================
-- PARTIE 4: CRÉER DES NOTIFICATIONS DE TEST
-- ============================================================================

DO $$
DECLARE
    demo_merchant_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
BEGIN
    INSERT INTO notifications (merchant_id, type, title, message, data, read) VALUES
        (demo_merchant_id, 'feedback', 'Nouvel avis 5 étoiles !', 'Un client vient de laisser un avis 5 étoiles.', '{"rating": 5}'::jsonb, false),
        (demo_merchant_id, 'spin', 'Nouveau tour de roue', 'Un client a tourné la roue et gagné 10% de réduction.', '{"prize": "10% de réduction"}'::jsonb, true),
        (demo_merchant_id, 'coupon_used', 'Coupon utilisé', 'Le coupon DEMO-DESSERT-001 a été utilisé.', '{"code": "DEMO-DESSERT-001"}'::jsonb, true),
        (demo_merchant_id, 'new_customer', 'Nouveau client', 'Un nouveau client s''est inscrit via votre QR code.', '{}'::jsonb, false)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Notifications de test créées';
END $$;

-- ============================================================================
-- PARTIE 5: VÉRIFICATION DES DONNÉES
-- ============================================================================

-- Compter les enregistrements créés
SELECT 'merchants' as table_name, COUNT(*) as count FROM merchants
UNION ALL
SELECT 'prizes', COUNT(*) FROM prizes
UNION ALL
SELECT 'feedback', COUNT(*) FROM feedback
UNION ALL
SELECT 'spins', COUNT(*) FROM spins
UNION ALL
SELECT 'coupons', COUNT(*) FROM coupons
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'subscription_tiers', COUNT(*) FROM subscription_tiers;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================

-- Pour supprimer les données de test:
-- DELETE FROM merchants WHERE email = 'demo@starspin.app';
-- (Les autres tables seront nettoyées automatiquement grâce à ON DELETE CASCADE)
