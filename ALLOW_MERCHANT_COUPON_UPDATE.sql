-- Allow merchants to update their own coupons (to mark them as used)
DROP POLICY IF EXISTS "Merchants can update their own coupons" ON coupons;
CREATE POLICY "Merchants can update their own coupons"
  ON coupons FOR UPDATE
  TO authenticated
  USING (merchant_id = auth.uid());

-- Allow merchants to select their own coupons (for verification)
DROP POLICY IF EXISTS "Merchants can view their own coupons" ON coupons;
CREATE POLICY "Merchants can view their own coupons"
  ON coupons FOR SELECT
  TO authenticated
  USING (merchant_id = auth.uid());
