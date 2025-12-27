# 🚀 Guide de Déploiement StarSpin sur Netlify

## ✅ Préparation Complétée

Votre landing page gamifiée est maintenant prête pour le déploiement !

### 📦 Ce qui a été fait

1. ✅ Landing page créée avec design inspiré d'Orbit
2. ✅ Style gamifié B2B avec palette vibrante
3. ✅ Animations et effets visuels
4. ✅ Configuration Netlify (`netlify.toml`)
5. ✅ Code poussé sur GitHub

## 🌐 Déploiement sur Netlify

### Option 1 : Déploiement Automatique (Recommandé)

1. **Connectez-vous à Netlify**
   - Allez sur https://app.netlify.com
   - Connectez-vous avec votre compte GitHub

2. **Importez le projet**
   - Cliquez sur "Add new site" → "Import an existing project"
   - Sélectionnez "GitHub"
   - Cherchez et sélectionnez le repo `FranckSowax/starspin`

3. **Configuration du build**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Ces valeurs sont déjà dans `netlify.toml`

4. **Variables d'environnement**
   - Ajoutez dans "Site settings" → "Environment variables":
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://egemjezgejptazoucwci.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZW1qZXpnZWpwdGF6b3Vjd2NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3ODYwNTksImV4cCI6MjA4MjM2MjA1OX0.3n7ZUhCAIC7DESmheRPUZCG7uTvd7HLRUMK0HTchj9M
     ```

5. **Déployez !**
   - Cliquez sur "Deploy site"
   - Attendez 2-3 minutes
   - Votre site sera disponible sur `https://[nom-du-site].netlify.app`

### Option 2 : Configuration du Domaine Personnalisé

Si vous voulez utiliser `starspin.netlify.app` :

1. Allez dans "Site settings" → "Domain management"
2. Cliquez sur "Options" → "Edit site name"
3. Changez en `starspin`
4. Votre site sera sur `https://starspin.netlify.app`

## 🎨 Contenu de la Landing Page

### Sections Créées

1. **Header** - Navigation avec sélecteur de langue
2. **Hero Section** - Titre accrocheur avec visuel 3D isométrique
3. **Section Problématique** - Pourquoi vos clients heureux se taisent
4. **Workflow (4 étapes)** - Le processus StarSpin
5. **Bénéfices Clés** - 4 avantages principaux
6. **Témoignage** - Preuve sociale
7. **Tarifs** - 3 plans (Découverte, Pro, Multi)
8. **FAQ** - Questions fréquentes avec accordéon
9. **Contact** - Formulaire de contact
10. **Footer** - Liens et informations légales

### Style Visuel

- ✨ Palette Orbit : Bleu roi, Cyan, Rose fuchsia, Violet, Jaune/Orange
- 🎮 Design gamifié avec emojis 3D
- 🌈 Gradients animés
- 💫 Effets hover et animations
- 📱 Responsive mobile-first

## 🧪 Test Local

Pour tester localement avant déploiement :

```bash
npm run dev
```

Puis ouvrez : http://localhost:3000/landing

## 📋 Checklist Post-Déploiement

- [ ] Vérifier que toutes les sections s'affichent correctement
- [ ] Tester la navigation et les liens
- [ ] Vérifier le responsive sur mobile
- [ ] Tester le formulaire de contact
- [ ] Vérifier les animations
- [ ] Tester le sélecteur de langue
- [ ] Vérifier les boutons CTA

## 🔗 URLs Importantes

- **Repo GitHub** : https://github.com/FranckSowax/starspin
- **Dashboard Netlify** : https://app.netlify.com
- **Landing Page (après déploiement)** : https://starspin.netlify.app

## 🎯 Prochaines Étapes

1. Déployer sur Netlify
2. Configurer le domaine personnalisé
3. Connecter le formulaire de contact (Netlify Forms)
4. Ajouter Google Analytics
5. Optimiser le SEO
6. Tester les performances avec Lighthouse

---

**Note** : La landing page redirige automatiquement depuis la racine `/` vers `/landing`.

Bon déploiement ! 🚀
