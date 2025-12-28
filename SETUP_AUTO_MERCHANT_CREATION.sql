-- ============================================
-- CRÉATION AUTOMATIQUE DU PROFIL MARCHAND
-- ============================================
-- Ce script crée un trigger qui génère automatiquement
-- un profil marchand lorsqu'un nouvel utilisateur s'inscrit.
-- Cela évite les problèmes de RLS lors de l'inscription.
-- ============================================

-- Fonction qui crée le profil marchand
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.merchants (id, email, business_name, subscription_tier)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'Mon Commerce'),
    'starter'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le trigger sur la table auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- VÉRIFICATION
-- ============================================
-- Vérifier que le trigger est créé
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============================================
-- NOTES IMPORTANTES
-- ============================================
-- 1. Ce trigger s'exécute avec SECURITY DEFINER, ce qui signifie
--    qu'il s'exécute avec les privilèges du propriétaire de la fonction
--    (généralement le superuser), contournant ainsi les politiques RLS.
--
-- 2. Le business_name est récupéré des métadonnées utilisateur
--    passées lors de l'inscription via signUp({ data: { business_name } })
--
-- 3. ON CONFLICT DO NOTHING évite les erreurs si le profil existe déjà
--
-- 4. Après avoir exécuté ce script, les nouvelles inscriptions
--    créeront automatiquement un profil marchand.
-- ============================================
