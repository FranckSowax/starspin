# 📹 Guide d'Upload des Vidéos Démo sur Supabase

## 🎯 Objectif
Uploader 2 vidéos de démo (75 Mo chacune) : une en français et une en anglais

---

## 📋 Étape 1 : Créer le Bucket dans Supabase Dashboard

### Via l'interface Supabase :

1. **Connectez-vous à Supabase** : https://supabase.com/dashboard
2. **Sélectionnez votre projet StarSpin**
3. **Allez dans "Storage"** (menu de gauche)
4. **Cliquez sur "New bucket"**
5. **Configurez le bucket** :
   - **Name** : `demo-videos`
   - **Public bucket** : ✅ **OUI** (cochez cette case)
   - **File size limit** : `104857600` (100 MB)
   - **Allowed MIME types** : `video/mp4,video/webm,video/quicktime`
6. **Cliquez sur "Create bucket"**

---

## 📋 Étape 2 : Configurer les Permissions (Policies)

1. **Allez dans "SQL Editor"** (menu de gauche)
2. **Créez une nouvelle query**
3. **Copiez et collez le contenu du fichier** `SETUP_VIDEO_STORAGE.sql`
4. **Cliquez sur "Run"**

---

## 📋 Étape 3 : Uploader les Vidéos

### Option A : Via l'interface Supabase (Recommandé pour 75 Mo)

1. **Allez dans Storage > demo-videos**
2. **Cliquez sur "Upload file"**
3. **Sélectionnez votre vidéo FR** (ex: `demo-fr.mp4`)
4. **Attendez la fin de l'upload** (peut prendre 2-3 minutes pour 75 Mo)
5. **Répétez pour la vidéo EN** (ex: `demo-en.mp4`)

### Option B : Via Code (pour automatisation future)

```typescript
import { supabase } from '@/lib/supabase/client';

async function uploadDemoVideo(file: File, language: 'fr' | 'en') {
  const fileName = `demo-${language}.mp4`;
  
  const { data, error } = await supabase.storage
    .from('demo-videos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true // Remplace si existe déjà
    });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  // Obtenir l'URL publique
  const { data: { publicUrl } } = supabase.storage
    .from('demo-videos')
    .getPublicUrl(fileName);

  return publicUrl;
}
```

---

## 📋 Étape 4 : Obtenir les URLs des Vidéos

Après l'upload, récupérez les URLs publiques :

1. **Dans Storage > demo-videos**
2. **Cliquez sur le fichier vidéo**
3. **Copiez l'URL publique** qui ressemble à :
   ```
   https://[votre-projet].supabase.co/storage/v1/object/public/demo-videos/demo-fr.mp4
   https://[votre-projet].supabase.co/storage/v1/object/public/demo-videos/demo-en.mp4
   ```

---

## 📋 Étape 5 : Intégration dans la Landing Page

Les URLs seront utilisées dans le composant de la landing page avec détection automatique de langue.

---

## ⚠️ Limitations Supabase Storage (Plan Gratuit)

- **Stockage total** : 1 GB
- **Bande passante** : 2 GB/mois (environ 13 vues complètes de vos 2 vidéos)
- **Taille max par fichier** : 50 MB par défaut (on l'a augmenté à 100 MB)

### 💡 Recommandations :

1. **Compressez vos vidéos** si possible :
   - Utilisez HandBrake ou FFmpeg
   - Target : 30-40 Mo au lieu de 75 Mo
   - Qualité : 720p suffit pour une démo web
   - Codec : H.264 (MP4)

2. **Commande FFmpeg pour compresser** :
   ```bash
   ffmpeg -i demo-original.mp4 -vcodec h264 -crf 28 -preset slow demo-compressed.mp4
   ```

3. **Alternative si dépassement de quota** :
   - YouTube (gratuit, illimité, CDN mondial)
   - Vimeo (meilleure qualité, payant)
   - Cloudflare Stream (optimisé vidéo, ~5$/mois)

---

## ✅ Vérification

Après upload, testez l'URL dans votre navigateur :
```
https://[votre-projet].supabase.co/storage/v1/object/public/demo-videos/demo-fr.mp4
```

La vidéo devrait se lire directement dans le navigateur.

---

## 🚀 Prochaines Étapes

Une fois les vidéos uploadées, je vais :
1. Créer un composant VideoPlayer responsive
2. Intégrer la détection de langue (FR/EN/TH)
3. Ajouter le player sur la landing page
4. Optimiser le chargement (lazy loading)
