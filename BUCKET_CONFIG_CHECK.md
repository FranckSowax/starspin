# Vérification Configuration Bucket Supabase

## Erreur 400 - Causes Possibles

L'erreur 400 sur l'upload indique un problème de configuration du bucket. Voici les vérifications à faire :

### 1. Vérifier que le Bucket est Public

1. Allez dans **Supabase Dashboard** > **Storage**
2. Cliquez sur le bucket `merchant-assets`
3. Cliquez sur **Settings** (icône engrenage)
4. Vérifiez que **"Public bucket"** est ✅ **COCHÉ**
5. Si ce n'est pas le cas, cochez-le et cliquez sur **Save**

### 2. Vérifier les Policies

Dans **SQL Editor**, exécutez cette requête pour voir les policies existantes :

```sql
SELECT 
  policyname, 
  cmd, 
  qual, 
  with_check 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
```

Vous devriez voir 4 policies pour `merchant-assets` :
- `Users can upload their own images` (INSERT)
- `Public read access` (SELECT)
- `Users can update their own images` (UPDATE)
- `Users can delete their own images` (DELETE)

### 3. Vérifier les Permissions du Bucket

Exécutez cette requête pour voir la configuration du bucket :

```sql
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'merchant-assets';
```

Le bucket doit avoir :
- `public` = `true`
- `file_size_limit` = `10485760` (10 MB) ou `null`
- `allowed_mime_types` = `["image/jpeg","image/png","image/webp"]` ou `null`

### 4. Si le Bucket n'est pas Public

Exécutez cette commande SQL pour le rendre public :

```sql
UPDATE storage.buckets
SET public = true
WHERE name = 'merchant-assets';
```

### 5. Recréer le Bucket si Nécessaire

Si rien ne fonctionne, supprimez et recréez le bucket :

```sql
-- Supprimer tous les fichiers d'abord
DELETE FROM storage.objects WHERE bucket_id = 'merchant-assets';

-- Supprimer le bucket
DELETE FROM storage.buckets WHERE name = 'merchant-assets';

-- Recréer le bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'merchant-assets',
  'merchant-assets',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);
```

Puis réexécutez les policies du fichier `FIX_STORAGE_POLICIES.sql`.

### 6. Tester l'Upload

Après avoir vérifié/corrigé la configuration :
1. Rafraîchissez la page `/dashboard/settings`
2. Essayez d'uploader une image
3. Vérifiez la console du navigateur pour voir le message d'erreur exact
4. L'erreur devrait maintenant afficher un message plus détaillé grâce au logging ajouté

### 7. Vérifier les CORS (si erreur persiste)

Si vous voyez une erreur CORS, ajoutez cette configuration dans **Supabase Dashboard** > **Storage** > **Configuration** :

```json
{
  "allowedOrigins": ["http://localhost:3000", "https://votre-domaine.netlify.app"],
  "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
  "allowedHeaders": ["*"],
  "maxAge": 3600
}
```

## Message d'Erreur Attendu

Avec le nouveau code, vous devriez voir dans la console du navigateur un message d'erreur détaillé comme :
- `"Bucket not found"` → Le bucket n'existe pas
- `"new row violates row-level security policy"` → Problème de policies
- `"Bucket is not public"` → Le bucket n'est pas public
- `"File type not allowed"` → Type MIME non autorisé
