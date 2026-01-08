# 🎯 Prompt Claude Code - Intégration Système Carte Fidélité Digitale

## Contexte du projet

Je souhaite intégrer un système complet de cartes de fidélité digitales dans mon application Next.js/Supabase. Le système doit permettre :

1. **Génération automatique de carte** quand un client scanne un QR code
2. **Envoi WhatsApp** via l'API Whapi avec bouton interactif
3. **Carte digitale** avec QR code unique pour collecter des points
4. **Export Apple Wallet / Google Wallet**
5. **Dashboard admin** pour gérer clients, points, récompenses

---

## 📋 Spécifications Techniques

### Stack technologique
- **Frontend**: Next.js 14+ (App Router)
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions)
- **API WhatsApp**: Whapi.cloud
- **Wallet**: passkit-generator (Apple), Google Wallet API
- **QR Code**: qrcode (npm)
- **Styling**: Tailwind CSS + shadcn/ui

### Structure de base de données (Supabase)

```sql
-- Table des entreprises (multi-tenant)
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  card_color TEXT DEFAULT '#6366f1',
  points_per_purchase INTEGER DEFAULT 10,
  purchase_amount INTEGER DEFAULT 1000, -- en FCFA
  welcome_points INTEGER DEFAULT 50,
  whatsapp_message TEXT DEFAULT 'Bienvenue! Votre carte fidélité est prête avec {points} points!',
  whapi_token TEXT, -- Token API Whapi
  apple_pass_type_id TEXT,
  apple_team_id TEXT,
  google_issuer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des clients fidélité
CREATE TABLE loyalty_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  card_id TEXT UNIQUE NOT NULL, -- Ex: STU-2024-0001
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  points INTEGER DEFAULT 0,
  total_purchases INTEGER DEFAULT 0,
  qr_code_data TEXT UNIQUE NOT NULL, -- Donnée encodée dans le QR
  wallet_pass_url TEXT,
  google_pass_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired')),
  last_visit TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des transactions de points
CREATE TABLE points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES loyalty_clients(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'bonus', 'adjustment')),
  points INTEGER NOT NULL,
  purchase_amount INTEGER, -- Montant d'achat associé
  description TEXT,
  staff_id UUID, -- Qui a effectué la transaction
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des récompenses
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('discount', 'product', 'service')),
  value TEXT NOT NULL, -- "10" pour 10%, "Produit X" pour produit
  points_cost INTEGER NOT NULL,
  quantity_available INTEGER, -- NULL = illimité
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des récompenses échangées
CREATE TABLE redeemed_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES loyalty_clients(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES rewards(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  redemption_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired')),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_clients_business ON loyalty_clients(business_id);
CREATE INDEX idx_clients_phone ON loyalty_clients(phone);
CREATE INDEX idx_clients_qr ON loyalty_clients(qr_code_data);
CREATE INDEX idx_transactions_client ON points_transactions(client_id);
CREATE INDEX idx_rewards_business ON rewards(business_id);

-- RLS Policies
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE redeemed_rewards ENABLE ROW LEVEL SECURITY;
```

---

## 🔧 API Routes à créer

### 1. `/api/loyalty/scan` - Scan QR Code client

```typescript
// app/api/loyalty/scan/route.ts
/**
 * POST /api/loyalty/scan
 * 
 * Body: {
 *   businessId: string,
 *   clientPhone: string,
 *   clientName?: string
 * }
 * 
 * Actions:
 * 1. Vérifier si le client existe déjà (par phone + business)
 * 2. Si nouveau: créer client + générer cardId + QR code unique
 * 3. Ajouter les points de bienvenue
 * 4. Générer le pass Apple Wallet (.pkpass)
 * 5. Générer le lien Google Wallet
 * 6. Envoyer message WhatsApp via Whapi avec:
 *    - Message de bienvenue personnalisé
 *    - Image de la carte
 *    - Bouton "Obtenir ma carte fidélité" (lien vers page web)
 * 7. Retourner les infos client
 * 
 * Response: {
 *   success: boolean,
 *   client: LoyaltyClient,
 *   isNewClient: boolean,
 *   walletUrls: { apple: string, google: string }
 * }
 */
```

### 2. `/api/loyalty/points` - Gestion des points

```typescript
// app/api/loyalty/points/route.ts
/**
 * POST /api/loyalty/points
 * 
 * Body: {
 *   clientQrCode: string, // Scanné depuis la carte du client
 *   businessId: string,
 *   action: 'earn' | 'redeem',
 *   amount?: number, // Montant d'achat pour calcul points
 *   rewardId?: string // Si action = redeem
 * }
 * 
 * Actions earn:
 * 1. Scanner le QR code client
 * 2. Calculer points selon règle business (ex: 10pts/1000 FCFA)
 * 3. Créer transaction
 * 4. Mettre à jour solde client
 * 5. Optionnel: Notifier client WhatsApp
 * 
 * Actions redeem:
 * 1. Vérifier points suffisants
 * 2. Vérifier disponibilité récompense
 * 3. Créer code de rédemption unique
 * 4. Déduire points
 * 5. Notifier client
 */
```

### 3. `/api/loyalty/wallet/apple` - Génération Pass Apple

```typescript
// app/api/loyalty/wallet/apple/[clientId]/route.ts
/**
 * GET /api/loyalty/wallet/apple/[clientId]
 * 
 * Génère et retourne un fichier .pkpass
 * 
 * Utiliser: passkit-generator
 * 
 * Structure du pass:
 * - Type: storeCard (carte fidélité)
 * - Champs principaux: nom client, points, n° carte
 * - QR code: données uniques pour scan
 * - Couleur: selon config business
 * - Logo: logo business
 * 
 * Headers response:
 * Content-Type: application/vnd.apple.pkpass
 * Content-Disposition: attachment; filename="carte-fidelite.pkpass"
 */
```

### 4. `/api/loyalty/wallet/google` - Lien Google Wallet

```typescript
// app/api/loyalty/wallet/google/[clientId]/route.ts
/**
 * GET /api/loyalty/wallet/google/[clientId]
 * 
 * Crée un objet Google Wallet et retourne le lien "Add to Google Wallet"
 * 
 * Utiliser: Google Wallet API (REST)
 * 
 * Steps:
 * 1. Créer/mettre à jour LoyaltyClass (template)
 * 2. Créer LoyaltyObject (instance client)
 * 3. Générer JWT signé
 * 4. Retourner URL: https://pay.google.com/gp/v/save/{jwt}
 */
```

### 5. `/api/whapi/send-card` - Envoi WhatsApp

```typescript
// app/api/whapi/send-card/route.ts
/**
 * POST /api/whapi/send-card
 * 
 * Body: {
 *   clientId: string,
 *   businessId: string
 * }
 * 
 * Utilise l'API Whapi pour envoyer:
 * 1. Message texte personnalisé
 * 2. Image de la carte (générée)
 * 3. Bouton interactif avec lien
 * 
 * Endpoint Whapi: POST https://gate.whapi.cloud/messages/text
 * + POST https://gate.whapi.cloud/messages/image
 * + POST https://gate.whapi.cloud/messages/interactive
 */
```

---

## 📱 Pages Dashboard à créer

### Structure des fichiers

```
app/
├── dashboard/
│   └── [businessSlug]/
│       └── loyalty/
│           ├── page.tsx          # Vue d'ensemble
│           ├── clients/
│           │   ├── page.tsx      # Liste clients
│           │   └── [id]/
│           │       └── page.tsx  # Détail client
│           ├── rewards/
│           │   └── page.tsx      # Gestion récompenses
│           ├── scanner/
│           │   └── page.tsx      # Interface scan caisse
│           └── settings/
│               └── page.tsx      # Configuration
├── card/
│   └── [cardId]/
│       └── page.tsx              # Page publique carte client
```

### Composants UI nécessaires

```typescript
// components/loyalty/
├── DigitalCard.tsx        // Affichage carte avec QR code
├── ClientList.tsx         // Liste clients avec recherche/filtres
├── ClientDetails.tsx      // Fiche détaillée client
├── PointsManager.tsx      // Ajout/retrait points
├── RewardCard.tsx         // Carte récompense
├── RewardEditor.tsx       // Formulaire création/édition récompense
├── QrScanner.tsx          // Scanner QR (caisse)
├── StatsOverview.tsx      // Dashboard statistiques
├── WhatsAppPreview.tsx    // Prévisualisation message WA
└── WalletButtons.tsx      // Boutons Add to Wallet
```

---

## 🔐 Configuration requise

### Variables d'environnement

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Whapi
WHAPI_API_TOKEN=
WHAPI_WEBHOOK_SECRET=

# Apple Wallet
APPLE_PASS_TYPE_ID=pass.com.studiaacademy.loyalty
APPLE_TEAM_ID=XXXXXXXXXX
APPLE_PASS_CERTIFICATE= # Base64 du .p12
APPLE_PASS_CERTIFICATE_PASSWORD=

# Google Wallet
GOOGLE_WALLET_ISSUER_ID=
GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL=
GOOGLE_WALLET_PRIVATE_KEY=

# App
NEXT_PUBLIC_APP_URL=https://app.studiaacademy.ga
```

### Dépendances NPM

```json
{
  "dependencies": {
    "passkit-generator": "^3.2.0",
    "qrcode": "^1.5.3",
    "googleapis": "^130.0.0",
    "jsonwebtoken": "^9.0.2",
    "uuid": "^9.0.0",
    "sharp": "^0.33.0"
  }
}
```

---

## 📝 Flux utilisateur détaillé

### Flux 1: Nouveau client scanne QR en magasin

```
1. Client scanne QR code affiché en magasin (lien: /join/[businessSlug])
   ↓
2. Page web demande: Nom + Numéro WhatsApp
   ↓
3. Validation → API /api/loyalty/scan
   ↓
4. Backend:
   a. Génère cardId unique (STU-2024-XXXX)
   b. Génère QR code unique pour la carte
   c. Crée entrée loyalty_clients
   d. Ajoute points de bienvenue
   e. Génère .pkpass Apple
   f. Crée objet Google Wallet
   g. Envoie WhatsApp via Whapi:
      - "🎉 Bienvenue chez Studia Academy!"
      - "Votre carte fidélité est prête avec 50 points!"
      - [Image carte]
      - [Bouton: Ajouter à mon Wallet]
   ↓
5. Client reçoit WhatsApp → Clique bouton → Page /card/[cardId]
   ↓
6. Page affiche carte + boutons Apple/Google Wallet
```

### Flux 2: Client fidèle fait un achat

```
1. Client présente sa carte (QR code) en caisse
   ↓
2. Employé scanne avec app dashboard (/dashboard/[slug]/loyalty/scanner)
   ↓
3. Interface affiche: Client trouvé + solde actuel
   ↓
4. Employé entre montant d'achat (ex: 15000 FCFA)
   ↓
5. Calcul automatique: 15000/1000 × 10 = 150 points
   ↓
6. Validation → API /api/loyalty/points (action: earn)
   ↓
7. Backend:
   a. Crée transaction
   b. Met à jour solde
   c. Met à jour pass Wallet (push notification)
   d. Optionnel: WhatsApp "Vous avez gagné 150 points!"
   ↓
8. Interface confirme: "+150 points | Nouveau solde: 600 pts"
```

### Flux 3: Client échange ses points

```
1. Client consulte récompenses sur /card/[cardId]
   ↓
2. Sélectionne récompense (ex: "Réduction 10%" - 200 pts)
   ↓
3. Confirmation → API /api/loyalty/points (action: redeem)
   ↓
4. Backend:
   a. Vérifie solde suffisant
   b. Génère code rédemption unique
   c. Crée entrée redeemed_rewards
   d. Déduit points
   e. WhatsApp avec code rédemption
   ↓
5. Client reçoit code à présenter en caisse
   ↓
6. En caisse: Employé valide le code via dashboard
```

---

## 🎨 Design de la carte digitale

```
┌─────────────────────────────────┐
│  [Logo]  STUDIA ACADEMY         │
│          Carte Fidélité         │
├─────────────────────────────────┤
│                                 │
│      ┌─────────────────┐        │
│      │   [QR CODE]     │        │
│      │                 │        │
│      │  Scanner pour   │        │
│      │  vos points     │        │
│      └─────────────────┘        │
│                                 │
├─────────────────────────────────┤
│  Marie Koumba                   │
│  N° STU-2024-0001               │
├─────────────────────────────────┤
│  ★ 450 POINTS                   │
│  Dernière visite: 20/01/2024    │
└─────────────────────────────────┘
```

---

## ✅ Checklist d'implémentation

### Phase 1: Base de données & API Core
- [ ] Créer tables Supabase avec migrations
- [ ] Configurer RLS policies
- [ ] API /api/loyalty/scan (création client)
- [ ] API /api/loyalty/points (gestion points)
- [ ] Tests unitaires API

### Phase 2: Intégration WhatsApp (Whapi)
- [ ] Configuration compte Whapi
- [ ] API /api/whapi/send-card
- [ ] Génération image carte (sharp/canvas)
- [ ] Templates messages personnalisables
- [ ] Webhooks réception (optionnel)

### Phase 3: Wallet Integration
- [ ] Certificat Apple Developer
- [ ] Génération .pkpass avec passkit-generator
- [ ] Configuration Google Wallet API
- [ ] Génération liens Google Wallet
- [ ] Push notifications update pass

### Phase 4: Dashboard Admin
- [ ] Page overview avec stats
- [ ] Liste clients avec filtres/recherche
- [ ] Fiche client détaillée
- [ ] Interface scanner caisse
- [ ] Gestion récompenses CRUD
- [ ] Page paramètres

### Phase 5: Interface Client
- [ ] Page /join/[businessSlug] (inscription)
- [ ] Page /card/[cardId] (ma carte)
- [ ] Liste récompenses disponibles
- [ ] Historique transactions

### Phase 6: Finitions
- [ ] Tests E2E
- [ ] Optimisation performances
- [ ] Documentation API
- [ ] Déploiement production

---

## 🚀 Commandes pour démarrer

```bash
# Installer les dépendances
npm install passkit-generator qrcode googleapis jsonwebtoken uuid sharp

# Créer les tables (via Supabase CLI ou dashboard)
supabase db push

# Lancer en développement
npm run dev
```

---

## 📞 Support API Whapi

Documentation: https://whapi.cloud/docs

Endpoints utilisés:
- `POST /messages/text` - Envoyer texte
- `POST /messages/image` - Envoyer image
- `POST /messages/interactive` - Message avec boutons

Exemple requête:
```javascript
const response = await fetch('https://gate.whapi.cloud/messages/interactive', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${WHAPI_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: '24177123456',
    type: 'button',
    body: {
      text: '🎉 Votre carte fidélité est prête!'
    },
    action: {
      buttons: [
        {
          type: 'url',
          title: 'Obtenir ma carte',
          url: 'https://app.studiaacademy.ga/card/STU-2024-0001'
        }
      ]
    }
  })
});
```

---

Ce prompt contient toutes les spécifications nécessaires pour implémenter le système complet. Procède étape par étape en commençant par la Phase 1.
