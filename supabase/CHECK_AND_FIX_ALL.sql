-- ============================================
-- MASTER FIX SCRIPT - STARSPIN DATABASE HEALTH
-- ============================================
-- Ce script vérifie et répare TOUT : colonnes manquantes, RLS, Permissions, Cache.
-- À exécuter en cas de doute ou après une restauration de schéma.

-- 1. COLONNES MANQUANTES (MERCHANTS)
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS background_url TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{}'::jsonb;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS google_review_link TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS google_maps_url TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS tripadvisor_url TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS instagram_handle TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS tiktok_handle TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS tiktok_url TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS weekly_schedule TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS qr_code_url TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS unlucky_quantity INTEGER DEFAULT 1;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS retry_quantity INTEGER DEFAULT 1;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS unlucky_probability INTEGER DEFAULT 20;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS retry_probability INTEGER DEFAULT 10;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS prize_quantities JSONB DEFAULT '{}'::jsonb;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'starter';

-- 1.1 COLONNES MANQUANTES (AUTRES TABLES)
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS user_token TEXT;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS ip_hash TEXT;

ALTER TABLE spins ADD COLUMN IF NOT EXISTS user_token TEXT;
ALTER TABLE spins ADD COLUMN IF NOT EXISTS ip_hash TEXT;

-- 2. SECURITE (RLS POLICIES) - Réinitialisation propre
-- On active RLS partout
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- 2.1 MERCHANTS
DROP POLICY IF EXISTS "Merchants can view own data" ON merchants;
CREATE POLICY "Merchants can view own data" ON merchants FOR SELECT USING (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "Merchants can update own data" ON merchants;
CREATE POLICY "Merchants can update own data" ON merchants FOR UPDATE USING (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "Public can view merchants" ON merchants;
CREATE POLICY "Public can view merchants" ON merchants FOR SELECT USING (true);

-- IMPORTANT: Permettre aux utilisateurs de créer leur profil merchant
DROP POLICY IF EXISTS "Users can create their own merchant profile" ON merchants;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON merchants;
CREATE POLICY "Users can create their own merchant profile" ON merchants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 2.2 PRIZES
DROP POLICY IF EXISTS "Merchants can view own prizes" ON prizes;
CREATE POLICY "Merchants can view own prizes" ON prizes FOR SELECT USING (merchant_id IN (SELECT id FROM merchants WHERE auth.uid()::text = id::text));

DROP POLICY IF EXISTS "Public can view prizes" ON prizes;
CREATE POLICY "Public can view prizes" ON prizes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Merchants can insert own prizes" ON prizes;
CREATE POLICY "Merchants can insert own prizes" ON prizes FOR INSERT WITH CHECK (merchant_id IN (SELECT id FROM merchants WHERE auth.uid()::text = id::text));

DROP POLICY IF EXISTS "Merchants can update own prizes" ON prizes;
CREATE POLICY "Merchants can update own prizes" ON prizes FOR UPDATE USING (merchant_id IN (SELECT id FROM merchants WHERE auth.uid()::text = id::text));

DROP POLICY IF EXISTS "Merchants can delete own prizes" ON prizes;
CREATE POLICY "Merchants can delete own prizes" ON prizes FOR DELETE USING (merchant_id IN (SELECT id FROM merchants WHERE auth.uid()::text = id::text));

-- 2.3 FEEDBACK
DROP POLICY IF EXISTS "Merchants can view own feedback" ON feedback;
CREATE POLICY "Merchants can view own feedback" ON feedback FOR SELECT USING (merchant_id IN (SELECT id FROM merchants WHERE auth.uid()::text = id::text));

DROP POLICY IF EXISTS "Public can insert feedback" ON feedback;
CREATE POLICY "Public can insert feedback" ON feedback FOR INSERT WITH CHECK (true);

-- 2.4 SPINS
DROP POLICY IF EXISTS "Merchants can view own spins" ON spins;
CREATE POLICY "Merchants can view own spins" ON spins FOR SELECT USING (merchant_id IN (SELECT id FROM merchants WHERE auth.uid()::text = id::text));

DROP POLICY IF EXISTS "Public can insert spins" ON spins;
CREATE POLICY "Public can insert spins" ON spins FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view spins" ON spins;
CREATE POLICY "Public can view spins" ON spins FOR SELECT USING (true);

-- 2.5 COUPONS
DROP POLICY IF EXISTS "Merchants can view own coupons" ON coupons;
CREATE POLICY "Merchants can view own coupons" ON coupons FOR SELECT USING (merchant_id IN (SELECT id FROM merchants WHERE auth.uid()::text = id::text));

DROP POLICY IF EXISTS "Public can insert coupons" ON coupons;
CREATE POLICY "Public can insert coupons" ON coupons FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view own coupons" ON coupons;
CREATE POLICY "Public can view own coupons" ON coupons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can update coupons" ON coupons;
-- Correction: Seuls les marchands doivent pouvoir mettre à jour les coupons (pour les valider)
DROP POLICY IF EXISTS "Merchants can update own coupons" ON coupons;
CREATE POLICY "Merchants can update own coupons" ON coupons FOR UPDATE USING (merchant_id IN (SELECT id FROM merchants WHERE auth.uid()::text = id::text));

-- 3. PERMISSIONS GLOBALES (GRANTS)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. STOCKAGE (STORAGE BUCKETS)
INSERT INTO storage.buckets (id, name, public) VALUES ('merchant-assets', 'merchant-assets', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'merchant-assets' );

DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'merchant-assets' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Auth Update" ON storage.objects;
CREATE POLICY "Auth Update" ON storage.objects FOR UPDATE USING ( bucket_id = 'merchant-assets' AND auth.role() = 'authenticated' );

-- 5. TRIGGERS (MAINTENANCE)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_merchants_updated_at ON merchants;
CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON merchants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prizes_updated_at ON prizes;
CREATE TRIGGER update_prizes_updated_at BEFORE UPDATE ON prizes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. RECHARGEMENT DU CACHE (Vital)
NOTIFY pgrst, 'reload schema';
