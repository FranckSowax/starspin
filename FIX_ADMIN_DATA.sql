-- ============================================================
-- SCRIPT DE RÉPARATION DES DONNÉES ADMIN
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================================

-- 1. Insérer les utilisateurs manquants dans la table merchants
-- Cela prend tous les utilisateurs de auth.users qui ne sont pas encore dans merchants
INSERT INTO public.merchants (id, email, business_name, subscription_tier, created_at, is_active)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'business_name', 'Nouveau Commerce'),
  COALESCE(raw_user_meta_data->>'subscription_tier', 'starter'),
  created_at,
  true
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  -- Ne pas écraser le nom si déjà défini, sauf si c'est le défaut
  business_name = CASE 
    WHEN merchants.business_name = 'Nouveau Commerce' THEN EXCLUDED.business_name 
    ELSE merchants.business_name 
  END;

-- 2. Vérifier et recréer le trigger pour les futures inscriptions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.merchants (id, email, business_name, subscription_tier, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'Nouveau Commerce'),
    'starter',
    true
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Vérification des résultats
SELECT 
  (SELECT count(*) FROM auth.users) as "Total Users (Auth)",
  (SELECT count(*) FROM public.merchants) as "Total Marchands (Public)",
  (SELECT count(*) FROM public.merchants WHERE is_active = true) as "Marchands Actifs";

-- 4. Afficher les 5 derniers marchands ajoutés pour confirmation
SELECT id, email, business_name, created_at 
FROM merchants 
ORDER BY created_at DESC 
LIMIT 5;
