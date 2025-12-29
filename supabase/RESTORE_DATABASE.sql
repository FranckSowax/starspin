-- ============================================
-- SCRIPT DE RESTAURATION SUPABASE - STARSPIN
-- ============================================
-- Ce script restaure la base de données après l'exécution accidentelle de schema.sql
-- Exécutez ce script dans le SQL Editor de Supabase Dashboard

-- Étape 1: Vérifier que les tables existent (elles devraient déjà exister après schema.sql)
-- Si elles n'existent pas, exécutez d'abord schema.sql

-- Étape 2: Recréer votre compte merchant
-- IMPORTANT: Remplacez 'VOTRE_EMAIL@example.com' par votre vrai email
INSERT INTO merchants (
  id,
  email,
  name,
  business_name,
  subscription_tier,
  unlucky_probability,
  retry_probability,
  unlucky_quantity,
  retry_quantity,
  prize_quantities
) VALUES (
  '158aed3e-d053-4d37-9824-3ea87af2ce9d'::uuid,
  'VOTRE_EMAIL@example.com',  -- ⚠️ CHANGEZ CECI
  'Merchant Test',
  'StarSpin Business',
  'starter',
  20,
  10,
  1,
  1,
  '{}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  business_name = EXCLUDED.business_name,
  unlucky_quantity = EXCLUDED.unlucky_quantity,
  retry_quantity = EXCLUDED.retry_quantity,
  prize_quantities = EXCLUDED.prize_quantities;

-- Étape 3: Vérifier que le merchant a été créé
SELECT id, email, name, business_name, unlucky_quantity, retry_quantity 
FROM merchants 
WHERE id = '158aed3e-d053-4d37-9824-3ea87af2ce9d';

-- Étape 4: (Optionnel) Créer des prix de test
-- Décommentez les lignes ci-dessous si vous voulez des prix de démonstration
/*
INSERT INTO prizes (merchant_id, name, description, probability, quantity) VALUES
('158aed3e-d053-4d37-9824-3ea87af2ce9d', '10% de réduction', 'Réduction sur votre prochain achat', 30, -1),
('158aed3e-d053-4d37-9824-3ea87af2ce9d', 'Café gratuit', 'Un café offert', 25, -1),
('158aed3e-d053-4d37-9824-3ea87af2ce9d', 'Dessert offert', 'Un dessert de votre choix', 20, -1);
*/

-- Étape 5: Vérifier les RLS policies (elles devraient être en place)
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('merchants', 'prizes', 'feedback', 'spins', 'coupons', 'qr_codes');

-- ============================================
-- FIN DU SCRIPT
-- ============================================
-- Après avoir exécuté ce script:
-- 1. Rafraîchissez votre page web (F5)
-- 2. Reconnectez-vous si nécessaire
-- 3. Vérifiez que le dashboard fonctionne
