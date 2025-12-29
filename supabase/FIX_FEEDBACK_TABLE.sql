-- ============================================
-- FIX FEEDBACK TABLE - Ajouter la colonne manquante
-- ============================================
-- La table feedback a besoin de la colonne customer_email

-- Vérifier si la colonne existe déjà
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'feedback' 
        AND column_name = 'customer_email'
    ) THEN
        ALTER TABLE feedback ADD COLUMN customer_email TEXT;
    END IF;
END $$;

-- Vérifier le résultat
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'feedback'
ORDER BY ordinal_position;
