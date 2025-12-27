-- Enable public read access for tables needed by the public pages

-- Merchants: Public needs to see shop details (logo, background, name)
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access for merchants" ON merchants;
CREATE POLICY "Public read access for merchants" ON merchants
  FOR SELECT TO public USING (true);

-- Prizes: Public needs to see available prizes
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access for prizes" ON prizes;
CREATE POLICY "Public read access for prizes" ON prizes
  FOR SELECT TO public USING (true);

-- Coupons: Public needs to verify coupons by code
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access for coupons" ON coupons;
CREATE POLICY "Public read access for coupons" ON coupons
  FOR SELECT TO public USING (true);

-- Spins: Public needs to link coupon to prize image (via spin_id)
ALTER TABLE spins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access for spins" ON spins;
CREATE POLICY "Public read access for spins" ON spins
  FOR SELECT TO public USING (true);

-- Storage: Ensure public can read images
-- (This was partially covered by previous fixes but good to reiterate)
-- Assuming 'merchant-assets' bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('merchant-assets', 'merchant-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read access" ON storage.objects;
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'merchant-assets');
