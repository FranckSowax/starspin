-- Fix RLS Policies for Public Access
-- Les clients doivent pouvoir lire les données des marchands et des prix pour le flux de notation

-- 1. Ajouter une politique de lecture publique pour les marchands
DROP POLICY IF EXISTS "Public can view merchants" ON merchants;
CREATE POLICY "Public can view merchants" ON merchants
  FOR SELECT USING (true);

-- 2. Ajouter une politique de lecture publique pour les prix
DROP POLICY IF EXISTS "Public can view prizes" ON prizes;
CREATE POLICY "Public can view prizes" ON prizes
  FOR SELECT USING (true);

-- 3. Permettre l'insertion publique de feedback (pour les clients)
DROP POLICY IF EXISTS "Public can insert feedback" ON feedback;
CREATE POLICY "Public can insert feedback" ON feedback
  FOR INSERT WITH CHECK (true);

-- 4. Permettre l'insertion publique de spins (pour les clients)
DROP POLICY IF EXISTS "Public can insert spins" ON spins;
CREATE POLICY "Public can insert spins" ON spins
  FOR INSERT WITH CHECK (true);

-- 5. Permettre l'insertion publique de coupons (générés après spin)
DROP POLICY IF EXISTS "Public can insert coupons" ON coupons;
CREATE POLICY "Public can insert coupons" ON coupons
  FOR INSERT WITH CHECK (true);

-- 6. Permettre la lecture publique des coupons (pour afficher le coupon)
DROP POLICY IF EXISTS "Public can view coupons" ON coupons;
CREATE POLICY "Public can view coupons" ON coupons
  FOR SELECT USING (true);

-- Note: Les politiques existantes pour les marchands restent actives
-- Cela permet aux marchands de gérer leurs propres données
-- tout en permettant aux clients de voir les informations publiques
