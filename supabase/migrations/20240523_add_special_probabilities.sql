-- Add special probability columns to merchants table
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS unlucky_probability INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS retry_probability INTEGER DEFAULT 10;
