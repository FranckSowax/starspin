# Guide d'utilisation du serveur MCP React Bits

## Configuration

Le serveur MCP React Bits est maintenant configuré dans `.windsurf/mcp.json` :

```json
{
  "mcpServers": {
    "react-bits": {
      "command": "npx",
      "args": ["-y", "@react-bits/cli", "mcp"]
    }
  }
}
```

## Qu'est-ce que React Bits ?

React Bits est une collection de composants React animés et interactifs de haute qualité, parfaits pour créer des landing pages modernes et engageantes.

## Composants React Bits Disponibles

### 🎨 Animations & Effets

1. **Animated Number** - Compteurs animés
   - Parfait pour les statistiques (100K utilisateurs, etc.)
   - Animation fluide de 0 à la valeur cible
   
2. **Gradient Text** - Texte avec gradient animé
   - Idéal pour les titres accrocheurs
   - Gradients personnalisables
   
3. **Floating Particles** - Particules flottantes
   - Arrière-plans animés
   - Effet de profondeur
   
4. **Shine Border** - Bordures brillantes
   - Effet de lumière sur les cartes
   - Animation au survol

5. **Ripple Effect** - Effet d'ondulation
   - Boutons interactifs
   - Feedback visuel

### 📊 Composants Interactifs

6. **Marquee** - Défilement horizontal
   - Logos de partenaires
   - Témoignages défilants

7. **Bento Grid** - Grille moderne
   - Mise en page features
   - Design asymétrique

8. **Dock** - Barre de navigation macOS
   - Navigation élégante
   - Effet de zoom au survol

## Utilisation dans StarSpin

### Exemple 1 : Animated Number pour les stats

```tsx
import { AnimatedNumber } from '@react-bits/animated-number';

<AnimatedNumber 
  value={100000} 
  suffix="K"
  duration={2000}
  className="text-5xl font-black"
/>
```

### Exemple 2 : Gradient Text pour le titre

```tsx
import { GradientText } from '@react-bits/gradient-text';

<GradientText 
  colors={['#1B4332', '#2D6A4F', '#40916C']}
  className="text-8xl font-black"
>
  REVIEWWISH
</GradientText>
```

### Exemple 3 : Floating Particles pour l'arrière-plan

```tsx
import { FloatingParticles } from '@react-bits/floating-particles';

<FloatingParticles 
  count={20}
  color="#ffffff"
  opacity={0.2}
/>
```

### Exemple 4 : Shine Border pour les cartes

```tsx
import { ShineBorder } from '@react-bits/shine-border';

<ShineBorder 
  color="#FF6B6B"
  borderRadius={24}
>
  <Card>...</Card>
</ShineBorder>
```

## Installation de composants

Avec le MCP configuré, vous pouvez installer des composants React Bits :

```bash
npx @react-bits/cli add animated-number
npx @react-bits/cli add gradient-text
npx @react-bits/cli add floating-particles
npx @react-bits/cli add shine-border
```

## Intégration dans la Landing Page StarSpin

### Hero Section
- ✅ **Gradient Text** pour "REVIEWWISH"
- ✅ **Floating Particles** pour les flocons de neige
- ✅ **Shine Border** pour la carte blanche

### Stats Section
- ✅ **Animated Number** pour "100K"
- ✅ **Ripple Effect** pour les boutons CTA

### Features Section
- ✅ **Bento Grid** pour organiser les features
- ✅ **Shine Border** pour les cartes de features

## Avantages

- 🎯 **Performances optimisées** - Animations GPU
- 🎨 **Personnalisable** - Styles Tailwind CSS
- 📱 **Responsive** - Mobile-first
- ♿ **Accessible** - ARIA compliant
- 🔧 **TypeScript** - Type-safe

## Ressources

- Site officiel : https://reactbits.dev
- Documentation : https://reactbits.dev/docs
- GitHub : https://github.com/react-bits/react-bits
- Exemples : https://reactbits.dev/examples

## Compatibilité

- ✅ Next.js 14+
- ✅ React 18+
- ✅ Tailwind CSS 3+
- ✅ TypeScript 5+

---

**Note :** Après avoir ajouté cette configuration, redémarrez Windsurf pour que le serveur MCP React Bits soit actif.
