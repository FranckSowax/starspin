-- Add email column to feedback table to collect customer emails
-- This allows merchants to collect customer contact information with ratings

ALTER TABLE feedback
ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN feedback.customer_email IS 'Customer email address collected during rating submission';

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'feedback' 
AND column_name = 'customer_email';
