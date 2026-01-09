-- Migration: Add contact_messages table for Multi Store contact requests
-- Created: 2026-01-09

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  establishments TEXT,
  message TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  source TEXT DEFAULT 'contact_page',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email);

-- Enable RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow anyone to insert (for contact form submissions)
CREATE POLICY "Anyone can submit contact messages"
  ON contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only service role can read (for admin dashboard)
CREATE POLICY "Service role can read all contact messages"
  ON contact_messages
  FOR SELECT
  TO service_role
  USING (true);

-- Only service role can update (for marking as read/replied)
CREATE POLICY "Service role can update contact messages"
  ON contact_messages
  FOR UPDATE
  TO service_role
  USING (true);

-- Only service role can delete
CREATE POLICY "Service role can delete contact messages"
  ON contact_messages
  FOR DELETE
  TO service_role
  USING (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_contact_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_contact_messages_updated_at ON contact_messages;
CREATE TRIGGER trigger_update_contact_messages_updated_at
  BEFORE UPDATE ON contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_messages_updated_at();

-- Grant permissions
GRANT INSERT ON contact_messages TO anon;
GRANT INSERT ON contact_messages TO authenticated;
GRANT ALL ON contact_messages TO service_role;
