# 🚀 StarSpin - Guide de Démarrage Rapide

## ✅ Configuration Supabase Complétée

Vos credentials Supabase sont déjà configurés dans `.env.local` :
- URL: https://egemjezgejptazoucwci.supabase.co
- Anon Key: ✓ Configurée
- Service Role Key: ✓ Configurée

## 📋 Étapes pour Initialiser la Base de Données

### Option 1 : Via le Dashboard Supabase (Recommandé - 2 minutes)

1. **Ouvrez votre projet Supabase** :
   👉 https://supabase.com/dashboard/project/egemjezgejptazoucwci/editor

2. **Allez dans "SQL Editor"** (menu de gauche)

3. **Cliquez sur "New Query"**

4. **Copiez tout le contenu** du fichier `supabase/schema.sql`

5. **Collez dans l'éditeur SQL** et cliquez sur **"Run"** (ou Ctrl+Enter)

6. **Attendez la confirmation** "Success. No rows returned"

✅ C'est fait ! Votre base de données est prête.

### Option 2 : Via Supabase CLI (Alternative)

```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter
supabase login

# Lier le projet
supabase link --project-ref egemjezgejptazoucwci

# Appliquer le schéma
supabase db push
```

## 🎯 Lancer l'Application

Une fois la base de données initialisée :

```bash
# Installer les dépendances (si pas déjà fait)
npm install

# Lancer le serveur de développement
npm run dev
```

Ouvrez http://localhost:3000 dans votre navigateur.

## 🧪 Tester l'Application

### 1. Créer un compte marchand
- Allez sur http://localhost:3000
- Cliquez sur "Get Started - Free Trial"
- Créez un compte avec votre email

### 2. Configurer votre boutique
- Ajoutez des prix dans "Manage Prizes"
- Assurez-vous que les probabilités totalisent 100%
- Générez votre QR code dans "Generate QR Code"

### 3. Tester le flux client
- Copiez l'URL de notation (format: `/rate/[votre-id]`)
- Ouvrez dans un nouvel onglet ou sur mobile
- Testez le flux complet : notation → social → roue → coupon

## 📊 Tables Créées

Le schéma SQL crée automatiquement :
- ✅ `merchants` - Comptes marchands
- ✅ `prizes` - Prix configurables
- ✅ `feedback` - Avis clients
- ✅ `spins` - Historique des tours de roue
- ✅ `coupons` - Coupons générés
- ✅ `qr_codes` - QR codes générés
- ✅ `subscription_tiers` - Plans d'abonnement (Starter, Pro, Multi-shop)

## 🔒 Sécurité

- Row Level Security (RLS) activée sur toutes les tables
- Les marchands ne peuvent voir que leurs propres données
- Authentification JWT via Supabase Auth
- Protection anti-fraude (1 tour par appareil/jour)

## 🌍 Langues Supportées

L'application détecte automatiquement la langue du navigateur :
- 🇬🇧 Anglais (EN)
- 🇫🇷 Français (FR)
- 🇪🇸 Espagnol (ES)
- 🇸🇦 Arabe (AR)
- 🇹🇭 Thaï (TH)
- 🇨🇳 Chinois (ZH)

## 🎨 Personnalisation

### Couleurs du thème (dans les composants)
- Primary: `#FF6F61` (Coral)
- Secondary: `#4CAF50` (Green)
- Accent: `#FFC107` (Amber)

### Modifier les plans d'abonnement
Éditez les valeurs dans `supabase/schema.sql` (lignes 98-101) avant d'exécuter le schéma.

## 🐛 Dépannage

### Erreur de connexion Supabase
- Vérifiez que les credentials dans `.env.local` sont corrects
- Assurez-vous que le projet Supabase est actif

### Tables non trouvées
- Exécutez le schéma SQL dans le dashboard Supabase
- Vérifiez dans "Table Editor" que les tables sont créées

### Erreurs d'authentification
- Activez "Email" dans Authentication > Providers
- Configurez les templates d'email

## 📞 Support

- Documentation complète : `/documentation`
- Setup détaillé : `SETUP.md`
- Schéma de base de données : `supabase/schema.sql`

---

**Prêt à lancer StarSpin !** 🎉
