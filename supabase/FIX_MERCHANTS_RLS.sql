-- ============================================
-- FIX MERCHANTS RLS - PUBLIC ACCESS
-- ============================================
-- Ce script permet aux utilisateurs publics (clients) de voir les infos des commerçants
-- C'est indispensable pour que les liens de partage fonctionnent sur mobile (sans login)

-- Permettre la lecture publique de la table merchants
DROP POLICY IF EXISTS "Public can view merchants" ON merchants;
CREATE POLICY "Public can view merchants" ON merchants
  FOR SELECT 
  USING (true);

-- Recharger le cache pour être sûr
NOTIFY pgrst, 'reload schema';
