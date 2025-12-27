# Guide d'utilisation du serveur MCP shadcn

## Configuration

Le serveur MCP shadcn est maintenant configuré dans `.windsurf/mcp.json` :

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

## Utilisation

Le serveur MCP shadcn permet d'interagir avec shadcn/ui directement depuis Windsurf pour :

### 1. Ajouter des composants

Vous pouvez maintenant ajouter des composants shadcn/ui via le MCP :
- `dialog` - Boîtes de dialogue modales
- `dropdown-menu` - Menus déroulants
- `input` - Champs de saisie
- `label` - Labels de formulaire
- `select` - Sélecteurs
- `textarea` - Zones de texte
- `toast` - Notifications toast
- `tooltip` - Info-bulles
- Et bien plus...

### 2. Composants déjà installés

✅ `button` - Boutons avec variantes  
✅ `card` - Cartes pour conteneurs  
✅ `badge` - Badges et labels

### 3. Exemples d'utilisation dans la landing page

**Button :**
```tsx
import { Button } from '@/components/ui/button';

<Button variant="outline">Get Started</Button>
<Button size="lg">START FREE TRIAL</Button>
```

**Card :**
```tsx
import { Card } from '@/components/ui/card';

<Card className="p-12 shadow-2xl">
  {/* Contenu */}
</Card>
```

**Badge :**
```tsx
import { Badge } from '@/components/ui/badge';

<Badge className="bg-[#FF6B6B]">Review Mode</Badge>
```

## Commandes utiles

### Ajouter un nouveau composant
```bash
npx shadcn@latest add [component-name]
```

### Lister les composants disponibles
```bash
npx shadcn@latest add
```

### Mettre à jour la configuration
```bash
npx shadcn@latest init
```

## Prochains composants recommandés

Pour améliorer la landing page StarSpin :

1. **`dialog`** - Pour les modales de connexion/inscription
2. **`input` + `label`** - Pour les formulaires de contact
3. **`select`** - Pour le sélecteur de langue
4. **`toast`** - Pour les notifications de succès
5. **`accordion`** - Pour la FAQ
6. **`tabs`** - Pour organiser le contenu

## Avantages du MCP shadcn

- ✅ Intégration directe dans Windsurf
- ✅ Suggestions de code intelligentes
- ✅ Documentation inline
- ✅ Mise à jour automatique des imports
- ✅ Cohérence du design system

## Ressources

- Documentation shadcn/ui : https://ui.shadcn.com
- Composants disponibles : https://ui.shadcn.com/docs/components
- GitHub : https://github.com/shadcn-ui/ui

---

**Note :** Après avoir ajouté cette configuration, redémarrez Windsurf pour que le serveur MCP soit actif.
