# Système de Liens Rate - Documentation

## 📍 Comment Fonctionne le Lien Rate

### 1. Création Automatique à l'Inscription

Quand un marchand s'inscrit via `/auth/signup` :

```typescript
// app/auth/signup/page.tsx ligne 37-42
const { error: merchantError } = await supabase.from('merchants').insert({
  id: data.user.id,  // ← L'ID utilisateur devient l'ID du marchand
  email,
  business_name: businessName,
  subscription_tier: 'starter',
});
```

**L'ID du marchand = L'ID de l'utilisateur Supabase**

### 2. Construction du Lien Rate

Le lien est construit automatiquement avec l'ID du marchand :

```
Format: {NEXT_PUBLIC_APP_URL}/rate/{merchant_id}
Exemple: https://starspin.app/rate/da56ba06-8a5c-48e1-a45e-add9601422d0
```

**Où est-il utilisé :**
- `app/dashboard/page.tsx` ligne 396 : Affichage du lien
- `app/dashboard/qr/page.tsx` ligne 38 : Génération du QR code
- `app/dashboard/qr/page.tsx` ligne 103 : Affichage du lien

### 3. Page de Notation

La page `/rate/[shopId]/page.tsx` :
- Récupère l'ID du shop depuis l'URL
- Charge les infos du marchand depuis la table `merchants`
- Affiche le formulaire de notation personnalisé (logo, background)
- Enregistre les feedbacks dans la table `feedback`

## 🔄 Flux Complet

```
1. Inscription Marchand
   ↓
2. Création entrée dans table 'merchants' avec ID = user.id
   ↓
3. Lien Rate généré automatiquement : /rate/{user.id}
   ↓
4. QR Code créé avec ce lien dans /dashboard/qr
   ↓
5. Client scanne QR → Redirigé vers /rate/{merchant_id}
   ↓
6. Client note → Feedback enregistré avec merchant_id
```

## 📊 Tables Impliquées

### Table `merchants`
```sql
- id (UUID) : ID de l'utilisateur Supabase
- email (TEXT)
- business_name (TEXT)
- logo_url (TEXT) : Logo affiché sur page rate
- background_url (TEXT) : Background de la page rate
- subscription_tier (TEXT)
```

### Table `feedback`
```sql
- id (UUID)
- merchant_id (UUID) : Référence vers merchants.id
- rating (INTEGER)
- comment (TEXT)
- is_positive (BOOLEAN)
- user_token (TEXT) : Token unique du client
- created_at (TIMESTAMP)
```

## 🎯 Ce qu'il Manque (Besoin Super Dashboard)

### Problèmes Actuels :
1. ❌ Pas de vue d'ensemble de tous les marchands
2. ❌ Pas de gestion centralisée des QR codes
3. ❌ Pas de statistiques globales
4. ❌ Pas d'administration des comptes marchands
5. ❌ Pas de possibilité de désactiver un compte
6. ❌ Pas de vue des revenus totaux

### Solution : Super Dashboard Admin

Un dashboard administrateur pour :
- ✅ Voir tous les marchands inscrits
- ✅ Voir leurs QR codes et liens rate
- ✅ Télécharger les QR codes en masse
- ✅ Voir les statistiques par marchand
- ✅ Gérer les abonnements
- ✅ Activer/Désactiver des comptes
- ✅ Voir les revenus globaux

## 🔐 Sécurité

### Actuel :
- Chaque marchand ne voit que son propre dashboard
- Les liens rate sont publics (accessible par n'importe qui avec le lien)
- Pas de système d'admin

### À Implémenter :
- Table `admins` ou colonne `is_admin` dans `merchants`
- Middleware pour protéger les routes admin
- RLS policies pour limiter l'accès aux données
