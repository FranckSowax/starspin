-- ============================================================
-- FIX SCHEMA & SYNCHRONISATION
-- ============================================================

-- 1. Ajouter les colonnes manquantes
ALTER TABLE public.merchants 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 2. Insérer les utilisateurs manquants (Synchronisation)
INSERT INTO public.merchants (id, email, business_name, subscription_tier, created_at, is_active)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'business_name', 'Commerce Sans Nom'),
  COALESCE(raw_user_meta_data->>'subscription_tier', 'starter'),
  created_at,
  true
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET 
  is_active = EXCLUDED.is_active,
  created_at = COALESCE(merchants.created_at, EXCLUDED.created_at);

-- 3. Mettre à jour le Trigger pour les futurs utilisateurs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.merchants (id, email, business_name, subscription_tier, is_active, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'Nouveau Commerce'),
    'starter',
    true,
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 4. Vérification
SELECT count(*) as "Total Marchands" FROM public.merchants;
