'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SpinningWheel } from '@/components/animations/SpinningWheel';
import { FloatingParticles } from '@/components/animations/FloatingParticles';
import { GradientText } from '@/components/animations/GradientText';
import { ShineBorder } from '@/components/animations/ShineBorder';

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [language, setLanguage] = useState('FR');

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#E8EDE8]">
      {/* Header */}
      <header className="fixed top-0 w-full bg-[#1B4332]/95 backdrop-blur-sm z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FF6B6B] rounded-full"></div>
            <span className="text-2xl font-bold text-white">
              starspin
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-white/90 hover:text-white transition text-sm">How it works</a>
            <a href="#pricing" className="text-white/90 hover:text-white transition text-sm">Stories</a>
            <a href="#testimonials" className="text-white/90 hover:text-white transition text-sm">Video message</a>
          </nav>

          <div className="flex items-center gap-4">
            <Button variant="outline" className="border-2 border-white rounded-full text-white hover:bg-white hover:text-[#1B4332]">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C] overflow-hidden">
        {/* Floating particles animation */}
        <FloatingParticles 
          count={40}
          color="#ffffff"
          opacity={0.2}
          minSize={2}
          maxSize={8}
          speed={0.3}
        />

        <div className="container mx-auto px-6 pt-32 pb-20 relative z-10">
          <div className="text-center mb-16">
            {/* Main Title */}
            <h1 className="text-8xl md:text-9xl font-black mb-8 tracking-tight">
              <GradientText colors={['#ffffff', '#74C69D', '#ffffff']} animate={true}>
                REVIEW
              </GradientText>
              <span className="text-[#FF6B6B]">WISH</span>
            </h1>

            {/* Interactive elements */}
            <div className="flex items-center justify-center gap-32 mb-12">
              <div className="text-left">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                  <div className="h-px w-32 bg-white/30"></div>
                </div>
                <p className="text-white/80 text-sm">Write a review</p>
                <p className="text-white/60 text-xs">Get a reward</p>
              </div>

              {/* Center 3D Element - Spinning Wheel */}
              <div className="relative">
                <SpinningWheel 
                  imageSrc="/spin-2.png"
                  size={450}
                  autoSpin={true}
                  spinDuration={8000}
                />
              </div>

              <div className="text-right">
                <div className="flex items-center gap-3 mb-2 justify-end">
                  <div className="h-px w-32 bg-white/30"></div>
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
                <p className="text-white/80 text-sm">Make a wish</p>
                <p className="text-white/60 text-xs">Get instant rewards</p>
              </div>
            </div>
          </div>

          {/* Bottom CTA Section */}
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white rounded-3xl p-12 shadow-2xl relative border-0">
              {/* Toggle button */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                <Badge className="bg-[#FF6B6B] text-white px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg hover:bg-[#FF5252] transition">
                  Review Mode
                  <div className="w-12 h-6 bg-white/30 rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </Badge>
              </div>

              <div className="text-center pt-8">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Get a personalized<br />
                  reward for reviews and<br />
                  boost your reputation
                </h2>
                <ShineBorder color="#FF6B6B" borderRadius={9999} borderWidth={3} duration={2}>
                  <Button size="lg" className="mt-8 bg-[#1B4332] text-white px-12 py-4 rounded-full font-bold text-lg hover:bg-[#2D6A4F] transition shadow-lg">
                    START FREE TRIAL
                  </Button>
                </ShineBorder>
              </div>

              {/* Decorative envelope */}
              <div className="absolute -left-12 bottom-12">
                <div className="relative">
                  <div className="text-8xl">📧</div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <p className="text-xs font-bold text-[#FF6B6B] whitespace-nowrap">WRITE TO</p>
                    <p className="text-xs font-bold text-[#1B4332]">STARSPIN</p>
                  </div>
                </div>
              </div>

              {/* Stats card */}
              <Card className="absolute -right-12 bottom-12 bg-[#2D6A4F] text-white rounded-2xl p-6 shadow-xl border-0">
                <div className="text-5xl font-black mb-2">100K</div>
                <p className="text-sm opacity-80">Businesses received</p>
                <p className="text-sm opacity-80">positive reviews</p>
                <div className="flex gap-2 mt-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">👨‍🍳</div>
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">👩‍💼</div>
                </div>
              </Card>
            </Card>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="relative py-24 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          {/* Section header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2D6A4F]/10 rounded-full mb-6">
              <div className="w-2 h-2 bg-[#2D6A4F] rounded-full"></div>
              <span className="text-sm font-semibold text-[#2D6A4F] uppercase tracking-wide">Le Défi</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 max-w-3xl mx-auto leading-tight">
              Pourquoi vos clients satisfaits ne laissent pas d'avis ?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Le paradoxe de la satisfaction client dans la restauration
            </p>
          </div>
          
          {/* Problem cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
            {/* Negative reviews card */}
            <Card className="bg-white border-2 border-red-100 rounded-2xl p-8 hover:shadow-xl transition-shadow">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Clients Mécontents</h3>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 rounded-full mb-4">
                    <span className="text-sm font-bold text-red-600">80% d'activité</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                Les clients insatisfaits sont 3 fois plus susceptibles de laisser un avis public négatif, impactant directement votre réputation en ligne.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600">Avis publics négatifs</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600">Impact sur la note Google</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600">Perte de visibilité</span>
                </div>
              </div>
            </Card>
            
            {/* Silent satisfied card */}
            <Card className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-shadow">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Clients Satisfaits</h3>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full mb-4">
                    <span className="text-sm font-bold text-gray-600">20% d'activité</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                La majorité de vos clients satisfaits ne prennent pas le temps de laisser un avis positif, laissant votre note stagner ou baisser.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  <span className="text-gray-600">Aucun avis laissé</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  <span className="text-gray-600">Note qui stagne</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  <span className="text-gray-600">Potentiel inexploité</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Impact card */}
          <div className="max-w-5xl mx-auto">
            <Card className="bg-gradient-to-br from-[#2D6A4F] to-[#1B4332] border-0 rounded-2xl p-12 shadow-2xl">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                    <span className="text-sm font-semibold text-white uppercase tracking-wide">Impact Prouvé</span>
                  </div>
                  <h3 className="text-4xl font-bold text-white mb-4">
                    +1 point sur Google
                  </h3>
                  <p className="text-xl text-white/90 mb-8">
                    Augmente votre chiffre d'affaires de 5 à 9%
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-[#52B788] rounded-full"></div>
                      <span className="text-white/90">Meilleure visibilité locale</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-[#52B788] rounded-full"></div>
                      <span className="text-white/90">Plus de réservations</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-[#52B788] rounded-full"></div>
                      <span className="text-white/90">Confiance renforcée</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
                  <div className="text-center mb-6">
                    <div className="text-7xl font-black text-white mb-2">+5-9%</div>
                    <div className="text-lg text-white/80 font-semibold">Chiffre d'Affaires</div>
                  </div>
                  <div className="h-px bg-white/20 mb-6"></div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Note actuelle</span>
                      <span className="text-white font-bold">4.2 ⭐</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Note cible</span>
                      <span className="text-[#52B788] font-bold">4.5+ ⭐</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Impact CA</span>
                      <span className="text-[#52B788] font-bold">+7% moyen</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="container mx-auto max-w-7xl">
          {/* Section header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2D6A4F]/10 rounded-full mb-6">
              <div className="w-2 h-2 bg-[#2D6A4F] rounded-full"></div>
              <span className="text-sm font-semibold text-[#2D6A4F] uppercase tracking-wide">Comment ça marche</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 max-w-3xl mx-auto leading-tight">
              Le Workflow StarSpin
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              4 étapes simples pour transformer vos clients en ambassadeurs
            </p>
          </div>

          {/* Workflow steps */}
          <div className="grid md:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Step 1 */}
            <Card className="group bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-[#2D6A4F] hover:shadow-xl transition-all duration-300">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-[#2D6A4F] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <Badge className="bg-[#2D6A4F]/10 text-[#2D6A4F] border-0 mb-4 font-bold">Étape 1</Badge>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Scan QR Code</h3>
                <p className="text-gray-600 leading-relaxed">
                  Le client scanne le QR code sur sa table pour accéder instantanément à l'expérience
                </p>
              </div>
            </Card>

            {/* Step 2 */}
            <Card className="group bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-[#2D6A4F] hover:shadow-xl transition-all duration-300">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-[#2D6A4F] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                <Badge className="bg-[#2D6A4F]/10 text-[#2D6A4F] border-0 mb-4 font-bold">Étape 2</Badge>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Filtrage Intelligent</h3>
                <p className="text-gray-600 leading-relaxed">
                  Les avis négatifs sont capturés en privé pour amélioration interne
                </p>
              </div>
            </Card>

            {/* Step 3 */}
            <Card className="group bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-[#2D6A4F] hover:shadow-xl transition-all duration-300">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-[#2D6A4F] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <Badge className="bg-[#2D6A4F]/10 text-[#2D6A4F] border-0 mb-4 font-bold">Étape 3</Badge>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Roue de Récompense</h3>
                <p className="text-gray-600 leading-relaxed">
                  Les clients satisfaits tournent la roue pour gagner un cadeau instantané
                </p>
              </div>
            </Card>

            {/* Step 4 */}
            <Card className="group bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-[#2D6A4F] hover:shadow-xl transition-all duration-300">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-[#2D6A4F] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <Badge className="bg-[#2D6A4F]/10 text-[#2D6A4F] border-0 mb-4 font-bold">Étape 4</Badge>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Fidélisation</h3>
                <p className="text-gray-600 leading-relaxed">
                  Le cadeau expire rapidement, incitant le client à revenir vite
                </p>
              </div>
            </Card>
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 text-center">
            <Card className="max-w-3xl mx-auto bg-gradient-to-br from-[#2D6A4F] to-[#1B4332] border-0 rounded-2xl p-10">
              <h3 className="text-3xl font-bold text-white mb-4">
                Prêt à booster votre réputation ?
              </h3>
              <p className="text-xl text-white/90 mb-8">
                Rejoignez les 100K+ restaurants qui utilisent StarSpin
              </p>
              <Button size="lg" className="bg-white text-[#2D6A4F] hover:bg-gray-100 px-12 py-6 text-lg font-bold">
                Démarrer l'essai gratuit
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-[#1a3a6e] to-[#0A1F44] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block px-6 py-2 bg-pink-500/20 backdrop-blur-sm rounded-full text-pink-300 font-bold mb-4">Pourquoi StarSpin ?</span>
            <h2 className="text-6xl font-black text-white mb-4">
              🎁 <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-yellow-400">Bénéfices</span> Clés
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-[#00D9FF]/20 to-[#0099CC]/20 backdrop-blur-xl rounded-3xl p-8 text-center transform hover:scale-105 hover:-translate-y-2 transition-all border-2 border-cyan-400/30 shadow-2xl">
                <div className="text-8xl mb-4 group-hover:scale-125 transition-transform">🌍</div>
                <h3 className="text-2xl font-black text-white mb-3">Zone Touristique</h3>
                <p className="text-cyan-100 font-semibold">Multilingue automatique en 6 langues</p>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-[#9D4EDD]/20 to-[#7209B7]/20 backdrop-blur-xl rounded-3xl p-8 text-center transform hover:scale-105 hover:-translate-y-2 transition-all border-2 border-purple-400/30 shadow-2xl">
                <div className="text-8xl mb-4 group-hover:scale-125 transition-transform">🎮</div>
                <h3 className="text-2xl font-black text-white mb-3">Contrôle Total</h3>
                <p className="text-purple-100 font-semibold">Gérez lots et probabilités à volonté</p>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-red-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-[#FF1B8D]/20 to-[#C9184A]/20 backdrop-blur-xl rounded-3xl p-8 text-center transform hover:scale-105 hover:-translate-y-2 transition-all border-2 border-pink-400/30 shadow-2xl">
                <div className="text-8xl mb-4 group-hover:scale-125 transition-transform">📊</div>
                <h3 className="text-2xl font-black text-white mb-3">Dashboard Pro</h3>
                <p className="text-pink-100 font-semibold">Stats et analytics en temps réel</p>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-[#FFB703]/20 to-[#FB8500]/20 backdrop-blur-xl rounded-3xl p-8 text-center transform hover:scale-105 hover:-translate-y-2 transition-all border-2 border-yellow-400/30 shadow-2xl">
                <div className="text-8xl mb-4 group-hover:scale-125 transition-transform">🛡️</div>
                <h3 className="text-2xl font-black text-white mb-3">Protection</h3>
                <p className="text-yellow-100 font-semibold">Filtrez les avis négatifs</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section id="testimonials" className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-to-br from-[#FF1B8D] to-[#9D4EDD] rounded-3xl p-12 text-center transform hover:scale-105 transition-transform">
            <div className="text-8xl mb-6">👨‍🍳</div>
            <p className="text-2xl text-white mb-6 italic">
              "En 3 mois, on est passé de 3.8 à 4.6 sur Google. Nos clients adorent la roue et reviennent plus vite pour utiliser leur coupon !"
            </p>
            <p className="text-xl text-white font-bold">— Marc A., Restaurant Le Gourmet</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-gradient-to-r from-[#1a3a6e] to-[#0A1F44] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-0 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block px-6 py-2 bg-yellow-500/20 backdrop-blur-sm rounded-full text-yellow-300 font-bold mb-4">Tarification simple</span>
            <h2 className="text-6xl font-black text-white mb-4">
              💎 <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-400">Nos Tarifs</span>
            </h2>
            <p className="text-xl text-cyan-200">Choisissez le plan qui correspond à vos besoins</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Free Plan */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-[#00D9FF]/20 to-[#0099CC]/20 backdrop-blur-xl rounded-3xl p-8 transform hover:scale-105 hover:-translate-y-2 transition-all border-2 border-cyan-400/30 shadow-2xl">
                <div className="text-center">
                  <h3 className="text-3xl font-black text-white mb-4">Découverte</h3>
                  <div className="text-6xl font-black text-white mb-2">0€</div>
                  <p className="text-cyan-200 font-semibold mb-6">Pour tester</p>
                </div>
                <ul className="text-white space-y-3 mb-8">
                  <li className="flex items-center gap-2"><span className="text-2xl">✅</span> <span className="font-semibold">50 scans/mois</span></li>
                  <li className="flex items-center gap-2"><span className="text-2xl">✅</span> <span className="font-semibold">1 établissement</span></li>
                  <li className="flex items-center gap-2"><span className="text-2xl">✅</span> <span className="font-semibold">Roue basique</span></li>
                  <li className="flex items-center gap-2"><span className="text-2xl">✅</span> <span className="font-semibold">Stats essentielles</span></li>
                </ul>
                <button className="w-full bg-white text-[#00D9FF] font-black py-4 rounded-full hover:scale-105 transition-all shadow-lg text-lg">
                  Commencer Gratuitement
                </button>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="group relative md:scale-110">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl blur-2xl opacity-75 group-hover:opacity-100 transition-opacity animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-[#FF1B8D]/30 to-[#9D4EDD]/30 backdrop-blur-xl rounded-3xl p-8 transform hover:scale-105 hover:-translate-y-2 transition-all border-4 border-yellow-400 shadow-2xl">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black py-2 px-6 rounded-full shadow-lg text-sm">
                    ⭐ POPULAIRE ⭐
                  </div>
                </div>
                <div className="text-center mt-4">
                  <h3 className="text-4xl font-black text-white mb-4">Pro</h3>
                  <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-400 mb-2">49€</div>
                  <p className="text-pink-200 font-bold mb-6">/mois</p>
                </div>
                <ul className="text-white space-y-3 mb-8">
                  <li className="flex items-center gap-2"><span className="text-2xl">✅</span> <span className="font-bold">Scans illimités</span></li>
                  <li className="flex items-center gap-2"><span className="text-2xl">✅</span> <span className="font-bold">1 établissement</span></li>
                  <li className="flex items-center gap-2"><span className="text-2xl">✅</span> <span className="font-bold">Roue personnalisée</span></li>
                  <li className="flex items-center gap-2"><span className="text-2xl">✅</span> <span className="font-bold">Dashboard complet</span></li>
                  <li className="flex items-center gap-2"><span className="text-2xl">✅</span> <span className="font-bold">Support prioritaire</span></li>
                  <li className="flex items-center gap-2"><span className="text-2xl">✅</span> <span className="font-bold">Multilingue (6 langues)</span></li>
                </ul>
                <button className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black py-4 rounded-full hover:scale-105 transition-all shadow-2xl text-lg">
                  🚀 Essayer 14 jours
                </button>
              </div>
            </div>

            {/* Multi Plan */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-[#FFB703]/20 to-[#FB8500]/20 backdrop-blur-xl rounded-3xl p-8 transform hover:scale-105 hover:-translate-y-2 transition-all border-2 border-yellow-400/30 shadow-2xl">
                <div className="text-center">
                  <h3 className="text-3xl font-black text-white mb-4">Multi-établissements</h3>
                  <div className="text-5xl font-black text-white mb-2">Sur devis</div>
                  <p className="text-yellow-200 font-semibold mb-6">Pour les chaînes</p>
                </div>
                <ul className="text-white space-y-3 mb-8">
                  <li className="flex items-center gap-2"><span className="text-2xl">✅</span> <span className="font-semibold">Tout du plan Pro</span></li>
                  <li className="flex items-center gap-2"><span className="text-2xl">✅</span> <span className="font-semibold">Plusieurs établissements</span></li>
                  <li className="flex items-center gap-2"><span className="text-2xl">✅</span> <span className="font-semibold">Dashboard centralisé</span></li>
                  <li className="flex items-center gap-2"><span className="text-2xl">✅</span> <span className="font-semibold">API personnalisée</span></li>
                  <li className="flex items-center gap-2"><span className="text-2xl">✅</span> <span className="font-semibold">Account manager dédié</span></li>
                </ul>
                <button className="w-full bg-white text-[#FFB703] font-black py-4 rounded-full hover:scale-105 transition-all shadow-lg text-lg">
                  💼 Nous Contacter
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8">
            {/* FAQ */}
            <div>
              <h2 className="text-4xl font-bold text-white mb-8" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                ❓ Questions Fréquentes
              </h2>
              
              <div className="space-y-4">
                {[
                  {
                    q: "Comment ça marche concrètement ?",
                    a: "Vous imprimez un QR code, le client le scanne, note son expérience. Si c'est positif (4-5★), il accède à la roue pour gagner un cadeau instantané."
                  },
                  {
                    q: "Que deviennent les avis négatifs ?",
                    a: "Ils arrivent dans votre dashboard privé. Vous pouvez les traiter en interne sans qu'ils n'affectent votre réputation publique."
                  },
                  {
                    q: "C'est compatible avec mon système de caisse ?",
                    a: "StarSpin fonctionne de manière autonome via QR code. Aucune intégration technique nécessaire."
                  },
                  {
                    q: "Combien coûtent les cadeaux ?",
                    a: "Vous décidez ! Café offert, -10%, dessert gratuit... Vous contrôlez les lots et leur valeur."
                  }
                ].map((faq, index) => (
                  <div key={index} className="bg-[#1a3a6e] rounded-2xl overflow-hidden border border-cyan-500/30">
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full p-6 text-left flex items-center justify-between hover:bg-[#0A1F44] transition"
                    >
                      <span className="text-white font-bold text-lg">{faq.q}</span>
                      <span className="text-cyan-400 text-2xl">{openFaq === index ? '−' : '+'}</span>
                    </button>
                    {openFaq === index && (
                      <div className="px-6 pb-6 text-cyan-100">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-3xl p-8">
              <h3 className="text-3xl font-bold text-[#0A1F44] mb-6">📧 Contactez-nous</h3>
              <form className="space-y-4">
                <input
                  type="text"
                  placeholder="Votre nom"
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-cyan-500 focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Votre email"
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-cyan-500 focus:outline-none"
                />
                <textarea
                  placeholder="Votre message"
                  rows={4}
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-cyan-500 focus:outline-none"
                />
                <button className="w-full bg-gradient-to-r from-[#FF1B8D] to-[#FF6B35] text-white font-bold py-4 rounded-xl hover:scale-105 transition-transform">
                  Envoyer
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-[#FF1B8D] to-[#9D4EDD]">
        <div className="container mx-auto text-center">
          <h2 className="text-5xl font-bold text-white mb-8" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
            ✨ Prêt à faire briller votre établissement ?
          </h2>
          <button className="bg-white text-[#FF1B8D] text-3xl font-bold py-6 px-16 rounded-full hover:scale-110 transition-transform shadow-2xl">
            Essayer gratuitement
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A1F44] py-12 px-4 border-t border-cyan-500/20">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold text-xl mb-4">StarSpin</h4>
              <p className="text-cyan-100">La gamification au service de votre e-réputation</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Produit</h4>
              <ul className="text-cyan-100 space-y-2">
                <li><a href="#" className="hover:text-cyan-400">Fonctionnalités</a></li>
                <li><a href="#" className="hover:text-cyan-400">Tarifs</a></li>
                <li><a href="#" className="hover:text-cyan-400">Démo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Entreprise</h4>
              <ul className="text-cyan-100 space-y-2">
                <li><a href="#" className="hover:text-cyan-400">À propos</a></li>
                <li><a href="#" className="hover:text-cyan-400">Blog</a></li>
                <li><a href="#" className="hover:text-cyan-400">Carrières</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Légal</h4>
              <ul className="text-cyan-100 space-y-2">
                <li><a href="#" className="hover:text-cyan-400">CGU</a></li>
                <li><a href="#" className="hover:text-cyan-400">Confidentialité</a></li>
                <li><a href="#" className="hover:text-cyan-400">Mentions légales</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-cyan-500/20 pt-8 text-center text-cyan-100">
            <p>© 2025 StarSpin. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
