-- Enable public INSERT access for spins and coupons
-- This is required for the "Spin & Win" functionality to work for unauthenticated customers

-- 1. Allow public to insert into spins table
DROP POLICY IF EXISTS "Public insert access for spins" ON spins;
CREATE POLICY "Public insert access for spins" ON spins
  FOR INSERT TO public WITH CHECK (true);

-- 2. Allow public to insert into coupons table
DROP POLICY IF EXISTS "Public insert access for coupons" ON coupons;
CREATE POLICY "Public insert access for coupons" ON coupons
  FOR INSERT TO public WITH CHECK (true);

-- 3. Ensure SELECT is also allowed (already covered by previous script, but safe to reinforce)
-- Needed so the client can receive the created record back
DROP POLICY IF EXISTS "Public read access for spins" ON spins;
CREATE POLICY "Public read access for spins" ON spins
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public read access for coupons" ON coupons;
CREATE POLICY "Public read access for coupons" ON coupons
  FOR SELECT TO public USING (true);
