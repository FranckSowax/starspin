-- ============================================================================
-- STARSPIN - Migration 010: Système de Carte Fidélité Digitale
-- ============================================================================
-- Ajoute le système complet de fidélité avec:
-- - Table clients fidélité (loyalty_clients)
-- - Table transactions de points (points_transactions)
-- - Table récompenses (loyalty_rewards)
-- - Table récompenses échangées (redeemed_rewards)
-- - Colonnes fidélité sur merchants
-- ============================================================================

-- ============================================================================
-- PARTIE 1: COLONNES MERCHANTS (Configuration fidélité)
-- ============================================================================

ALTER TABLE merchants ADD COLUMN IF NOT EXISTS loyalty_enabled BOOLEAN DEFAULT false;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS loyalty_card_image_url TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS points_per_purchase INTEGER DEFAULT 10;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS purchase_amount_threshold INTEGER DEFAULT 1000;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS loyalty_currency TEXT DEFAULT 'THB';
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS welcome_points INTEGER DEFAULT 50;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS loyalty_message_template TEXT DEFAULT 'Bienvenue ! Votre carte fidélité est prête avec {{points}} points. Consultez-la ici: {{card_link}}';

COMMENT ON COLUMN merchants.loyalty_enabled IS 'Active/désactive le système de fidélité';
COMMENT ON COLUMN merchants.loyalty_card_image_url IS 'Image personnalisée pour la carte fidélité';
COMMENT ON COLUMN merchants.points_per_purchase IS 'Nombre de points gagnés par seuil atteint';
COMMENT ON COLUMN merchants.purchase_amount_threshold IS 'Montant en devise pour gagner des points';
COMMENT ON COLUMN merchants.loyalty_currency IS 'Devise pour calcul (THB, EUR, USD, XAF)';
COMMENT ON COLUMN merchants.welcome_points IS 'Points offerts à la création de la carte';
COMMENT ON COLUMN merchants.loyalty_message_template IS 'Template message WhatsApp/email fidélité';

-- ============================================================================
-- PARTIE 2: TABLE CLIENTS FIDÉLITÉ
-- ============================================================================

CREATE TABLE IF NOT EXISTS loyalty_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    card_id TEXT UNIQUE NOT NULL, -- Format: STAR-2026-XXXX
    name TEXT,
    phone TEXT,
    email TEXT,
    points INTEGER DEFAULT 0,
    total_purchases INTEGER DEFAULT 0,
    total_spent NUMERIC(12,2) DEFAULT 0,
    qr_code_data TEXT UNIQUE NOT NULL, -- UUID unique pour le QR code
    user_token TEXT, -- Lien avec feedback existant
    apple_pass_serial TEXT,
    google_pass_id TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired')),
    last_visit TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE loyalty_clients IS 'Clients inscrits au programme de fidélité';
COMMENT ON COLUMN loyalty_clients.card_id IS 'Identifiant lisible de la carte (STAR-YYYY-XXXX)';
COMMENT ON COLUMN loyalty_clients.qr_code_data IS 'UUID unique encodé dans le QR code';
COMMENT ON COLUMN loyalty_clients.user_token IS 'Lien avec le token feedback pour historique';

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_loyalty_clients_merchant_id ON loyalty_clients(merchant_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_clients_phone ON loyalty_clients(phone);
CREATE INDEX IF NOT EXISTS idx_loyalty_clients_email ON loyalty_clients(email);
CREATE INDEX IF NOT EXISTS idx_loyalty_clients_qr_code ON loyalty_clients(qr_code_data);
CREATE INDEX IF NOT EXISTS idx_loyalty_clients_user_token ON loyalty_clients(user_token);
CREATE INDEX IF NOT EXISTS idx_loyalty_clients_card_id ON loyalty_clients(card_id);

-- Trigger pour updated_at
CREATE TRIGGER update_loyalty_clients_updated_at
    BEFORE UPDATE ON loyalty_clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PARTIE 3: TABLE TRANSACTIONS DE POINTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES loyalty_clients(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'bonus', 'welcome', 'adjustment')),
    points INTEGER NOT NULL, -- Positif = gain, Négatif = dépense
    balance_after INTEGER NOT NULL, -- Solde après transaction
    purchase_amount NUMERIC(12,2), -- Montant d'achat associé
    description TEXT,
    reference_id UUID, -- ID récompense ou autre référence
    staff_id UUID, -- Qui a effectué la transaction (optionnel)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE points_transactions IS 'Historique de toutes les transactions de points';
COMMENT ON COLUMN points_transactions.type IS 'earn=achat, redeem=échange, bonus=promotion, welcome=inscription, adjustment=correction';
COMMENT ON COLUMN points_transactions.balance_after IS 'Solde du client après cette transaction';

-- Index pour les rapports et historiques
CREATE INDEX IF NOT EXISTS idx_points_transactions_client_id ON points_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_merchant_id ON points_transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at ON points_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_transactions_type ON points_transactions(type);

-- ============================================================================
-- PARTIE 4: TABLE RÉCOMPENSES FIDÉLITÉ
-- ============================================================================

CREATE TABLE IF NOT EXISTS loyalty_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('discount', 'product', 'service', 'cashback')),
    value TEXT NOT NULL, -- "10" pour 10%, "Dessert gratuit", etc.
    points_cost INTEGER NOT NULL CHECK (points_cost > 0),
    quantity_available INTEGER, -- NULL = illimité
    image_url TEXT,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE loyalty_rewards IS 'Catalogue des récompenses échangeables';
COMMENT ON COLUMN loyalty_rewards.type IS 'discount=%, product=gratuit, service=prestation, cashback=remboursement';
COMMENT ON COLUMN loyalty_rewards.quantity_available IS 'NULL = quantité illimitée';

-- Index
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_merchant_id ON loyalty_rewards(merchant_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_is_active ON loyalty_rewards(is_active);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_points_cost ON loyalty_rewards(points_cost);

-- Trigger pour updated_at
CREATE TRIGGER update_loyalty_rewards_updated_at
    BEFORE UPDATE ON loyalty_rewards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PARTIE 5: TABLE RÉCOMPENSES ÉCHANGÉES
-- ============================================================================

CREATE TABLE IF NOT EXISTS redeemed_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES loyalty_clients(id) ON DELETE CASCADE,
    reward_id UUID REFERENCES loyalty_rewards(id) ON DELETE SET NULL,
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    reward_name TEXT NOT NULL, -- Copie du nom au moment de l'échange
    reward_value TEXT NOT NULL, -- Copie de la valeur
    points_spent INTEGER NOT NULL,
    redemption_code TEXT UNIQUE NOT NULL, -- Code à présenter en caisse
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired', 'cancelled')),
    expires_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ,
    used_by UUID, -- Staff qui a validé
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE redeemed_rewards IS 'Historique des récompenses échangées par les clients';
COMMENT ON COLUMN redeemed_rewards.redemption_code IS 'Code unique à présenter pour utiliser la récompense';
COMMENT ON COLUMN redeemed_rewards.reward_name IS 'Copie du nom pour historique (même si récompense supprimée)';

-- Index
CREATE INDEX IF NOT EXISTS idx_redeemed_rewards_client_id ON redeemed_rewards(client_id);
CREATE INDEX IF NOT EXISTS idx_redeemed_rewards_merchant_id ON redeemed_rewards(merchant_id);
CREATE INDEX IF NOT EXISTS idx_redeemed_rewards_code ON redeemed_rewards(redemption_code);
CREATE INDEX IF NOT EXISTS idx_redeemed_rewards_status ON redeemed_rewards(status);
CREATE INDEX IF NOT EXISTS idx_redeemed_rewards_created_at ON redeemed_rewards(created_at DESC);

-- ============================================================================
-- PARTIE 6: FONCTION GÉNÉRATION card_id
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_loyalty_card_id(p_merchant_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_year TEXT;
    v_count INTEGER;
    v_card_id TEXT;
BEGIN
    -- Année courante
    v_year := EXTRACT(YEAR FROM NOW())::TEXT;

    -- Compter les cartes existantes pour ce merchant cette année
    SELECT COUNT(*) + 1 INTO v_count
    FROM loyalty_clients
    WHERE merchant_id = p_merchant_id
    AND card_id LIKE 'STAR-' || v_year || '-%';

    -- Générer le card_id au format STAR-YYYY-XXXX
    v_card_id := 'STAR-' || v_year || '-' || LPAD(v_count::TEXT, 4, '0');

    RETURN v_card_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_loyalty_card_id IS 'Génère un ID de carte unique au format STAR-YYYY-XXXX';

-- ============================================================================
-- PARTIE 7: FONCTION GÉNÉRATION redemption_code
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_redemption_code()
RETURNS TEXT AS $$
DECLARE
    v_code TEXT;
    v_exists BOOLEAN;
BEGIN
    LOOP
        -- Générer un code de 8 caractères alphanumériques
        v_code := 'RWD-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

        -- Vérifier l'unicité
        SELECT EXISTS(SELECT 1 FROM redeemed_rewards WHERE redemption_code = v_code) INTO v_exists;

        EXIT WHEN NOT v_exists;
    END LOOP;

    RETURN v_code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_redemption_code IS 'Génère un code de rédemption unique au format RWD-XXXXXX';

-- ============================================================================
-- PARTIE 8: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur toutes les nouvelles tables
ALTER TABLE loyalty_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE redeemed_rewards ENABLE ROW LEVEL SECURITY;

-- Politiques loyalty_clients
CREATE POLICY "Merchants can view their loyalty clients"
ON loyalty_clients FOR SELECT
TO authenticated
USING (auth.uid() = merchant_id);

CREATE POLICY "Merchants can insert loyalty clients"
ON loyalty_clients FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = merchant_id);

CREATE POLICY "Merchants can update their loyalty clients"
ON loyalty_clients FOR UPDATE
TO authenticated
USING (auth.uid() = merchant_id)
WITH CHECK (auth.uid() = merchant_id);

CREATE POLICY "Public can view loyalty client by qr_code"
ON loyalty_clients FOR SELECT
TO public
USING (true);

-- Politiques points_transactions
CREATE POLICY "Merchants can view their points transactions"
ON points_transactions FOR SELECT
TO authenticated
USING (auth.uid() = merchant_id);

CREATE POLICY "Merchants can insert points transactions"
ON points_transactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = merchant_id);

CREATE POLICY "Public can view transactions by client"
ON points_transactions FOR SELECT
TO public
USING (true);

-- Politiques loyalty_rewards
CREATE POLICY "Merchants can manage their rewards"
ON loyalty_rewards FOR ALL
TO authenticated
USING (auth.uid() = merchant_id)
WITH CHECK (auth.uid() = merchant_id);

CREATE POLICY "Public can view active rewards"
ON loyalty_rewards FOR SELECT
TO public
USING (is_active = true);

-- Politiques redeemed_rewards
CREATE POLICY "Merchants can view their redeemed rewards"
ON redeemed_rewards FOR SELECT
TO authenticated
USING (auth.uid() = merchant_id);

CREATE POLICY "Merchants can manage their redeemed rewards"
ON redeemed_rewards FOR ALL
TO authenticated
USING (auth.uid() = merchant_id)
WITH CHECK (auth.uid() = merchant_id);

CREATE POLICY "Public can view redeemed by code"
ON redeemed_rewards FOR SELECT
TO public
USING (true);

CREATE POLICY "Public can insert redeemed rewards"
ON redeemed_rewards FOR INSERT
TO public
WITH CHECK (
    EXISTS (
        SELECT 1 FROM merchants
        WHERE merchants.id = redeemed_rewards.merchant_id
        AND merchants.is_active = true
        AND merchants.loyalty_enabled = true
    )
);

-- Service role full access
CREATE POLICY "Service role full access loyalty_clients"
ON loyalty_clients FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access points_transactions"
ON points_transactions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access loyalty_rewards"
ON loyalty_rewards FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access redeemed_rewards"
ON redeemed_rewards FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- PARTIE 9: VÉRIFICATION
-- ============================================================================

-- Vérifier que les tables ont été créées
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('loyalty_clients', 'points_transactions', 'loyalty_rewards', 'redeemed_rewards')
ORDER BY table_name;

-- Vérifier les nouvelles colonnes merchants
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'merchants'
AND column_name LIKE 'loyalty%' OR column_name LIKE 'points%' OR column_name LIKE 'purchase%' OR column_name LIKE 'welcome%'
ORDER BY column_name;

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
