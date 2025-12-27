# Guide d'Utilisation du MCP Supabase pour StarSpin

Ce guide explique comment utiliser le MCP Supabase pour le développement de StarSpin.

## 📋 Configuration

Les credentials Supabase sont configurés dans :
- `.env.local` - Variables d'environnement
- `.supabase-mcp.config.json` - Configuration MCP
- `lib/supabase/client.ts` - Client Supabase
- `lib/supabase/mcp-helpers.ts` - Fonctions helper

## 🔧 Fonctions Helper Disponibles

### Merchants (Marchands)

```typescript
import { merchants } from '@/lib/supabase/mcp-helpers';

// Récupérer tous les marchands
const allMerchants = await merchants.getAll();

// Récupérer un marchand par ID
const merchant = await merchants.getById('uuid');

// Créer un nouveau marchand
const newMerchant = await merchants.create({
  email: 'test@example.com',
  business_name: 'Ma Boutique',
  subscription_tier: 'starter'
});

// Mettre à jour un marchand
const updated = await merchants.update('uuid', {
  business_name: 'Nouveau Nom'
});
```

### Prizes (Prix)

```typescript
import { prizes } from '@/lib/supabase/mcp-helpers';

// Récupérer tous les prix d'un marchand
const merchantPrizes = await prizes.getByMerchant('merchant-uuid');

// Créer un nouveau prix
const newPrize = await prizes.create({
  merchant_id: 'merchant-uuid',
  name: '10% de réduction',
  probability: 25.0,
  description: 'Obtenez 10% sur votre prochain achat'
});

// Mettre à jour un prix
const updated = await prizes.update('prize-uuid', {
  probability: 30.0
});

// Supprimer un prix
await prizes.delete('prize-uuid');

// Valider que les probabilités totalisent 100%
const isValid = await prizes.validateProbabilities('merchant-uuid');
```

### Feedback (Avis)

```typescript
import { feedback } from '@/lib/supabase/mcp-helpers';

// Récupérer tous les feedbacks d'un marchand
const allFeedback = await feedback.getByMerchant('merchant-uuid');

// Récupérer uniquement les feedbacks positifs
const positiveFeedback = await feedback.getByMerchant('merchant-uuid', {
  isPositive: true
});

// Créer un nouveau feedback
const newFeedback = await feedback.create({
  merchant_id: 'merchant-uuid',
  rating: 5,
  comment: 'Excellent service!',
  is_positive: true,
  user_token: 'user-token'
});

// Obtenir les statistiques
const stats = await feedback.getStats('merchant-uuid');
// Retourne: { totalCount, positiveCount, negativeCount, avgRating, conversionRate }
```

### Spins (Tours de roue)

```typescript
import { spins } from '@/lib/supabase/mcp-helpers';

// Récupérer tous les spins d'un marchand
const merchantSpins = await spins.getByMerchant('merchant-uuid');

// Vérifier si un utilisateur a déjà tourné aujourd'hui
const hasSpun = await spins.hasSpunToday('merchant-uuid', 'user-token');

// Créer un nouveau spin
const newSpin = await spins.create({
  merchant_id: 'merchant-uuid',
  prize_id: 'prize-uuid',
  user_token: 'user-token',
  ip_hash: 'hashed-ip'
});
```

### Coupons

```typescript
import { coupons } from '@/lib/supabase/mcp-helpers';

// Récupérer un coupon par code
const coupon = await coupons.getByCode('STAR-ABC123');

// Créer un nouveau coupon
const newCoupon = await coupons.create({
  merchant_id: 'merchant-uuid',
  spin_id: 'spin-uuid',
  code: 'STAR-ABC123',
  prize_name: '10% de réduction',
  expires_at: new Date(Date.now() + 24*60*60*1000).toISOString()
});

// Marquer un coupon comme utilisé
const usedCoupon = await coupons.markAsUsed('STAR-ABC123');

// Vérifier si un coupon est valide
const isValid = await coupons.isValid('STAR-ABC123');
```

### Subscription Tiers

```typescript
import { subscriptionTiers } from '@/lib/supabase/mcp-helpers';

// Récupérer tous les tiers
const tiers = await subscriptionTiers.getAll();

// Récupérer un tier spécifique
const starter = await subscriptionTiers.getByName('starter');
```

### Utilities

```typescript
import { utils } from '@/lib/supabase/mcp-helpers';

// Générer un code de coupon unique
const code = utils.generateCouponCode('STAR'); // STAR-ABC12345

// Calculer la date d'expiration (24h par défaut)
const expiresAt = utils.getCouponExpiration(24);

// Formater une date
const formatted = utils.formatDate('2025-12-27T00:00:00Z');
```

## 🎯 Exemples d'Utilisation dans les Composants

### Exemple 1 : Dashboard Stats

```typescript
'use client';

import { useEffect, useState } from 'react';
import { feedback, spins } from '@/lib/supabase/mcp-helpers';

export default function DashboardStats({ merchantId }: { merchantId: string }) {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function loadStats() {
      const feedbackStats = await feedback.getStats(merchantId);
      const allSpins = await spins.getByMerchant(merchantId);
      
      setStats({
        ...feedbackStats,
        totalSpins: allSpins.length
      });
    }
    
    loadStats();
  }, [merchantId]);

  if (!stats) return <div>Loading...</div>;

  return (
    <div>
      <p>Total Scans: {stats.totalCount}</p>
      <p>Average Rating: {stats.avgRating}</p>
      <p>Conversion Rate: {stats.conversionRate}%</p>
      <p>Total Spins: {stats.totalSpins}</p>
    </div>
  );
}
```

### Exemple 2 : Prize Management

```typescript
'use client';

import { useState } from 'react';
import { prizes } from '@/lib/supabase/mcp-helpers';

export default function PrizeForm({ merchantId }: { merchantId: string }) {
  const [name, setName] = useState('');
  const [probability, setProbability] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await prizes.create({
      merchant_id: merchantId,
      name,
      probability,
    });

    // Vérifier que les probabilités totalisent 100%
    const isValid = await prizes.validateProbabilities(merchantId);
    if (!isValid) {
      alert('Les probabilités doivent totaliser 100%');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
        placeholder="Nom du prix"
      />
      <input 
        type="number" 
        value={probability} 
        onChange={(e) => setProbability(parseFloat(e.target.value))} 
        placeholder="Probabilité (%)"
      />
      <button type="submit">Ajouter</button>
    </form>
  );
}
```

## 🔒 Row Level Security (RLS)

Toutes les tables ont RLS activé. Les policies garantissent que :
- Les marchands ne peuvent voir que leurs propres données
- Les opérations sont limitées selon les permissions
- Les données sont isolées par marchand

## 📊 Tables Disponibles

| Table | Description | RLS |
|-------|-------------|-----|
| `merchants` | Comptes marchands | ✅ |
| `prizes` | Prix configurables | ✅ |
| `feedback` | Avis clients | ✅ |
| `spins` | Historique des tours | ✅ |
| `coupons` | Coupons générés | ✅ |
| `qr_codes` | QR codes générés | ✅ |
| `subscription_tiers` | Plans d'abonnement | ❌ |

## 🚀 Bonnes Pratiques

1. **Toujours utiliser les helpers** au lieu de requêtes directes
2. **Gérer les erreurs** avec try/catch
3. **Valider les données** avant insertion
4. **Utiliser TypeScript** pour la sécurité des types
5. **Tester les permissions RLS** pour chaque opération

## 🔧 Développement Futur

Pour ajouter de nouvelles fonctionnalités :

1. Ajoutez la fonction dans `lib/supabase/mcp-helpers.ts`
2. Documentez-la dans ce guide
3. Testez avec les policies RLS
4. Utilisez dans vos composants

## 📝 Notes

- Les UUIDs sont générés automatiquement par Supabase
- Les timestamps sont gérés par des triggers
- Les relations CASCADE suppriment automatiquement les données liées
- Les indexes optimisent les requêtes fréquentes

---

**Configuration MCP Supabase complète et prête pour le développement !** 🎉
