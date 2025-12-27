'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/atoms/Button';

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [language, setLanguage] = useState('FR');

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1F44] via-[#1a3a6e] to-[#0A1F44]">
      {/* Header */}
      <header className="fixed top-0 w-full bg-[#0A1F44]/95 backdrop-blur-sm z-50 border-b border-cyan-500/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-4xl">⭐</div>
            <span className="text-3xl font-bold text-white" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
              StarSpin
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-white hover:text-cyan-400 transition">Fonctionnalités</a>
            <a href="#pricing" className="text-white hover:text-cyan-400 transition">Tarifs</a>
            <a href="#testimonials" className="text-white hover:text-cyan-400 transition">Témoignages</a>
          </nav>

          <div className="flex items-center gap-4">
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-[#1a3a6e] text-white px-3 py-2 rounded-lg border border-cyan-500/30"
            >
              <option>FR</option>
              <option>EN</option>
              <option>ES</option>
              <option>AR</option>
            </select>
            <Button className="bg-gradient-to-r from-[#FF1B8D] to-[#FF6B35] hover:scale-105 transition-transform">
              Démarrer l'essai gratuit
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[#FF1B8D] via-[#00D9FF] to-[#FF1B8D] animate-gradient" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
            Transformez vos clients<br />en ambassadeurs 5 étoiles
          </h1>
          
          <p className="text-xl md:text-2xl text-cyan-100 mb-8 max-w-3xl mx-auto">
            La première solution qui filtre les avis négatifs, booste votre visibilité Google<br />
            et fait revenir vos clients sous 48h grâce au jeu
          </p>

          <button className="bg-gradient-to-r from-[#FF1B8D] to-[#FF6B35] text-white text-2xl font-bold py-6 px-12 rounded-full hover:scale-110 transition-transform shadow-2xl shadow-pink-500/50 mb-12">
            🎯 Créer mon QR Code maintenant
          </button>

          {/* Hero Visual */}
          <div className="relative max-w-4xl mx-auto">
            <div className="relative bg-gradient-to-br from-[#1a3a6e] to-[#0A1F44] rounded-3xl p-8 border-4 border-cyan-500/30 shadow-2xl shadow-cyan-500/20">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="relative">
                  <div className="bg-gradient-to-br from-[#FF1B8D] to-[#9D4EDD] rounded-3xl p-6 transform rotate-3 hover:rotate-0 transition-transform">
                    <div className="text-8xl mb-4">📱</div>
                    <div className="text-6xl">🎡</div>
                  </div>
                  <div className="absolute -top-4 -right-4 text-6xl animate-bounce">⭐</div>
                  <div className="absolute -bottom-4 -left-4 text-5xl animate-pulse">🎁</div>
                </div>
                
                <div className="bg-white rounded-2xl p-6 transform -rotate-3 hover:rotate-0 transition-transform">
                  <div className="text-7xl mb-4">📋</div>
                  <div className="w-32 h-32 mx-auto bg-black rounded-xl flex items-center justify-center">
                    <div className="text-white text-xs">QR CODE</div>
                  </div>
                </div>
              </div>
            </div>
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
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-5xl font-bold text-center text-white mb-16" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
            🎮 Le Workflow StarSpin
          </h2>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {/* Step 1 */}
            <div className="bg-gradient-to-br from-[#00D9FF] to-[#0099CC] rounded-3xl p-8 text-center transform hover:scale-110 transition-transform">
              <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-3xl font-bold text-[#00D9FF]">
                01
              </div>
              <div className="text-6xl mb-4">📱</div>
              <h3 className="text-2xl font-bold text-white mb-3">Le Scan</h3>
              <p className="text-white">Accès instantané via QR sur table</p>
            </div>

            {/* Step 2 */}
            <div className="bg-gradient-to-br from-[#9D4EDD] to-[#7209B7] rounded-3xl p-8 text-center transform hover:scale-110 transition-transform">
              <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-3xl font-bold text-[#9D4EDD]">
                02
              </div>
              <div className="text-6xl mb-4">🔀</div>
              <h3 className="text-2xl font-bold text-white mb-3">Le Filtre</h3>
              <p className="text-white">Les avis négatifs restent privés</p>
            </div>

            {/* Step 3 */}
            <div className="bg-gradient-to-br from-[#FF1B8D] to-[#C9184A] rounded-3xl p-8 text-center transform hover:scale-110 transition-transform">
              <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-3xl font-bold text-[#FF1B8D]">
                03
              </div>
              <div className="text-6xl mb-4">🎡</div>
              <h3 className="text-2xl font-bold text-white mb-3">Le Jeu</h3>
              <p className="text-white">Tournez la roue pour un cadeau</p>
            </div>

            {/* Step 4 */}
            <div className="bg-gradient-to-br from-[#FFB703] to-[#FB8500] rounded-3xl p-8 text-center transform hover:scale-110 transition-transform">
              <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-3xl font-bold text-[#FFB703]">
                04
              </div>
              <div className="text-6xl mb-4">⏰</div>
              <h3 className="text-2xl font-bold text-white mb-3">Fidélisation</h3>
              <p className="text-white">Le lot expire vite, retour rapide!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-[#1a3a6e] to-[#0A1F44]">
        <div className="container mx-auto">
          <h2 className="text-5xl font-bold text-center text-white mb-16" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
            🎁 Bénéfices Clés
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-[#00D9FF] to-[#0099CC] rounded-3xl p-8 text-center transform hover:scale-105 transition-transform">
              <div className="text-7xl mb-4">🌍</div>
              <h3 className="text-2xl font-bold text-white mb-3">Zone Touristique</h3>
              <p className="text-white">Multilingue automatique</p>
            </div>

            <div className="bg-gradient-to-br from-[#9D4EDD] to-[#7209B7] rounded-3xl p-8 text-center transform hover:scale-105 transition-transform">
              <div className="text-7xl mb-4">🎮</div>
              <h3 className="text-2xl font-bold text-white mb-3">Contrôle Total</h3>
              <p className="text-white">Gérez lots et probabilités</p>
            </div>

            <div className="bg-gradient-to-br from-[#FF1B8D] to-[#C9184A] rounded-3xl p-8 text-center transform hover:scale-105 transition-transform">
              <div className="text-7xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-white mb-3">Dashboard</h3>
              <p className="text-white">Stats en temps réel</p>
            </div>

            <div className="bg-gradient-to-br from-[#FFB703] to-[#FB8500] rounded-3xl p-8 text-center transform hover:scale-105 transition-transform">
              <div className="text-7xl mb-4">🛡️</div>
              <h3 className="text-2xl font-bold text-white mb-3">Protection</h3>
              <p className="text-white">Interceptez les mauvaises notes</p>
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
      <section id="pricing" className="py-20 px-4 bg-gradient-to-r from-[#1a3a6e] to-[#0A1F44]">
        <div className="container mx-auto">
          <h2 className="text-5xl font-bold text-center text-white mb-16" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
            💎 Nos Tarifs
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="bg-gradient-to-br from-[#00D9FF] to-[#0099CC] rounded-3xl p-8 transform hover:scale-105 transition-transform">
              <h3 className="text-3xl font-bold text-white mb-4">Découverte</h3>
              <div className="text-5xl font-bold text-white mb-6">0€</div>
              <ul className="text-white space-y-3 mb-8">
                <li>✅ 50 scans/mois</li>
                <li>✅ 1 établissement</li>
                <li>✅ Roue basique</li>
                <li>✅ Stats essentielles</li>
              </ul>
              <button className="w-full bg-white text-[#00D9FF] font-bold py-3 rounded-full hover:scale-105 transition-transform">
                Commencer
              </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-gradient-to-br from-[#FF1B8D] to-[#9D4EDD] rounded-3xl p-8 transform scale-110 shadow-2xl shadow-pink-500/50 border-4 border-yellow-400">
              <div className="bg-yellow-400 text-black font-bold py-2 px-4 rounded-full inline-block mb-4">
                ⭐ POPULAIRE
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">Pro</h3>
              <div className="text-5xl font-bold text-white mb-6">49€<span className="text-2xl">/mois</span></div>
              <ul className="text-white space-y-3 mb-8">
                <li>✅ Scans illimités</li>
                <li>✅ 1 établissement</li>
                <li>✅ Roue personnalisée</li>
                <li>✅ Dashboard complet</li>
                <li>✅ Support prioritaire</li>
                <li>✅ Multilingue (6 langues)</li>
              </ul>
              <button className="w-full bg-white text-[#FF1B8D] font-bold py-3 rounded-full hover:scale-105 transition-transform">
                Essayer 14 jours
              </button>
            </div>

            {/* Multi Plan */}
            <div className="bg-gradient-to-br from-[#FFB703] to-[#FB8500] rounded-3xl p-8 transform hover:scale-105 transition-transform">
              <h3 className="text-3xl font-bold text-white mb-4">Multi-établissements</h3>
              <div className="text-4xl font-bold text-white mb-6">Sur devis</div>
              <ul className="text-white space-y-3 mb-8">
                <li>✅ Tout du plan Pro</li>
                <li>✅ Plusieurs établissements</li>
                <li>✅ Dashboard centralisé</li>
                <li>✅ API personnalisée</li>
                <li>✅ Account manager dédié</li>
              </ul>
              <button className="w-full bg-white text-[#FFB703] font-bold py-3 rounded-full hover:scale-105 transition-transform">
                Nous contacter
              </button>
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
