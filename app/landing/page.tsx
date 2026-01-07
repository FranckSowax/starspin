'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DemoVideoPlayer } from '@/components/landing/DemoVideoPlayer';
import { PhoneCarousel } from '@/components/ui/phone-carousel';
import { SpinningWheel } from '@/components/animations/SpinningWheel';
import { FloatingParticles } from '@/components/animations/FloatingParticles';
import { GradientText } from '@/components/animations/GradientText';
import { ShineBorder } from '@/components/animations/ShineBorder';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/config';

// Static assets
import step1 from '@/app/assets/images/step1.jpg';
import step2 from '@/app/assets/images/step2.jpg';
import step3 from '@/app/assets/images/step3.jpg';
import step4 from '@/app/assets/images/step4.jpg';

// Force rebuild: v3 (Redesign Le Defi + Arco Fonts)
export default function LandingPage() {
  const { t, ready } = useTranslation(undefined, { useSuspense: false });
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only using translations after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Use empty string during SSR, real translation after mount to prevent hydration mismatch
  const safeT = (key: string): string => {
    if (!mounted) return '';
    return t(key);
  };

  // Show loading state during initial render to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#E8EDE8] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#2D6A4F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E8EDE8]">
      {/* Header */}
      <header className="fixed top-0 w-full bg-[#1B4332]/95 backdrop-blur-sm z-50">
        <div className="container mx-auto px-4 sm:px-6 py-2 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/LOGO-STARSPIN-WHITE_web.png"
              alt="StarSpin Logo"
              className="h-12 sm:h-16 md:h-20 w-auto"
            />
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#demo" className="text-white/90 hover:text-white transition text-sm no-underline">{t('landing.nav.howItWorks')}</a>
            <a href="#pricing" className="text-white/90 hover:text-white transition text-sm no-underline">{t('landing.nav.pricing')}</a>
            <a href="#testimonials" className="text-white/90 hover:text-white transition text-sm no-underline">{t('landing.nav.testimonials')}</a>
          </nav>

          <div className="flex items-center gap-4">
            <LanguageSwitcher variant="light" />
            <Link href="/auth/signup">
              <Button className="bg-[#FFD700] text-black font-bold rounded-full hover:bg-[#FFC700] hover:shadow-lg transition-all">
                {t('landing.nav.getStarted')}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Parallax Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: 'url(/imgi_48_background.jpg)',
            backgroundAttachment: 'fixed'
          }}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0A2F23]/95 via-[#1B4332]/90 to-[#2D6A4F]/85"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-28 md:pt-32 lg:pt-36 pb-8 sm:pb-12 relative z-10">
          <div className="grid md:grid-cols-3 gap-6 sm:gap-12 items-center min-h-[calc(100vh-8rem)] sm:min-h-[calc(100vh-10rem)] md:min-h-[calc(100vh-12rem)]">
            {/* Left column - Text Content (1/3) */}
            <div className="text-left space-y-6">
              {/* Main Title */}
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white leading-tight" style={{ fontFamily: 'ARCO, sans-serif' }}>
                {t('landing.hero.title')}
                <span className="block mt-3 text-[#FFD700]">
                  {t('landing.hero.titleHighlight')}
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg md:text-xl text-white/80 leading-relaxed">
                {t('landing.hero.subtitle')}
              </p>

              {/* CTA Button */}
              <div className="pt-4">
                <Link href="/auth/signup">
                  <Button size="lg" className="bg-[#52B788] hover:bg-[#40916C] text-white px-10 py-6 text-lg font-bold rounded-full shadow-2xl">
                    {t('landing.hero.cta')}
                  </Button>
                </Link>
              </div>

              {/* Features badges */}
              <div className="flex flex-wrap gap-3 pt-4">
                <Badge className="bg-white/10 text-white border-white/20 px-4 py-2 text-sm">
                  {t('landing.hero.badge1')}
                </Badge>
                <Badge className="bg-white/10 text-white border-white/20 px-4 py-2 text-sm">
                  {t('landing.hero.badge2')}
                </Badge>
                <Badge className="bg-white/10 text-white border-white/20 px-4 py-2 text-sm">
                  {t('landing.hero.badge3')}
                </Badge>
              </div>
            </div>

            {/* Right column - DESIGNSPIN Image (2/3) */}
            <div className="md:col-span-2 flex items-center justify-center">
              <div className="relative w-full max-w-3xl">
                <img 
                  src="/DESIGNSPIN.png" 
                  alt="StarSpin Wheel" 
                  className="w-full h-auto drop-shadow-2xl animate-pulse"
                  style={{
                    filter: 'drop-shadow(0 0 80px rgba(82, 183, 136, 0.5))'
                  }}
                />
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#52B788]/20 to-transparent rounded-full blur-3xl"></div>
                
                {/* Decorative elements */}
                <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#52B788]/20 rounded-full blur-3xl"></div>
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#52B788]/10 rounded-full blur-3xl"></div>
              </div>
            </div>
          </div>

          {/* Bottom stats bar */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-12 text-white/80">
            <div className="text-center">
              <div className="text-3xl font-black text-white">100K+</div>
              <div className="text-sm">{t('landing.stats.businesses')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-white">4.9★</div>
              <div className="text-sm">{t('landing.stats.avgRating')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-white">+45%</div>
              <div className="text-sm">{t('landing.stats.positiveReviews')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-white">6</div>
              <div className="text-sm">{t('landing.stats.languages')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section id="demo" className="py-24 px-4 bg-gradient-to-br from-slate-50 to-white scroll-mt-20">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2D6A4F]/10 rounded-full mb-6">
              <div className="w-2 h-2 bg-[#2D6A4F] rounded-full"></div>
              <span className="text-sm font-semibold text-[#2D6A4F] uppercase tracking-wide">{t('landing.demo.tag')}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 max-w-3xl mx-auto leading-tight" style={{ fontFamily: 'ARCO, sans-serif' }}>
              {t('landing.demo.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('landing.demo.subtitle')}
            </p>
          </div>

          {/* Video Player */}
          <div className="max-w-5xl mx-auto">
            <DemoVideoPlayer className="aspect-video" />
          </div>

          {/* Video Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
            <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-[#2D6A4F]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[#2D6A4F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{t('landing.demo.feature1')}</h3>
              <p className="text-sm text-gray-600">{t('landing.demo.feature1Desc')}</p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-[#2D6A4F]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[#2D6A4F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{t('landing.demo.feature2')}</h3>
              <p className="text-sm text-gray-600">{t('landing.demo.feature2Desc')}</p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-[#2D6A4F]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[#2D6A4F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{t('landing.demo.feature3')}</h3>
              <p className="text-sm text-gray-600">{t('landing.demo.feature3Desc')}</p>
            </div>
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
              <span className="text-sm font-semibold text-[#2D6A4F] uppercase tracking-wide">{t('landing.challenge.tag')}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 max-w-3xl mx-auto leading-tight" style={{ fontFamily: 'ARCO, sans-serif' }}>
              {t('landing.challenge.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('landing.challenge.subtitle')}
            </p>
          </div>
          
          {/* Problem - Compact Version */}
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Negative reviews card */}
              <Card className="bg-white border border-red-100 shadow-sm hover:shadow-md transition-all p-6 rounded-2xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{t('landing.challenge.unhappy')}</h3>
                    <p className="text-red-600 text-sm font-semibold">{t('landing.challenge.unhappyPercent')}</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t('landing.challenge.unhappyDesc')}
                </p>
              </Card>

              {/* Silent satisfied card */}
              <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all p-6 rounded-2xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{t('landing.challenge.silent')}</h3>
                    <p className="text-gray-500 text-sm font-semibold">{t('landing.challenge.silentSubtitle')}</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t('landing.challenge.silentDesc')}
                </p>
              </Card>

              {/* Impact card - Compact */}
              <Card className="bg-[#2D6A4F] border-0 shadow-lg p-6 rounded-2xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{t('landing.challenge.opportunity')}</h3>
                      <p className="text-[#52B788] text-sm font-semibold text-white/90">{t('landing.challenge.opportunityPercent')}</p>
                    </div>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {t('landing.challenge.opportunityDesc')}
                  </p>
                </div>
              </Card>
            </div>
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
              <span className="text-sm font-semibold text-[#2D6A4F] uppercase tracking-wide">{t('landing.workflow.tag')}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 max-w-3xl mx-auto leading-tight" style={{ fontFamily: 'ARCO, sans-serif' }}>
              {t('landing.workflow.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('landing.workflow.subtitle')}
            </p>
          </div>

          {/* Phone Carousel with 4 steps */}
          <div className="mb-16">
            <PhoneCarousel
              images={[
                { src: step1, alt: 'Étape 1: Scan QR Code' },
                { src: step2, alt: 'Étape 2: Notez votre expérience' },
                { src: step3, alt: 'Étape 3: Tournez la roue' },
                { src: step4, alt: 'Étape 4: Recevez votre récompense' }
              ]}
            />
          </div>

          {/* Workflow steps */}
          <div className="grid md:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Step 1 */}
            <Card 
              className="group bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-[#2D6A4F] hover:shadow-xl transition-all duration-300"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-[#2D6A4F] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <Badge className="bg-[#2D6A4F]/10 text-[#2D6A4F] border-0 mb-4 font-bold">Étape 1</Badge>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{t('landing.workflow.step1')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('landing.workflow.step1Desc')}
                </p>
              </div>
            </Card>

            {/* Step 2 */}
            <Card 
              className="group bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-[#2D6A4F] hover:shadow-xl transition-all duration-300"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-[#2D6A4F] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                <Badge className="bg-[#2D6A4F]/10 text-[#2D6A4F] border-0 mb-4 font-bold">Étape 2</Badge>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{t('landing.workflow.step2')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('landing.workflow.step2Desc')}
                </p>
              </div>
            </Card>

            {/* Step 3 */}
            <Card 
              className="group bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-[#2D6A4F] hover:shadow-xl transition-all duration-300"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-[#2D6A4F] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <Badge className="bg-[#2D6A4F]/10 text-[#2D6A4F] border-0 mb-4 font-bold">Étape 3</Badge>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{t('landing.workflow.step3')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('landing.workflow.step3Desc')}
                </p>
              </div>
            </Card>

            {/* Step 4 */}
            <Card 
              className="group bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-[#2D6A4F] hover:shadow-xl transition-all duration-300"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-[#2D6A4F] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <Badge className="bg-[#2D6A4F]/10 text-[#2D6A4F] border-0 mb-4 font-bold">Étape 4</Badge>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{t('landing.workflow.step4')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('landing.workflow.step4Desc')}
                </p>
              </div>
            </Card>
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 text-center">
            <Card className="max-w-3xl mx-auto bg-gradient-to-br from-[#2D6A4F] to-[#1B4332] border-0 rounded-2xl p-10">
              <h3 className="text-3xl font-bold text-white mb-4">
                {t('landing.workflow.ctaTitle')}
              </h3>
              <p className="text-xl text-white/90 mb-8">
                {t('landing.workflow.ctaSubtitle')}
              </p>
              <Link href="/auth/signup">
                <Button size="lg" className="bg-white text-[#2D6A4F] hover:bg-gray-100 px-12 py-6 text-lg font-bold">
                  {t('landing.workflow.ctaButton')}
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          {/* Section header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2D6A4F]/10 rounded-full mb-6">
              <div className="w-2 h-2 bg-[#2D6A4F] rounded-full"></div>
              <span className="text-sm font-semibold text-[#2D6A4F] uppercase tracking-wide">{t('landing.benefits.tag')}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 max-w-3xl mx-auto leading-tight" style={{ fontFamily: 'ARCO, sans-serif' }}>
              {t('landing.benefits.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('landing.benefits.subtitle')}
            </p>
          </div>

          {/* Benefits grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Benefit 1 - Multilingual */}
            <Card className="group bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-[#2D6A4F] hover:shadow-xl transition-all duration-300">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-[#2D6A4F] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{t('landing.benefits.multilingual')}</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {t('landing.benefits.multilingualDesc')}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge className="bg-gray-100 text-gray-700 border-0 text-xs">🇬🇧 EN</Badge>
                  <Badge className="bg-gray-100 text-gray-700 border-0 text-xs">🇹🇭 TH</Badge>
                  <Badge className="bg-gray-100 text-gray-700 border-0 text-xs">🇫🇷 FR</Badge>
                  <Badge className="bg-gray-100 text-gray-700 border-0 text-xs">🇨🇳 ZH</Badge>
                  <Badge className="bg-gray-100 text-gray-700 border-0 text-xs">🇯🇵 JP</Badge>
                  <Badge className="bg-gray-100 text-gray-700 border-0 text-xs">🇩🇪 DE</Badge>
                </div>
              </div>
            </Card>

            {/* Benefit 2 - Control */}
            <Card className="group bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-[#2D6A4F] hover:shadow-xl transition-all duration-300">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-[#2D6A4F] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{t('landing.benefits.control')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('landing.benefits.controlDesc')}
                </p>
              </div>
            </Card>

            {/* Benefit 3 - Analytics */}
            <Card className="group bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-[#2D6A4F] hover:shadow-xl transition-all duration-300">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-[#2D6A4F] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{t('landing.benefits.dashboard')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('landing.benefits.dashboardDesc')}
                </p>
              </div>
            </Card>

            {/* Benefit 4 - Protection */}
            <Card className="group bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-[#2D6A4F] hover:shadow-xl transition-all duration-300">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-[#2D6A4F] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{t('landing.benefits.protection')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('landing.benefits.protectionDesc')}
                </p>
              </div>
            </Card>
          </div>

          {/* Thailand specific features */}
          <div className="mt-16 max-w-5xl mx-auto">
            <Card className="bg-gradient-to-br from-[#2D6A4F] to-[#1B4332] border-0 rounded-2xl p-10">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-4xl font-black text-white mb-2">🇹🇭</div>
                  <h4 className="text-lg font-bold text-white mb-2">{t('landing.benefits.thailand')}</h4>
                  <p className="text-white/80 text-sm">{t('landing.benefits.thailandDesc')}</p>
                </div>
                <div>
                  <div className="text-4xl font-black text-white mb-2">🏖️</div>
                  <h4 className="text-lg font-bold text-white mb-2">{t('landing.benefits.touristZones')}</h4>
                  <p className="text-white/80 text-sm">{t('landing.benefits.touristZonesDesc')}</p>
                </div>
                <div>
                  <div className="text-4xl font-black text-white mb-2">⭐</div>
                  <h4 className="text-lg font-bold text-white mb-2">{t('landing.benefits.platforms')}</h4>
                  <p className="text-white/80 text-sm">{t('landing.benefits.platformsDesc')}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section id="testimonials" className="py-24 px-4 bg-gray-50">
        <div className="container mx-auto max-w-7xl">
          {/* Section header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2D6A4F]/10 rounded-full mb-6">
              <div className="w-2 h-2 bg-[#2D6A4F] rounded-full"></div>
              <span className="text-sm font-semibold text-[#2D6A4F] uppercase tracking-wide">{t('landing.testimonials.tag')}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 max-w-3xl mx-auto leading-tight" style={{ fontFamily: 'ARCO, sans-serif' }}>
              {t('landing.testimonials.title')}
            </h2>
          </div>

          {/* Testimonials grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Testimonial 1 */}
            <Card className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-[#2D6A4F] rounded-full flex items-center justify-center text-2xl text-white font-bold">
                  MA
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Marc Alonso</h4>
                  <p className="text-sm text-gray-600">Restaurant Le Gourmet, Paris</p>
                </div>
              </div>
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed italic">
                "En 3 mois, on est passé de 3.8 à 4.6 sur Google. Nos clients adorent la roue et reviennent plus vite !"
              </p>
            </Card>

            {/* Testimonial 2 */}
            <Card className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-[#2D6A4F] rounded-full flex items-center justify-center text-2xl text-white font-bold">
                  SP
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Somchai Patel</h4>
                  <p className="text-sm text-gray-600">Spa Thai Paradise, Phuket</p>
                </div>
              </div>
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed italic">
                "Les touristes adorent ! Notre note TripAdvisor a augmenté de 0.8 point en 2 mois."
              </p>
            </Card>

            {/* Testimonial 3 */}
            <Card className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-[#2D6A4F] rounded-full flex items-center justify-center text-2xl text-white font-bold">
                  CL
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Niran Chai</h4>
                  <p className="text-sm text-gray-600">Sunrise Hotel, Koh Samui</p>
                </div>
              </div>
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed italic">
                "Parfait pour notre hôtel. Les clients internationaux adorent la roue !"
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          {/* Section header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2D6A4F]/10 rounded-full mb-6">
              <div className="w-2 h-2 bg-[#2D6A4F] rounded-full"></div>
              <span className="text-sm font-semibold text-[#2D6A4F] uppercase tracking-wide">{t('landing.pricing.tag')}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 max-w-3xl mx-auto leading-tight" style={{ fontFamily: 'ARCO, sans-serif' }}>
              {t('landing.pricing.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('landing.pricing.subtitle')}
            </p>
          </div>

          {/* Pricing cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <Card className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('landing.pricing.discovery')}</h3>
                <div className="mb-2">
                  <span className="text-5xl font-black text-gray-900">{t('landing.pricing.discoveryPrice')}</span>
                </div>
                <p className="text-gray-600">{t('landing.pricing.discoveryPeriod')}</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-[#2D6A4F] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">50 {t('landing.pricing.scansMonth')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-[#2D6A4F] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">1 {t('landing.pricing.establishment')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-[#2D6A4F] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{t('landing.pricing.basicWheel')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-[#2D6A4F] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{t('landing.pricing.essentialStats')}</span>
                </li>
              </ul>
              <Link href="/auth/signup" className="w-full">
                <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white">
                  {t('landing.pricing.startFree')}
                </Button>
              </Link>
            </Card>

            {/* Pro Plan - Featured */}
            <Card className="bg-gradient-to-br from-[#2D6A4F] to-[#1B4332] border-0 rounded-2xl p-8 shadow-2xl relative transform md:scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-[#FFB703] text-gray-900 border-0 px-4 py-1 font-bold shadow-lg">
                  {t('landing.pricing.popular')}
                </Badge>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">{t('landing.pricing.pro')}</h3>
                <div className="mb-2">
                  <span className="text-2xl font-medium text-white/60 line-through mr-2">2,000 ฿</span>
                  <span className="text-5xl font-black text-white">1,000 ฿</span>
                </div>
                <div className="inline-flex items-center gap-2 bg-[#FFB703]/20 rounded-full px-3 py-1 mb-2">
                  <span className="text-[#FFB703] font-bold text-sm">-50% PROMO</span>
                </div>
                <p className="text-white/80">{t('landing.pricing.proPeriod')}</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-[#52B788] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white font-semibold">{t('landing.pricing.unlimited')} scans</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-[#52B788] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white font-semibold">1 {t('landing.pricing.establishment')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-[#52B788] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white font-semibold">{t('landing.pricing.customWheel')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-[#52B788] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white font-semibold">{t('landing.pricing.fullDashboard')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-[#52B788] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white font-semibold">{t('landing.pricing.prioritySupport')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-[#52B788] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white font-semibold">{t('landing.pricing.multilingualSupport')}</span>
                </li>
              </ul>
              <Link href="/auth/signup" className="w-full">
                <Button className="w-full bg-white text-[#2D6A4F] hover:bg-gray-100 font-bold">
                  {t('landing.pricing.try14Days')}
                </Button>
              </Link>
            </Card>

            {/* Enterprise Plan */}
            <Card className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('landing.pricing.enterprise')}</h3>
                <div className="mb-2">
                  <span className="text-5xl font-black text-gray-900">{t('landing.pricing.enterprisePrice')}</span>
                </div>
                <p className="text-gray-600">{t('landing.pricing.enterprisePeriod')}</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-[#2D6A4F] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{t('landing.pricing.allProFeatures')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-[#2D6A4F] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{t('landing.pricing.establishments')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-[#2D6A4F] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{t('landing.pricing.centralizedDashboard')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-[#2D6A4F] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{t('landing.pricing.customApi')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-[#2D6A4F] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{t('landing.pricing.dedicatedManager')}</span>
                </li>
              </ul>
              <a href="mailto:contact@starspin.app" className="w-full block">
                <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white">
                  {t('landing.pricing.contactUs')}
                </Button>
              </a>
            </Card>
          </div>

          {/* Money back guarantee */}
          <div className="mt-16 text-center">
            <Card className="max-w-3xl mx-auto bg-gray-50 border-2 border-gray-200 rounded-2xl p-8">
              <div className="flex items-center justify-center gap-4">
                <svg className="w-12 h-12 text-[#2D6A4F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div className="text-left">
                  <h4 className="text-xl font-bold text-gray-900 mb-1">{t('landing.pricing.guarantee')}</h4>
                  <p className="text-gray-600">{t('landing.pricing.guaranteeDesc')}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="container mx-auto max-w-7xl">
          {/* Section header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2D6A4F]/10 rounded-full mb-6">
              <div className="w-2 h-2 bg-[#2D6A4F] rounded-full"></div>
              <span className="text-sm font-semibold text-[#2D6A4F] uppercase tracking-wide">FAQ</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 max-w-3xl mx-auto leading-tight" style={{ fontFamily: 'ARCO, sans-serif' }}>
              {t('landing.faq.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('landing.faq.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* FAQ Accordion */}
            <div className="space-y-4">
              {[
                {
                  q: t('landing.faq.q1'),
                  a: t('landing.faq.a1')
                },
                {
                  q: t('landing.faq.q2'),
                  a: t('landing.faq.a2')
                },
                {
                  q: t('landing.faq.q3'),
                  a: t('landing.faq.a3')
                },
                {
                  q: t('landing.faq.q4'),
                  a: t('landing.faq.a4')
                }
              ].map((faq, index) => (
                <Card key={index} className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition"
                  >
                    <span className="text-gray-900 font-bold text-lg pr-4">{faq.q}</span>
                    <div className={`w-8 h-8 rounded-full bg-[#2D6A4F]/10 flex items-center justify-center flex-shrink-0 transition-transform ${openFaq === index ? 'rotate-180' : ''}`}>
                      <svg className="w-5 h-5 text-[#2D6A4F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* Contact Card */}
            <Card className="bg-white border-2 border-gray-200 rounded-2xl p-8 h-fit">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#2D6A4F] rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{t('landing.faq.contactTitle')}</h3>
                  <p className="text-gray-600 text-sm">{t('landing.faq.contactSubtitle')}</p>
                </div>
              </div>
              <form className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder={t('landing.faq.yourName')}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-[#2D6A4F] focus:outline-none transition"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder={t('landing.faq.yourEmail')}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-[#2D6A4F] focus:outline-none transition"
                  />
                </div>
                <div>
                  <textarea
                    placeholder={t('landing.faq.yourMessage')}
                    rows={4}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-[#2D6A4F] focus:outline-none transition resize-none"
                  />
                </div>
                <Button className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white py-6 text-lg font-bold">
                  {t('landing.faq.sendMessage')}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 bg-gradient-to-br from-[#2D6A4F] to-[#1B4332] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#52B788] rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto max-w-5xl relative z-10">
          <Card className="bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-3xl p-12 md:p-16 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full mb-8">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-white uppercase tracking-wide">{t('landing.cta.tag')}</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight" style={{ fontFamily: 'ARCO, sans-serif' }}>
              {t('landing.cta.title')}
            </h2>
            
            <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto">
              {t('landing.cta.subtitle')}
            </p>
            
            <div className="flex justify-center items-center">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-white text-[#2D6A4F] hover:bg-gray-100 px-12 py-7 text-xl font-bold rounded-full shadow-2xl">
                  {t('landing.cta.tryFree')}
                </Button>
              </Link>
            </div>
            
            <div className="mt-10 flex items-center justify-center gap-8 text-white/80">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{t('landing.cta.noCommitment')}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{t('landing.cta.quickSetup')}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{t('landing.cta.support')}</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1B4332] py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            {/* Brand column */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-[#52B788] rounded-full"></div>
                <span className="text-2xl font-bold text-white">starspin</span>
              </div>
              <p className="text-white/70 mb-6 leading-relaxed">
                La solution gamifiée qui transforme vos clients satisfaits en ambassadeurs et booste votre réputation en ligne.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Product column */}
            <div>
              <h4 className="text-white font-bold mb-4">Produit</h4>
              <ul className="text-white/70 space-y-3">
                <li><a href="#features" className="hover:text-white transition">Fonctionnalités</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Tarifs</a></li>
                <li><a href="#testimonials" className="hover:text-white transition">Témoignages</a></li>
                <li><a href="#" className="hover:text-white transition">Démo</a></li>
              </ul>
            </div>

            {/* Company column */}
            <div>
              <h4 className="text-white font-bold mb-4">Entreprise</h4>
              <ul className="text-white/70 space-y-3">
                <li><a href="#" className="hover:text-white transition">À propos</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Carrières</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>

            {/* Legal column */}
            <div>
              <h4 className="text-white font-bold mb-4">Légal</h4>
              <ul className="text-white/70 space-y-3">
                <li><a href="#" className="hover:text-white transition">CGU</a></li>
                <li><a href="#" className="hover:text-white transition">Confidentialité</a></li>
                <li><a href="#" className="hover:text-white transition">Mentions légales</a></li>
                <li><a href="#" className="hover:text-white transition">Cookies</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/60 text-sm">
              © 2025 StarSpin. Tous droits réservés.
            </p>
            <div className="flex items-center gap-6 text-white/60 text-sm">
              <span>Made with ❤️ for Thai businesses</span>
              <div className="flex items-center gap-2">
                <span>🇹🇭</span>
                <span>🇫🇷</span>
                <span>🇬🇧</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
