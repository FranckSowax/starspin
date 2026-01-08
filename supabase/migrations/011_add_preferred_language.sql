-- Migration: Add preferred_language to loyalty_clients
-- This allows storing the client's language preference for the card page

ALTER TABLE loyalty_clients
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'fr';

-- Add comment
COMMENT ON COLUMN loyalty_clients.preferred_language IS 'Client preferred language (fr, en, th, es, pt)';
