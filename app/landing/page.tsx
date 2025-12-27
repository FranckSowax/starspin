'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SpinningWheel } from '@/components/animations/SpinningWheel';

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
        {/* Snowflakes/Stars floating animation */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 text-white/20 text-2xl animate-pulse">❄️</div>
          <div className="absolute top-40 right-20 text-white/20 text-3xl animate-pulse" style={{ animationDelay: '1s' }}>❄️</div>
          <div className="absolute bottom-40 left-1/4 text-white/20 text-2xl animate-pulse" style={{ animationDelay: '2s' }}>❄️</div>
          <div className="absolute top-1/3 right-1/3 text-white/20 text-3xl animate-pulse" style={{ animationDelay: '1.5s' }}>❄️</div>
        </div>

        <div className="container mx-auto px-6 pt-32 pb-20 relative z-10">
          <div className="text-center mb-16">
            {/* Main Title */}
            <h1 className="text-8xl md:text-9xl font-black text-white mb-8 tracking-tight">
              REVIEW<span className="text-[#FF6B6B]">WISH</span>
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
                <Button size="lg" className="mt-8 bg-[#1B4332] text-white px-12 py-4 rounded-full font-bold text-lg hover:bg-[#2D6A4F] transition shadow-lg">
                  START FREE TRIAL
                </Button>
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
      <section className="py-20 px-4 bg-gradient-to-r from-[#1a3a6e] to-[#0A1F44]">
        <div className="container mx-auto text-center">
          <h2 className="text-5xl font-bold text-white mb-8" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
            😔 Pourquoi vos clients heureux se taisent ?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
            <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-3xl p-8 transform hover:scale-105 transition-transform">
              <div className="text-7xl mb-4">😞</div>
              <p className="text-white text-xl">Les clients mécontents laissent des avis négatifs</p>
            </div>
            
            <div className="bg-gradient-to-br from-gray-500 to-gray-700 rounded-3xl p-8 transform hover:scale-105 transition-transform">
              <div className="text-7xl mb-4">😐</div>
              <p className="text-white text-xl">Les clients satisfaits ne laissent rien</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#FF1B8D] to-[#FF6B35] rounded-3xl p-12 max-w-3xl mx-auto transform hover:scale-105 transition-transform">
            <div className="text-7xl mb-4">📈</div>
            <h3 className="text-4xl font-bold text-white mb-4">+1 point sur Google</h3>
            <p className="text-3xl text-white font-bold">= +5 à 9% de C.A.</p>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent"></div>
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block px-6 py-2 bg-cyan-500/20 backdrop-blur-sm rounded-full text-cyan-300 font-bold mb-4">Comment ça marche ?</span>
            <h2 className="text-6xl font-black text-white mb-4">
              🎮 Le Workflow <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500">StarSpin</span>
            </h2>
            <p className="text-xl text-cyan-200">4 étapes simples pour transformer vos clients en ambassadeurs</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Step 1 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-[#00D9FF]/90 to-[#0099CC]/90 backdrop-blur-sm rounded-3xl p-8 text-center transform hover:scale-105 hover:-translate-y-2 transition-all shadow-2xl border border-cyan-400/30">
                <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 text-4xl font-black text-[#00D9FF] shadow-lg">
                  01
                </div>
                <div className="text-7xl mb-4 group-hover:scale-110 transition-transform">📱</div>
                <h3 className="text-2xl font-black text-white mb-3">Le Scan</h3>
                <p className="text-white font-semibold">Accès instantané via QR sur table</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-[#9D4EDD]/90 to-[#7209B7]/90 backdrop-blur-sm rounded-3xl p-8 text-center transform hover:scale-105 hover:-translate-y-2 transition-all shadow-2xl border border-purple-400/30">
                <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 text-4xl font-black text-[#9D4EDD] shadow-lg">
                  02
                </div>
                <div className="text-7xl mb-4 group-hover:scale-110 transition-transform">🔀</div>
                <h3 className="text-2xl font-black text-white mb-3">Le Filtre</h3>
                <p className="text-white font-semibold">Les avis négatifs restent privés</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-red-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-[#FF1B8D]/90 to-[#C9184A]/90 backdrop-blur-sm rounded-3xl p-8 text-center transform hover:scale-105 hover:-translate-y-2 transition-all shadow-2xl border border-pink-400/30">
                <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 text-4xl font-black text-[#FF1B8D] shadow-lg">
                  03
                </div>
                <div className="text-7xl mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all">🎡</div>
                <h3 className="text-2xl font-black text-white mb-3">Le Jeu</h3>
                <p className="text-white font-semibold">Tournez la roue pour un cadeau</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-[#FFB703]/90 to-[#FB8500]/90 backdrop-blur-sm rounded-3xl p-8 text-center transform hover:scale-105 hover:-translate-y-2 transition-all shadow-2xl border border-yellow-400/30">
                <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 text-4xl font-black text-[#FFB703] shadow-lg">
                  04
                </div>
                <div className="text-7xl mb-4 group-hover:scale-110 transition-transform">⏰</div>
                <h3 className="text-2xl font-black text-white mb-3">Fidélisation</h3>
                <p className="text-white font-semibold">Le lot expire vite, retour rapide!</p>
              </div>
            </div>
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
