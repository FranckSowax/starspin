-- Migration: Add birthday to loyalty_clients
-- This allows storing the client's birthday for birthday promotions

ALTER TABLE loyalty_clients
ADD COLUMN IF NOT EXISTS birthday DATE;

-- Add comment
COMMENT ON COLUMN loyalty_clients.birthday IS 'Client birthday for birthday promotions and gifts';
