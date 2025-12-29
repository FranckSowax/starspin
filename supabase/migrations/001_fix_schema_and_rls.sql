-- ============================================================
-- STARSPIN - Script de Correction Base de Données
-- Date: 2025-12-29
-- ============================================================

-- ============================================================
-- PARTIE 1: AJOUT DES COLONNES MANQUANTES
-- ============================================================

-- Ajouter redirect_strategy à merchants (stratégie de redirection après avis positif)
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS redirect_strategy text DEFAULT 'google_maps';

-- Ajouter is_active à merchants (pour désactiver un compte marchand)
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Commentaires pour documentation
COMMENT ON COLUMN merchants.redirect_strategy IS 'Stratégie de redirection après avis positif: google_maps, tripadvisor, instagram, tiktok, random';
COMMENT ON COLUMN merchants.is_active IS 'Indique si le compte marchand est actif';

-- ============================================================
-- PARTIE 2: ACTIVER RLS SUR TOUTES LES TABLES
-- ============================================================

ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PARTIE 3: POLITIQUES RLS POUR MERCHANTS
-- ============================================================

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Merchants can view own profile" ON merchants;
DROP POLICY IF EXISTS "Merchants can update own profile" ON merchants;
DROP POLICY IF EXISTS "Public can view active merchants" ON merchants;
DROP POLICY IF EXISTS "Service role full access" ON merchants;

-- Lecture publique des merchants actifs (pour la page /rate/[shopId])
CREATE POLICY "Public can view active merchants" ON merchants
  FOR SELECT
  USING (is_active = true OR is_active IS NULL);

-- Les merchants authentifiés peuvent voir leur propre profil complet
CREATE POLICY "Merchants can view own profile" ON merchants
  FOR SELECT
  USING (auth.uid() = id);

-- Les merchants peuvent modifier leur propre profil
CREATE POLICY "Merchants can update own profile" ON merchants
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Insertion via auth (signup) - géré par trigger ou service role
CREATE POLICY "Enable insert for authenticated users only" ON merchants
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- PARTIE 4: POLITIQUES RLS POUR FEEDBACK
-- Règle métier: Tout le monde peut laisser un feedback (anonyme ou avec email)
-- ============================================================

DROP POLICY IF EXISTS "Anyone can insert feedback" ON feedback;
DROP POLICY IF EXISTS "Merchants can view their feedback" ON feedback;
DROP POLICY IF EXISTS "Public can insert feedback" ON feedback;

-- TOUT LE MONDE peut créer un feedback (c'est le comportement voulu)
CREATE POLICY "Public can insert feedback" ON feedback
  FOR INSERT
  WITH CHECK (
    -- Vérifier que le merchant_id existe et est actif
    EXISTS (
      SELECT 1 FROM merchants
      WHERE merchants.id = feedback.merchant_id
      AND (merchants.is_active = true OR merchants.is_active IS NULL)
    )
  );

-- Les merchants authentifiés peuvent voir les feedbacks de leur commerce
CREATE POLICY "Merchants can view their feedback" ON feedback
  FOR SELECT
  USING (
    auth.uid() = merchant_id
    OR
    -- Service role peut tout voir (pour admin)
    auth.role() = 'service_role'
  );

-- ============================================================
-- PARTIE 5: POLITIQUES RLS POUR PRIZES
-- ============================================================

DROP POLICY IF EXISTS "Public can view prizes" ON prizes;
DROP POLICY IF EXISTS "Merchants can manage their prizes" ON prizes;

-- Lecture publique des prizes (nécessaire pour la roue)
CREATE POLICY "Public can view prizes" ON prizes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM merchants
      WHERE merchants.id = prizes.merchant_id
      AND (merchants.is_active = true OR merchants.is_active IS NULL)
    )
  );

-- Les merchants peuvent gérer leurs propres prizes
CREATE POLICY "Merchants can manage their prizes" ON prizes
  FOR ALL
  USING (auth.uid() = merchant_id)
  WITH CHECK (auth.uid() = merchant_id);

-- ============================================================
-- PARTIE 6: POLITIQUES RLS POUR SPINS
-- Règle métier: Les merchants peuvent créer des spins depuis leur dashboard
-- Les utilisateurs anonymes avec user_token peuvent aussi créer des spins
-- ============================================================

DROP POLICY IF EXISTS "Anyone can insert spins" ON spins;
DROP POLICY IF EXISTS "Public can insert spins" ON spins;
DROP POLICY IF EXISTS "Merchants can view their spins" ON spins;
DROP POLICY IF EXISTS "Users can view their own spins" ON spins;

-- Création de spins autorisée (pour le jeu de la roue)
-- user_token est généré côté client pour tracer les spins anonymes
CREATE POLICY "Public can insert spins" ON spins
  FOR INSERT
  WITH CHECK (
    -- Vérifier que le merchant existe et est actif
    EXISTS (
      SELECT 1 FROM merchants
      WHERE merchants.id = spins.merchant_id
      AND (merchants.is_active = true OR merchants.is_active IS NULL)
    )
  );

-- Les merchants authentifiés peuvent voir les spins de leur commerce
CREATE POLICY "Merchants can view their spins" ON spins
  FOR SELECT
  USING (auth.uid() = merchant_id);

-- Les utilisateurs peuvent voir leurs propres spins via user_token
-- (géré côté application avec le service role)

-- ============================================================
-- PARTIE 7: POLITIQUES RLS POUR COUPONS
-- ============================================================

DROP POLICY IF EXISTS "Public can view coupons by code" ON coupons;
DROP POLICY IF EXISTS "Public can insert coupons" ON coupons;
DROP POLICY IF EXISTS "Merchants can view their coupons" ON coupons;
DROP POLICY IF EXISTS "Merchants can update their coupons" ON coupons;

-- Création de coupons (après un spin gagnant)
CREATE POLICY "Public can insert coupons" ON coupons
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM merchants
      WHERE merchants.id = coupons.merchant_id
      AND (merchants.is_active = true OR merchants.is_active IS NULL)
    )
  );

-- Lecture publique par code (pour la page /coupon/[shopId])
CREATE POLICY "Public can view coupons by code" ON coupons
  FOR SELECT
  USING (true);  -- Le filtrage se fait via l'application avec le code

-- Les merchants peuvent voir et mettre à jour leurs coupons
CREATE POLICY "Merchants can view their coupons" ON coupons
  FOR SELECT
  USING (auth.uid() = merchant_id);

CREATE POLICY "Merchants can update their coupons" ON coupons
  FOR UPDATE
  USING (auth.uid() = merchant_id)
  WITH CHECK (auth.uid() = merchant_id);

-- ============================================================
-- PARTIE 8: POLITIQUES RLS POUR QR_CODES
-- ============================================================

DROP POLICY IF EXISTS "Merchants can manage their qr_codes" ON qr_codes;
DROP POLICY IF EXISTS "Public can view qr_codes" ON qr_codes;

-- Lecture publique
CREATE POLICY "Public can view qr_codes" ON qr_codes
  FOR SELECT
  USING (true);

-- Les merchants peuvent gérer leurs QR codes
CREATE POLICY "Merchants can manage their qr_codes" ON qr_codes
  FOR ALL
  USING (auth.uid() = merchant_id)
  WITH CHECK (auth.uid() = merchant_id);

-- ============================================================
-- PARTIE 9: POLITIQUES RLS POUR SUBSCRIPTION_TIERS
-- ============================================================

DROP POLICY IF EXISTS "Public can view subscription_tiers" ON subscription_tiers;

-- Lecture publique des tiers (pour afficher les plans)
CREATE POLICY "Public can view subscription_tiers" ON subscription_tiers
  FOR SELECT
  USING (true);

-- ============================================================
-- PARTIE 10: INDEX POUR PERFORMANCE
-- ============================================================

-- Index sur merchant_id pour les jointures fréquentes
CREATE INDEX IF NOT EXISTS idx_feedback_merchant_id ON feedback(merchant_id);
CREATE INDEX IF NOT EXISTS idx_prizes_merchant_id ON prizes(merchant_id);
CREATE INDEX IF NOT EXISTS idx_spins_merchant_id ON spins(merchant_id);
CREATE INDEX IF NOT EXISTS idx_coupons_merchant_id ON coupons(merchant_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_merchant_id ON qr_codes(merchant_id);

-- Index sur user_token pour retrouver les spins d'un utilisateur
CREATE INDEX IF NOT EXISTS idx_spins_user_token ON spins(user_token);
CREATE INDEX IF NOT EXISTS idx_feedback_user_token ON feedback(user_token);

-- Index sur created_at pour le tri chronologique
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_spins_created_at ON spins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coupons_created_at ON coupons(created_at DESC);

-- Index sur code pour recherche rapide de coupon
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

-- ============================================================
-- FIN DU SCRIPT
-- ============================================================
