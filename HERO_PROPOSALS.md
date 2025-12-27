# 🎨 Propositions de Hero Section avec Roue Animée

## Proposition 1 : Roue Centrale Interactive (Recommandé)

### Design
- Roue au centre qui tourne automatiquement
- Clic pour faire tourner manuellement
- Effet de glow pulsant pendant la rotation
- Particules flottantes autour

### Code
```tsx
<section className="relative min-h-screen bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C] overflow-hidden">
  {/* Floating particles */}
  <FloatingParticles count={30} color="#ffffff" opacity={0.15} />
  
  <div className="container mx-auto px-6 pt-32 pb-20 relative z-10">
    {/* Title with gradient */}
    <div className="text-center mb-16">
      <GradientText 
        colors={['#ffffff', '#74C69D', '#ffffff']}
        className="text-8xl md:text-9xl font-black mb-4"
      >
        REVIEW<span className="text-[#FF6B6B]">WISH</span>
      </GradientText>
      <p className="text-2xl text-white/80">Transformez vos avis en récompenses</p>
    </div>

    {/* Spinning Wheel */}
    <div className="flex justify-center mb-12">
      <SpinningWheel 
        imageSrc="/roue2.png"
        size={500}
        autoSpin={true}
        spinDuration={8000}
      />
    </div>

    {/* CTA */}
    <div className="text-center">
      <ShineBorder color="#FF6B6B" borderRadius={9999}>
        <Button size="lg" className="bg-white text-[#1B4332] px-16 py-6 text-xl font-black">
          🎯 Commencer Gratuitement
        </Button>
      </ShineBorder>
    </div>
  </div>
</section>
```

---

## Proposition 2 : Split Screen avec Roue à Droite

### Design
- Texte à gauche, roue animée à droite
- Layout 50/50 sur desktop
- Roue avec effet parallax au scroll
- Stats animées sous la roue

### Code
```tsx
<section className="relative min-h-screen bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C]">
  <div className="container mx-auto px-6 pt-32">
    <div className="grid md:grid-cols-2 gap-12 items-center">
      {/* Left: Content */}
      <div>
        <Badge className="bg-[#FF6B6B] mb-6">🚀 Nouveau</Badge>
        <h1 className="text-7xl font-black text-white mb-6">
          Transformez vos clients en 
          <GradientText colors={['#74C69D', '#52B788']}>
            ambassadeurs
          </GradientText>
        </h1>
        <p className="text-xl text-white/80 mb-8">
          La première solution qui filtre les avis négatifs et récompense vos clients fidèles
        </p>
        
        {/* Animated stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center">
            <AnimatedNumber value={100} suffix="K" className="text-4xl font-black text-white" />
            <p className="text-sm text-white/60">Commerces</p>
          </div>
          <div className="text-center">
            <AnimatedNumber value={4.8} decimals={1} className="text-4xl font-black text-white" />
            <p className="text-sm text-white/60">Note moyenne</p>
          </div>
          <div className="text-center">
            <AnimatedNumber value={95} suffix="%" className="text-4xl font-black text-white" />
            <p className="text-sm text-white/60">Satisfaction</p>
          </div>
        </div>

        <Button size="lg" className="bg-[#FF6B6B] text-white px-12 py-6">
          Démarrer l'essai gratuit
        </Button>
      </div>

      {/* Right: Spinning Wheel */}
      <div className="relative">
        <SpinningWheel 
          imageSrc="/roue2.png"
          size={600}
          autoSpin={true}
        />
        
        {/* Floating badges */}
        <div className="absolute -top-8 -left-8 animate-bounce">
          <Badge className="bg-white text-[#1B4332] text-lg px-6 py-3">
            ⭐ +25% d'avis
          </Badge>
        </div>
        <div className="absolute -bottom-8 -right-8 animate-bounce" style={{ animationDelay: '0.5s' }}>
          <Badge className="bg-[#FF6B6B] text-white text-lg px-6 py-3">
            🎁 Récompenses
          </Badge>
        </div>
      </div>
    </div>
  </div>
</section>
```

---

## Proposition 3 : Roue en Arrière-Plan avec Overlay

### Design
- Roue géante en arrière-plan (blur)
- Contenu au premier plan avec glassmorphism
- Effet de profondeur 3D
- Animation continue de rotation lente

### Code
```tsx
<section className="relative min-h-screen bg-gradient-to-br from-[#1B4332] to-[#40916C] overflow-hidden">
  {/* Background wheel (blurred) */}
  <div className="absolute inset-0 flex items-center justify-center opacity-30 blur-sm">
    <SpinningWheel 
      imageSrc="/roue2.png"
      size={1200}
      autoSpin={true}
      spinDuration={20000}
    />
  </div>

  {/* Foreground content */}
  <div className="relative z-10 container mx-auto px-6 pt-32 pb-20">
    <Card className="max-w-4xl mx-auto bg-white/10 backdrop-blur-xl border-2 border-white/20 p-12">
      <div className="text-center">
        <h1 className="text-8xl font-black text-white mb-6">
          REVIEW<span className="text-[#FF6B6B]">WISH</span>
        </h1>
        
        <p className="text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
          Chaque avis positif devient une récompense instantanée pour vos clients
        </p>

        {/* Interactive wheel preview */}
        <div className="flex justify-center mb-8">
          <SpinningWheel 
            imageSrc="/roue2.png"
            size={400}
            autoSpin={false}
          />
        </div>

        <div className="flex gap-4 justify-center">
          <ShineBorder color="#FF6B6B">
            <Button size="lg" className="bg-white text-[#1B4332] px-12 py-6 text-xl font-bold">
              🎯 Essayer Gratuitement
            </Button>
          </ShineBorder>
          <Button size="lg" variant="outline" className="border-2 border-white text-white px-12 py-6 text-xl">
            📺 Voir la Démo
          </Button>
        </div>
      </div>
    </Card>
  </div>
</section>
```

---

## Proposition 4 : Bento Grid avec Roue Interactive

### Design
- Layout Bento Grid moderne
- Roue dans une grande carte centrale
- Petites cartes autour avec features
- Animations décalées

### Code
```tsx
<section className="relative min-h-screen bg-gradient-to-br from-[#1B4332] to-[#40916C] py-20">
  <div className="container mx-auto px-6">
    <div className="text-center mb-12">
      <h1 className="text-8xl font-black text-white mb-4">
        REVIEW<span className="text-[#FF6B6B]">WISH</span>
      </h1>
    </div>

    {/* Bento Grid */}
    <div className="grid grid-cols-4 grid-rows-3 gap-4 max-w-7xl mx-auto h-[800px]">
      {/* Large center: Spinning Wheel */}
      <Card className="col-span-2 row-span-2 bg-white/10 backdrop-blur-xl border-2 border-white/20 p-8 flex items-center justify-center">
        <SpinningWheel 
          imageSrc="/roue2.png"
          size={500}
          autoSpin={true}
        />
      </Card>

      {/* Top left */}
      <ShineBorder color="#74C69D" className="col-span-2">
        <Card className="h-full bg-white p-6">
          <h3 className="text-2xl font-black mb-2">🎯 Filtrage Intelligent</h3>
          <p className="text-gray-600">Les avis négatifs restent privés</p>
        </Card>
      </ShineBorder>

      {/* Right top */}
      <Card className="col-span-2 bg-[#FF6B6B] text-white p-6">
        <AnimatedNumber value={100} suffix="K+" className="text-5xl font-black mb-2" />
        <p>Commerces actifs</p>
      </Card>

      {/* Bottom left */}
      <Card className="col-span-2 bg-white p-6">
        <h3 className="text-2xl font-black mb-2">⚡ Instantané</h3>
        <p className="text-gray-600">Récompenses en temps réel</p>
      </Card>

      {/* Bottom right */}
      <ShineBorder color="#FF6B6B" className="col-span-2">
        <Card className="h-full bg-gradient-to-br from-[#52B788] to-[#2D6A4F] text-white p-6 flex flex-col justify-center">
          <Button size="lg" className="bg-white text-[#1B4332] w-full text-xl font-bold">
            Commencer →
          </Button>
        </Card>
      </ShineBorder>
    </div>
  </div>
</section>
```

---

## 🎯 Recommandation

**Proposition 1 (Roue Centrale Interactive)** est la plus adaptée car :
- ✅ Met en valeur la roue (élément principal)
- ✅ Interaction immédiate (clic pour tourner)
- ✅ Design épuré et moderne
- ✅ Compatible mobile
- ✅ Animations fluides avec React Bits

## 📦 Composants React Bits Nécessaires

Pour implémenter ces propositions, installez :

```bash
npx @react-bits/cli add animated-number
npx @react-bits/cli add gradient-text
npx @react-bits/cli add floating-particles
npx @react-bits/cli add shine-border
```

## 🎨 Personnalisation

Vous pouvez ajuster :
- `spinDuration` - Durée de rotation (ms)
- `autoSpin` - Rotation automatique on/off
- `size` - Taille de la roue (px)
- Couleurs du glow effect
- Vitesse des particules flottantes

---

**Note :** Placez votre fichier `roue2.png` dans `/public/roue2.png` pour qu'il soit accessible.
