# Corrections des Bugs StarSpin

## 🐛 Bugs Corrigés

### 1. Erreur d'Hydration React
**Problème :** Erreur "Hydration failed because the server rendered text didn't match the client"

**Cause :** Les textes de chargement traduits (`t('common.loading')`) différaient entre le serveur et le client à cause de l'initialisation de i18next.

**Solution :**
- Ajout d'un état `isClient` pour s'assurer que le rendu ne se fait que côté client
- Utilisation de texte statique "Loading..." pendant le chargement initial
- Application sur toutes les pages : `rate`, `social`, `spin`, `coupon`

**Fichiers modifiés :**
- `app/rate/[shopId]/page.tsx`
- `app/social/[shopId]/page.tsx`
- `app/spin/[shopId]/page.tsx`
- `app/coupon/[shopId]/page.tsx`

### 2. Erreur Supabase 406 (Not Acceptable)
**Problème :** `Failed to load resource: the server responded with a status of 406`

**Cause :** Header `Accept: application/json` manquant dans les requêtes Supabase.

**Solution :**
- Ajout de la configuration globale avec header `Accept: application/json`
- Configuration de `persistSession: true` et `autoRefreshToken: true`
- Amélioration de la gestion d'erreur dans les requêtes

**Fichier modifié :**
- `lib/supabase/client.ts`

### 3. Restauration Complète de la Base de Données
**Problème :** Perte de données et de structure suite à l'exécution accidentelle de `schema.sql`.
**Symptômes :** 
- Erreurs 400 Bad Request (colonnes manquantes)
- Erreurs 403 Forbidden (RLS manquantes)
- Erreurs 406 Not Acceptable (Cache schema obsolète)
- "Commerce introuvable" sur mobile

**Solution :**
Création d'un script maître `supabase/CHECK_AND_FIX_ALL.sql` qui :
1. **Restaure les colonnes manquantes :**
   - `merchants`: social links, `google_maps_url`, `unlucky_probability`, `prize_quantities`, etc.
   - `feedback`: `customer_email`, `user_token`
   - `spins`: `user_token`, `ip_hash`
2. **Réinitialise la sécurité (RLS) :**
   - Accès public pour la lecture (merchants, prizes, spins)
   - Accès public pour l'insertion (feedback, spins, coupons)
   - Accès marchand sécurisé pour leurs données
3. **Corrige les permissions de stockage :** Bucket `merchant-assets`
4. **Recharge le cache Schema :** `NOTIFY pgrst, 'reload schema'`

**Fichier à exécuter :**
- `supabase/CHECK_AND_FIX_ALL.sql`

## ✅ Code Corrigé

### Pattern utilisé pour toutes les pages

```typescript
const [isClient, setIsClient] = useState(false);

useEffect(() => {
  setIsClient(true);
}, []);

// Dans le rendu
if (!isClient || !data) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FF6F61] to-[#FFC107]">
      <div className="bg-white rounded-3xl shadow-2xl p-8">
        <p className="text-lg text-gray-900">Loading...</p>
      </div>
    </div>
  );
}
```

### Configuration Supabase

```typescript
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        'Accept': 'application/json',
      },
    },
  }
);
```

## 🧪 Tests à Effectuer

1. **Tester le flux complet :**
   ```
   http://localhost:3000/rate/da56ba06-8a5c-48e1-a45e-add9601422d0
   ```

2. **Vérifier la console :**
   - ✅ Plus d'erreur d'hydration
   - ✅ Plus d'erreur 406
   - ✅ Requêtes Supabase réussies

3. **Tester toutes les pages :**
   - Page de notation (rate)
   - Page sociale (social)
   - Page de roue (spin)
   - Page de coupon (coupon)

## 📝 Notes

- Les erreurs de LaunchDarkly et les avertissements React DevTools sont normaux en développement
- L'erreur "message port closed" est liée aux extensions Chrome et peut être ignorée
- Le Fast Refresh fonctionne correctement

## 🚀 Prochaines Étapes

1. Tester avec le compte démo : `demo@starspin.app` / `Demo123!`
2. Vérifier que toutes les fonctionnalités marchent
3. Tester sur différents navigateurs
4. Vérifier la performance avec Lighthouse

---

**Date des corrections :** 27 décembre 2025  
**Version :** 1.0.0

---

## 🔧 Maintenance Base de Données (30 Décembre 2025)

### 3. Restauration Complète de la Base de Données
**Problème :** Perte de données et de structure suite à l'exécution accidentelle de `schema.sql`.
**Symptômes :** 
- Erreurs 400 Bad Request (colonnes manquantes)
- Erreurs 403 Forbidden (RLS manquantes)
- Erreurs 406 Not Acceptable (Cache schema obsolète)
- "Commerce introuvable" sur mobile

**Solution :**
Création d'un script maître `supabase/CHECK_AND_FIX_ALL.sql` qui :
1. **Restaure les colonnes manquantes :**
   - `merchants`: social links, `google_maps_url`, `unlucky_probability`, `prize_quantities`, etc.
   - `feedback`: `customer_email`, `user_token`
   - `spins`: `user_token`, `ip_hash`
2. **Réinitialise la sécurité (RLS) :**
   - Accès public pour la lecture (merchants, prizes, spins)
   - Accès public pour l'insertion (feedback, spins, coupons)
   - Accès marchand sécurisé pour leurs données
3. **Corrige les permissions de stockage :** Bucket `merchant-assets`
4. **Recharge le cache Schema :** `NOTIFY pgrst, 'reload schema'`

**Fichier à exécuter :**
- `supabase/CHECK_AND_FIX_ALL.sql`
