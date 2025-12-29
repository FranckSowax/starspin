-- Add segment quantity columns to merchants table
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS unlucky_quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS retry_quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS prize_quantities JSONB DEFAULT '{}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN merchants.unlucky_quantity IS 'Number of #UNLUCKY# segments on the wheel (default: 1)';
COMMENT ON COLUMN merchants.retry_quantity IS 'Number of #RÉESSAYER# segments on the wheel (default: 1)';
COMMENT ON COLUMN merchants.prize_quantities IS 'JSON object mapping prize IDs to their quantities on the wheel';
