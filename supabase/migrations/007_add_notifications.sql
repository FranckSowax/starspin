-- ============================================================
-- Migration: Add Notifications System
-- Date: 2026-01-06
-- Description: Creates notifications table for merchant events
-- ============================================================

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_notifications_merchant_id ON notifications(merchant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- 3. Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies - Merchants can only see their own notifications
CREATE POLICY "Merchants can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = merchant_id);

CREATE POLICY "Merchants can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = merchant_id);

CREATE POLICY "Merchants can delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = merchant_id);

-- 5. Service role can insert notifications (for API routes)
CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- 6. Add comments for documentation
COMMENT ON TABLE notifications IS 'Stores merchant notifications for app events';
COMMENT ON COLUMN notifications.type IS 'Type of notification: feedback, spin, coupon_used, new_customer';
COMMENT ON COLUMN notifications.title IS 'Short notification title';
COMMENT ON COLUMN notifications.message IS 'Detailed notification message';
COMMENT ON COLUMN notifications.data IS 'Additional JSON data (rating, prize_name, etc.)';
COMMENT ON COLUMN notifications.read IS 'Whether the notification has been read';

-- 7. Reload schema cache
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- END OF MIGRATION
-- ============================================================
