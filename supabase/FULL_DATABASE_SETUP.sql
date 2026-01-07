-- ============================================================================
-- STARSPIN - SCRIPT COMPLET DE CRÉATION DE BASE DE DONNÉES
-- ============================================================================
-- Ce script crée une nouvelle base de données StarSpin complète depuis zéro.
-- Exécutez-le dans l'éditeur SQL de votre projet Supabase.
--
-- IMPORTANT: Ce script suppose une base de données Supabase vierge.
-- Si des tables existent déjà, elles seront supprimées (DROP CASCADE).
-- ============================================================================

-- ============================================================================
-- PARTIE 1: EXTENSIONS REQUISES
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PARTIE 2: NETTOYAGE (Suppression des tables existantes)
-- ============================================================================

DROP TABLE IF EXISTS whatsapp_campaigns CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS qr_codes CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS spins CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS prizes CASCADE;
DROP TABLE IF EXISTS merchants CASCADE;
DROP TABLE IF EXISTS subscription_tiers CASCADE;

-- ============================================================================
-- PARTIE 3: CRÉATION DES TABLES
-- ============================================================================

-- 3.1 Table subscription_tiers (référence des abonnements)
-- ============================================================================
CREATE TABLE subscription_tiers (
    tier_name TEXT PRIMARY KEY,
    max_locations INTEGER NOT NULL,
    price NUMERIC(8,2) NOT NULL,
    features JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE subscription_tiers IS 'Plans d''abonnement disponibles';

-- 3.2 Table merchants (comptes marchands)
-- ============================================================================
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    business_name TEXT,
    logo_url TEXT,
    background_url TEXT,
    qr_code_url TEXT,
    logo_background_color TEXT DEFAULT '#FFFFFF',
    branding JSONB DEFAULT '{}'::jsonb,

    -- Liens de redirection (avis)
    google_review_link TEXT,
    google_maps_url TEXT,
    tripadvisor_url TEXT,

    -- Réseaux sociaux
    instagram_handle TEXT,
    instagram_url TEXT,
    tiktok_handle TEXT,
    tiktok_url TEXT,

    -- Planning
    weekly_schedule TEXT,

    -- Stripe (paiements)
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    subscription_tier TEXT DEFAULT 'starter',

    -- Configuration de la roue
    unlucky_probability INTEGER DEFAULT 20,
    retry_probability INTEGER DEFAULT 10,
    unlucky_quantity INTEGER DEFAULT 1,
    retry_quantity INTEGER DEFAULT 1,
    prize_quantities JSONB DEFAULT '{}'::jsonb,

    -- Workflow WhatsApp
    workflow_mode TEXT DEFAULT 'web',
    whatsapp_message_template TEXT,

    -- Stratégie de redirection
    redirect_strategy TEXT DEFAULT 'google_maps',

    -- Statut
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE merchants IS 'Comptes marchands utilisant StarSpin';
COMMENT ON COLUMN merchants.workflow_mode IS 'Mode de workflow: web ou whatsapp';
COMMENT ON COLUMN merchants.redirect_strategy IS 'Stratégie de redirection après avis positif';
COMMENT ON COLUMN merchants.unlucky_probability IS 'Probabilité du résultat "pas de chance" (0-100)';
COMMENT ON COLUMN merchants.retry_probability IS 'Probabilité du résultat "réessayer" (0-100)';

-- 3.3 Table prizes (lots de la roue)
-- ============================================================================
CREATE TABLE prizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    probability DOUBLE PRECISION NOT NULL CHECK (probability >= 0 AND probability <= 100),
    quantity INTEGER DEFAULT -1, -- -1 = illimité
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE prizes IS 'Lots disponibles sur la roue de chaque marchand';
COMMENT ON COLUMN prizes.quantity IS '-1 signifie quantité illimitée';
COMMENT ON COLUMN prizes.probability IS 'Probabilité de gain (0-100%)';

-- 3.4 Table feedback (avis clients)
-- ============================================================================
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    is_positive BOOLEAN,
    user_token TEXT,
    ip_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE feedback IS 'Avis et notes des clients';
COMMENT ON COLUMN feedback.is_positive IS 'true si rating >= 4';
COMMENT ON COLUMN feedback.user_token IS 'Token anonyme pour tracking';
COMMENT ON COLUMN feedback.ip_hash IS 'Hash de l''IP pour prévention de fraude';

-- 3.5 Table spins (tours de roue)
-- ============================================================================
CREATE TABLE spins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    prize_id UUID REFERENCES prizes(id),
    ip_hash TEXT,
    user_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE spins IS 'Historique des tours de roue';

-- 3.6 Table coupons (bons de réduction générés)
-- ============================================================================
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spin_id UUID REFERENCES spins(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    prize_name TEXT,
    expires_at TIMESTAMPTZ,
    used BOOLEAN DEFAULT false,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE coupons IS 'Coupons générés après gain à la roue';

-- 3.7 Table qr_codes (QR codes des marchands)
-- ============================================================================
CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    asset_url TEXT,
    asset_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE qr_codes IS 'QR codes générés pour chaque marchand';

-- 3.8 Table notifications (notifications marchands)
-- ============================================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- feedback, spin, coupon_used, new_customer
    title TEXT NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE notifications IS 'Notifications pour les marchands';
COMMENT ON COLUMN notifications.type IS 'Types: feedback, spin, coupon_used, new_customer';

-- 3.9 Table whatsapp_campaigns (campagnes WhatsApp)
-- ============================================================================
CREATE TABLE whatsapp_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    main_message TEXT,
    cards JSONB DEFAULT '[]'::jsonb,
    is_favorite BOOLEAN DEFAULT false,
    send_count INTEGER DEFAULT 0,
    last_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE whatsapp_campaigns IS 'Campagnes marketing WhatsApp sauvegardées';

-- ============================================================================
-- PARTIE 4: INDEX POUR OPTIMISATION
-- ============================================================================

-- Index sur feedback
CREATE INDEX idx_feedback_merchant_id ON feedback(merchant_id);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX idx_feedback_user_token ON feedback(user_token);
CREATE INDEX idx_feedback_customer_phone ON feedback(customer_phone);

-- Index sur spins
CREATE INDEX idx_spins_merchant_id ON spins(merchant_id);
CREATE INDEX idx_spins_created_at ON spins(created_at DESC);
CREATE INDEX idx_spins_ip_hash ON spins(ip_hash);
CREATE INDEX idx_spins_user_token ON spins(user_token);

-- Index sur coupons
CREATE INDEX idx_coupons_merchant_id ON coupons(merchant_id);
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_created_at ON coupons(created_at DESC);

-- Index sur prizes
CREATE INDEX idx_prizes_merchant_id ON prizes(merchant_id);

-- Index sur qr_codes
CREATE INDEX idx_qr_codes_merchant_id ON qr_codes(merchant_id);

-- Index sur notifications
CREATE INDEX idx_notifications_merchant_id ON notifications(merchant_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Index sur whatsapp_campaigns
CREATE INDEX idx_whatsapp_campaigns_merchant_id ON whatsapp_campaigns(merchant_id);
CREATE INDEX idx_whatsapp_campaigns_created_at ON whatsapp_campaigns(created_at DESC);

-- ============================================================================
-- PARTIE 5: FONCTIONS ET TRIGGERS
-- ============================================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour merchants
CREATE TRIGGER update_merchants_updated_at
    BEFORE UPDATE ON merchants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour prizes
CREATE TRIGGER update_prizes_updated_at
    BEFORE UPDATE ON prizes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Fonction spécifique pour whatsapp_campaigns
CREATE OR REPLACE FUNCTION update_whatsapp_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour whatsapp_campaigns
CREATE TRIGGER trigger_update_whatsapp_campaigns_updated_at
    BEFORE UPDATE ON whatsapp_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_campaigns_updated_at();

-- ============================================================================
-- PARTIE 6: ACTIVATION DE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PARTIE 7: POLITIQUES RLS (Row Level Security)
-- ============================================================================

-- 7.1 Politiques pour merchants
-- ============================================================================

-- Le public peut voir les marchands actifs
CREATE POLICY "Public can view active merchants"
ON merchants FOR SELECT
TO public
USING (is_active = true);

-- Les marchands peuvent voir leur propre profil
CREATE POLICY "Merchants can view own profile"
ON merchants FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Les marchands peuvent mettre à jour leur propre profil
CREATE POLICY "Merchants can update own profile"
ON merchants FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Les utilisateurs authentifiés peuvent créer un compte marchand
CREATE POLICY "Enable insert for authenticated users only"
ON merchants FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 7.2 Politiques pour prizes
-- ============================================================================

-- Le public peut voir les lots des marchands actifs
CREATE POLICY "Public can view prizes"
ON prizes FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 FROM merchants
        WHERE merchants.id = prizes.merchant_id
        AND merchants.is_active = true
    )
);

-- Les marchands peuvent gérer leurs propres lots
CREATE POLICY "Merchants can manage their prizes"
ON prizes FOR ALL
TO authenticated
USING (auth.uid() = merchant_id)
WITH CHECK (auth.uid() = merchant_id);

-- 7.3 Politiques pour feedback
-- ============================================================================

-- Le public peut soumettre des avis
CREATE POLICY "Public can insert feedback"
ON feedback FOR INSERT
TO public
WITH CHECK (
    EXISTS (
        SELECT 1 FROM merchants
        WHERE merchants.id = feedback.merchant_id
        AND merchants.is_active = true
    )
);

-- Les marchands peuvent voir leurs avis
CREATE POLICY "Merchants can view their feedback"
ON feedback FOR SELECT
TO authenticated
USING (auth.uid() = merchant_id);

-- Le service_role peut tout faire (pour l'admin)
CREATE POLICY "allow_service_role_all_feedback"
ON feedback FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 7.4 Politiques pour spins
-- ============================================================================

-- Le public peut créer des spins
CREATE POLICY "Public can insert spins"
ON spins FOR INSERT
TO public
WITH CHECK (
    EXISTS (
        SELECT 1 FROM merchants
        WHERE merchants.id = spins.merchant_id
        AND merchants.is_active = true
    )
);

-- Les marchands peuvent voir leurs spins
CREATE POLICY "Merchants can view their spins"
ON spins FOR SELECT
TO authenticated
USING (auth.uid() = merchant_id);

-- Le public peut voir les spins (pour détection de fraude)
CREATE POLICY "Public can view spins by token"
ON spins FOR SELECT
TO public
USING (true);

-- 7.5 Politiques pour coupons
-- ============================================================================

-- Le public peut créer des coupons
CREATE POLICY "Public can insert coupons"
ON coupons FOR INSERT
TO public
WITH CHECK (
    EXISTS (
        SELECT 1 FROM merchants
        WHERE merchants.id = coupons.merchant_id
        AND merchants.is_active = true
    )
);

-- Le public peut voir les coupons (par code)
CREATE POLICY "Public can view coupons by code"
ON coupons FOR SELECT
TO public
USING (true);

-- Les marchands peuvent voir leurs coupons
CREATE POLICY "Merchants can view their coupons"
ON coupons FOR SELECT
TO authenticated
USING (auth.uid() = merchant_id);

-- Les marchands peuvent mettre à jour leurs coupons
CREATE POLICY "Merchants can update their coupons"
ON coupons FOR UPDATE
TO authenticated
USING (auth.uid() = merchant_id)
WITH CHECK (auth.uid() = merchant_id);

-- 7.6 Politiques pour qr_codes
-- ============================================================================

-- Le public peut voir les QR codes
CREATE POLICY "Public can view qr_codes"
ON qr_codes FOR SELECT
TO public
USING (true);

-- Les marchands peuvent gérer leurs QR codes
CREATE POLICY "Merchants can manage their qr_codes"
ON qr_codes FOR ALL
TO authenticated
USING (auth.uid() = merchant_id)
WITH CHECK (auth.uid() = merchant_id);

-- 7.7 Politiques pour notifications
-- ============================================================================

-- Les marchands peuvent voir leurs notifications
CREATE POLICY "Merchants can view their own notifications"
ON notifications FOR SELECT
TO authenticated
USING (auth.uid() = merchant_id);

-- Les marchands peuvent mettre à jour leurs notifications
CREATE POLICY "Merchants can update their own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (auth.uid() = merchant_id)
WITH CHECK (auth.uid() = merchant_id);

-- Les marchands peuvent supprimer leurs notifications
CREATE POLICY "Merchants can delete their own notifications"
ON notifications FOR DELETE
TO authenticated
USING (auth.uid() = merchant_id);

-- Le service_role peut créer des notifications
CREATE POLICY "Service role can insert notifications"
ON notifications FOR INSERT
TO service_role
WITH CHECK (true);

-- 7.8 Politiques pour whatsapp_campaigns
-- ============================================================================

-- Les marchands peuvent voir leurs campagnes
CREATE POLICY "Merchants can view own campaigns"
ON whatsapp_campaigns FOR SELECT
TO authenticated
USING (auth.uid() = merchant_id);

-- Les marchands peuvent créer des campagnes
CREATE POLICY "Merchants can insert own campaigns"
ON whatsapp_campaigns FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = merchant_id);

-- Les marchands peuvent mettre à jour leurs campagnes
CREATE POLICY "Merchants can update own campaigns"
ON whatsapp_campaigns FOR UPDATE
TO authenticated
USING (auth.uid() = merchant_id)
WITH CHECK (auth.uid() = merchant_id);

-- Les marchands peuvent supprimer leurs campagnes
CREATE POLICY "Merchants can delete own campaigns"
ON whatsapp_campaigns FOR DELETE
TO authenticated
USING (auth.uid() = merchant_id);

-- 7.9 Politiques pour subscription_tiers
-- ============================================================================

-- Tout le monde peut voir les plans d'abonnement
CREATE POLICY "Public can view subscription_tiers"
ON subscription_tiers FOR SELECT
TO public
USING (true);

-- ============================================================================
-- PARTIE 8: DONNÉES INITIALES
-- ============================================================================

-- Plans d'abonnement par défaut
INSERT INTO subscription_tiers (tier_name, max_locations, price, features) VALUES
    ('starter', 1, 15.00, '{"reviews": true, "wheel": true, "basic_analytics": true}'::jsonb),
    ('pro', 3, 59.00, '{"reviews": true, "wheel": true, "advanced_analytics": true, "whatsapp": true, "custom_branding": true}'::jsonb),
    ('multi-shop', -1, 99.00, '{"reviews": true, "wheel": true, "advanced_analytics": true, "whatsapp": true, "custom_branding": true, "unlimited_locations": true, "priority_support": true}'::jsonb)
ON CONFLICT (tier_name) DO UPDATE SET
    max_locations = EXCLUDED.max_locations,
    price = EXCLUDED.price,
    features = EXCLUDED.features;

-- ============================================================================
-- PARTIE 9: CONFIGURATION DU STORAGE (BUCKET)
-- ============================================================================
-- Note: Exécutez ces commandes dans l'interface Supabase ou via l'API

-- Création du bucket pour les assets marchands (à faire manuellement)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('merchant-assets', 'merchant-assets', true);

-- Politiques de storage (à créer manuellement dans Supabase Dashboard > Storage > Policies)
-- 1. Public Access (SELECT): Permettre lecture publique
-- 2. Auth Upload (INSERT): Permettre upload pour utilisateurs authentifiés
-- 3. Auth Update (UPDATE): Permettre mise à jour pour utilisateurs authentifiés

-- ============================================================================
-- PARTIE 10: VÉRIFICATION
-- ============================================================================

-- Vérifier que toutes les tables ont été créées
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Vérifier que RLS est activé sur toutes les tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================

-- PROCHAINES ÉTAPES:
-- 1. Configurer les variables d'environnement dans votre application:
--    - NEXT_PUBLIC_SUPABASE_URL=https://[votre-projet].supabase.co
--    - NEXT_PUBLIC_SUPABASE_ANON_KEY=[votre-clé-anon]
--    - SUPABASE_SERVICE_ROLE_KEY=[votre-clé-service]
--    - ADMIN_EMAILS=votre-email@example.com
--
-- 2. Créer le bucket de storage "merchant-assets" (public)
--
-- 3. Créer un utilisateur admin dans Authentication > Users
--
-- 4. (Optionnel) Créer un marchand de test pour vérifier le bon fonctionnement
