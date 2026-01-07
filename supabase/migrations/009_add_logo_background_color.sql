-- Migration: Add logo_background_color to merchants table
-- Created: 2026-01-07
-- Description: Allows merchants to customize the background color of their logo
-- on the spin wheel and coupon pages (useful when logo is white/light colored)

-- Add logo_background_color column (default to white for backward compatibility)
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS logo_background_color TEXT DEFAULT '#FFFFFF';

-- Comment on the column
COMMENT ON COLUMN merchants.logo_background_color IS 'Background color for the logo circle on spin wheel and coupon pages (hex color like #000000)';
