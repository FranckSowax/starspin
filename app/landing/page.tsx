'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DemoVideoPlayer } from '@/components/landing/DemoVideoPlayer';
import { PhoneCarousel } from '@/components/ui/phone-carousel';
import { SpinningWheel } from '@/components/animations/SpinningWheel';
import { FloatingParticles } from '@/components/animations/FloatingParticles';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/config';

// Static assets
import step1 from '@/app/assets/images/step1.jpg';
import step2 from '@/app/assets/images/step2.jpg';
import step3 from '@/app/assets/images/step3.jpg';
import step4 from '@/app/assets/images/step4.jpg';

// Modern landing page with enhanced animations and design
export default function LandingPage() {
  const { t, ready } = useTranslation(undefined, { useSuspense: false });
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll progress indicator
  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setScrollProgress(scrolled);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mouse position for parallax effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('scroll-visible');
            // Stop observing once visible to prevent flickering
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px 0px 0px' }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const safeT = (key: string): string => {
    if (!mounted) return '';
    return t(key);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E8EDE8] to-[#D4E5D4] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#2D6A4F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8EDE8] to-[#D4E5D4] overflow-x-hidden">
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 h-1 bg-gradient-to-r from-[#52B788] via-[#FFD700] to-[#52B788] z-[100] transition-all duration-300" style={{ width: `${scrollProgress}%` }} />

      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 transition-all duration-500 backdrop-blur-xl bg-white/70 border-b border-white/20">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-[#2D6A4F] to-[#52B788] rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="font-bold text-xl text-[#1B4332] tracking-tight">StarSpin</span>
          </div>

          <nav className="hidden lg:flex items-center gap-8">
            {['howItWorks', 'pricing', 'testimonials'].map((item) => (
              <a
                key={item}
                href={`#${item}`}
                className="text-[#2D6A4F]/80 hover:text-[#2D6A4F] font-medium transition-all duration-300 hover:scale-105 relative group"
              >
                {t(`landing.nav.${item}`)}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#52B788] to-[#FFD700] group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="light" />
            <Link href="/auth/signup">
              <Button className="bg-gradient-to-r from-[#2D6A4F] to-[#52B788] text-white font-semibold px-6 py-2.5 rounded-full hover:shadow-lg hover:shadow-[#52B788]/30 hover:scale-105 transition-all duration-300">
                {t('landing.nav.getStarted')}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Modern Design */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient Orbs */}
          <div className="absolute top-20 left-10 w-96 h-96 bg-[#52B788]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0s' }} />
          <div className="absolute top-40 right-20 w-80 h-80 bg-[#FFD700]/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-[#2D6A4F]/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

          {/* Floating Particles */}
          <FloatingParticles />

          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(45, 106, 79, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(45, 106, 79, 0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left Content */}
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-[#2D6A4F]/10">
                <div className="w-2 h-2 bg-[#52B788] rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-[#2D6A4F]">{t('landing.demo.tag')}</span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-[#1B4332] leading-[1.1] tracking-tight">
                {t('landing.hero.title')}
                <br />
                <span className="bg-gradient-to-r from-[#52B788] via-[#FFD700] to-[#52B788] bg-clip-text text-transparent animate-gradient-text">
                  {t('landing.hero.titleHighlight')}
                </span>
              </h1>

              <p className="text-xl text-[#2D6A4F]/80 leading-relaxed max-w-xl">
                {t('landing.hero.subtitle')}
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/auth/signup">
                  <Button size="lg" className="bg-gradient-to-r from-[#2D6A4F] to-[#52B788] text-white px-8 py-4 text-lg font-bold rounded-2xl hover:shadow-2xl hover:shadow-[#52B788]/40 hover:-translate-y-1 transition-all duration-300">
                    {t('landing.hero.cta')}
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-2 border-[#2D6A4F]/20 text-[#2D6A4F] px-8 py-4 text-lg font-semibold rounded-2xl hover:bg-[#2D6A4F]/5 hover:-translate-y-1 transition-all duration-300">
                  {t('landing.demo.title')}
                </Button>
              </div>

              <div className="flex flex-wrap gap-3 pt-4">
                {[t('landing.hero.badge1'), t('landing.hero.badge2'), t('landing.hero.badge3')].map((badge, i) => (
                  <Badge key={i} className="bg-white/60 backdrop-blur-sm text-[#2D6A4F] border-[#2D6A4F]/10 px-4 py-2 text-sm font-medium">
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Right Content - Wheel */}
            <div className="relative flex items-center justify-center">
              {/* Animated Glow */}
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  transform: `translateX(${-mousePosition.x}px) translateY(${-mousePosition.y}px)`
                }}
              >
                <div className="w-[90%] h-[90%] rounded-full bg-gradient-to-r from-[#52B788]/30 via-[#FFD700]/20 to-[#52B788]/30 blur-3xl animate-pulse" />
              </div>

              {/* Main Wheel */}
              <div
                className="relative z-10 animate-float hover:scale-105 transition-transform duration-500 cursor-pointer"
                style={{
                  transform: `translateX(${mousePosition.x * 0.5}px) translateY(${mousePosition.y * 0.5}px)`
                }}
              >
                <img
                  src="/DESIGNSPIN.png"
                  alt="StarSpin Wheel"
                  className="w-full max-w-lg h-auto drop-shadow-2xl"
                />
              </div>

              {/* Floating Icons */}
              {[
                { icon: '⭐', pos: 'top-[10%] left-[10%]', delay: '0s' },
                { icon: '🎯', pos: 'top-[20%] right-[15%]', delay: '0.5s' },
                { icon: '🎁', pos: 'bottom-[25%] left-[15%]', delay: '1s' },
                { icon: '💫', pos: 'bottom-[15%] right-[10%]', delay: '1.5s' },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`absolute text-4xl animate-float ${item.pos}`}
                  style={{ animationDelay: item.delay }}
                >
                  {item.icon}
                </div>
              ))}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '100K+', label: t('landing.stats.businesses') },
              { value: '4.9★', label: t('landing.stats.avgRating') },
              { value: '+45%', label: t('landing.stats.positiveReviews') },
              { value: '6', label: t('landing.stats.languages') },
            ].map((stat, i) => (
              <div key={i} className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/50 hover:bg-white/80 transition-all duration-300 hover:-translate-y-1">
                <div className="text-4xl font-black bg-gradient-to-r from-[#2D6A4F] to-[#52B788] bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-[#2D6A4F]/70 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section id="demo" className="py-32 px-4 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#52B788]/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#FFD700]/5 to-transparent rounded-full blur-3xl" />

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16 scroll-hidden" ref={(el) => { if (el) sectionRefs.current[0] = el; }}>
            <Badge className="bg-[#2D6A4F]/10 text-[#2D6A4F] border-0 px-4 py-2 mb-6">
              {t('landing.demo.tag')}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black text-[#1B4332] mb-6 max-w-3xl mx-auto">
              {t('landing.demo.title')}
            </h2>
            <p className="text-xl text-[#2D6A4F]/70 max-w-2xl mx-auto">
              {t('landing.demo.subtitle')}
            </p>
          </div>

          <div className="scroll-hidden" ref={(el) => { if (el) sectionRefs.current[1] = el; }}>
            <DemoVideoPlayer className="aspect-video rounded-3xl shadow-2xl shadow-[#2D6A4F]/10 border border-[#2D6A4F]/10" />
          </div>
        </div>
      </section>

      {/* Problem Section - Modern Cards */}
      <section className="py-32 px-4 bg-gradient-to-b from-white to-[#F8FAF8]">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-20 scroll-hidden" ref={(el) => { if (el) sectionRefs.current[2] = el; }}>
            <Badge className="bg-red-50 text-red-600 border-0 px-4 py-2 mb-6">
              {t('landing.challenge.tag')}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black text-[#1B4332] mb-6 max-w-3xl mx-auto">
              {t('landing.challenge.title')}
            </h2>
            <p className="text-xl text-[#2D6A4F]/70 max-w-2xl mx-auto">
              {t('landing.challenge.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                emoji: '😠',
                title: t('landing.challenge.unhappy'),
                subtitle: t('landing.challenge.unhappyPercent'),
                desc: t('landing.challenge.unhappyDesc'),
                color: 'red',
                bg: 'bg-red-50'
              },
              {
                emoji: '🤐',
                title: t('landing.challenge.silent'),
                subtitle: t('landing.challenge.silentSubtitle'),
                desc: t('landing.challenge.silentDesc'),
                color: 'gray',
                bg: 'bg-gray-50'
              },
              {
                emoji: '🚀',
                title: t('landing.challenge.opportunity'),
                subtitle: t('landing.challenge.opportunityPercent'),
                desc: t('landing.challenge.opportunityDesc'),
                color: 'green',
                bg: 'bg-gradient-to-br from-[#2D6A4F] to-[#52B788]'
              }
            ].map((item, i) => (
              <Card
                key={i}
                className={`p-8 rounded-3xl border-0 scroll-hidden ${item.bg}`}
                ref={(el) => { if (el) sectionRefs.current[3 + i] = el; }}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className={`text-6xl mb-6 ${item.color === 'green' ? 'text-5xl' : ''}`}>{item.emoji}</div>
                <h3 className={`text-2xl font-bold mb-2 ${item.color === 'green' ? 'text-white' : 'text-[#1B4332]'}`}>
                  {item.title}
                </h3>
                <div className={`text-lg font-semibold mb-4 ${item.color === 'green' ? 'text-[#FFD700]' : item.color === 'red' ? 'text-red-600' : 'text-gray-500'}`}>
                  {item.subtitle}
                </div>
                <p className={`leading-relaxed ${item.color === 'green' ? 'text-white/90' : 'text-[#2D6A4F]/70'}`}>
                  {item.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section - Modern Timeline */}
      <section className="py-32 px-4 bg-[#F8FAF8]">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20 scroll-hidden" ref={(el) => { if (el) sectionRefs.current[6] = el; }}>
            <Badge className="bg-[#2D6A4F]/10 text-[#2D6A4F] border-0 px-4 py-2 mb-6">
              {t('landing.workflow.tag')}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black text-[#1B4332] mb-6 max-w-3xl mx-auto">
              {t('landing.workflow.title')}
            </h2>
            <p className="text-xl text-[#2D6A4F]/70 max-w-2xl mx-auto">
              {t('landing.workflow.subtitle')}
            </p>
          </div>

          {/* Phone Carousel */}
          <div className="mb-16 scroll-hidden" ref={(el) => { if (el) sectionRefs.current[7] = el; }}>
            <PhoneCarousel
              images={[
                { src: step1, alt: 'Étape 1: Scan QR Code' },
                { src: step2, alt: 'Étape 2: Notez votre expérience' },
                { src: step3, alt: 'Étape 3: Tournez la roue' },
                { src: step4, alt: 'Étape 4: Recevez votre récompense' }
              ]}
            />
          </div>

          {/* Workflow Steps */}
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: 1, icon: '📱', title: t('landing.workflow.step1'), desc: t('landing.workflow.step1Desc') },
              { step: 2, icon: '🔍', title: t('landing.workflow.step2'), desc: t('landing.workflow.step2Desc') },
              { step: 3, icon: '🎡', title: t('landing.workflow.step3'), desc: t('landing.workflow.step3Desc') },
              { step: 4, icon: '🎁', title: t('landing.workflow.step4'), desc: t('landing.workflow.step4Desc') },
            ].map((item, i) => (
              <div
                key={i}
                className="relative group scroll-hidden"
                ref={(el) => { if (el) sectionRefs.current[8 + i] = el; }}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="absolute -top-4 -left-4 text-8xl font-black text-[#2D6A4F]/5 group-hover:text-[#52B788]/10 transition-colors">
                  0{item.step}
                </div>
                <Card className="h-full p-8 rounded-3xl bg-white border-2 border-transparent hover:border-[#52B788]/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-[#52B788]/20">
                  <div className="text-5xl mb-6">{item.icon}</div>
                  <h3 className="text-xl font-bold text-[#1B4332] mb-4">{item.title}</h3>
                  <p className="text-[#2D6A4F]/70 leading-relaxed">{item.desc}</p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Loyalty Section - Modern Layout */}
      <section className="py-32 px-4 bg-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-amber-50 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-20 scroll-hidden" ref={(el) => { if (el) sectionRefs.current[12] = el; }}>
            <Badge className="bg-amber-50 text-amber-600 border-0 px-4 py-2 mb-6">
              {t('landing.loyalty.tag')}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black text-[#1B4332] mb-6 max-w-3xl mx-auto">
              {t('landing.loyalty.title')}
            </h2>
            <p className="text-xl text-[#2D6A4F]/70 max-w-2xl mx-auto">
              {t('landing.loyalty.subtitle')}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Images */}
            <div className="grid grid-cols-2 gap-6 scroll-hidden" ref={(el) => { if (el) sectionRefs.current[13] = el; }}>
              <div className="space-y-6">
                <div className="rounded-3xl overflow-hidden shadow-xl shadow-gray-200 hover:scale-105 transition-transform duration-500">
                  <Image
                    src="/loyalty-card-qr.jpg"
                    alt="Carte fidélité avec QR Code"
                    width={300}
                    height={500}
                    className="w-full h-auto object-cover"
                  />
                </div>
                <div className="rounded-3xl overflow-hidden shadow-xl shadow-gray-200 hover:scale-105 transition-transform duration-500">
                  <Image
                    src="/loyalty-card-history.jpg"
                    alt="Historique des points"
                    width={300}
                    height={350}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
              <div className="flex flex-col justify-center gap-6 pt-12">
                {[
                  'QR Code unique par client',
                  'Historique des achats',
                  'Points cumulables',
                  'Récompenses personnalisées'
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="p-4 bg-gradient-to-r from-[#2D6A4F]/5 to-[#52B788]/5 rounded-2xl border border-[#2D6A4F]/10 hover:border-[#52B788]/30 transition-all duration-300 hover:scale-105"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#2D6A4F] to-[#52B788] rounded-xl flex items-center justify-center text-white font-bold">
                        {i + 1}
                      </div>
                      <span className="font-semibold text-[#1B4332]">{feature}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-6 scroll-hidden" ref={(el) => { if (el) sectionRefs.current[14] = el; }}>
              {[
                {
                  icon: '⚡',
                  title: t('landing.loyalty.card1Title'),
                  desc: t('landing.loyalty.card1Desc')
                },
                {
                  icon: '💰',
                  title: t('landing.loyalty.card2Title'),
                  desc: t('landing.loyalty.card2Desc')
                },
                {
                  icon: '📱',
                  title: t('landing.loyalty.card3Title'),
                  desc: t('landing.loyalty.card3Desc')
                }
              ].map((item, i) => (
                <Card
                  key={i}
                  className="p-6 rounded-2xl bg-gradient-to-r from-[#FFF9E6] to-white border border-amber-200/50 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-100 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{item.icon}</div>
                    <div>
                      <h3 className="text-xl font-bold text-[#1B4332] mb-2">{item.title}</h3>
                      <p className="text-[#2D6A4F]/70 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section - Modern Grid */}
      <section className="py-32 px-4 bg-gradient-to-b from-[#F8FAF8] to-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20 scroll-hidden" ref={(el) => { if (el) sectionRefs.current[15] = el; }}>
            <Badge className="bg-[#2D6A4F]/10 text-[#2D6A4F] border-0 px-4 py-2 mb-6">
              {t('landing.benefits.tag')}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black text-[#1B4332] mb-6 max-w-3xl mx-auto">
              {t('landing.benefits.title')}
            </h2>
            <p className="text-xl text-[#2D6A4F]/70 max-w-2xl mx-auto">
              {t('landing.benefits.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: '🌍',
                title: t('landing.benefits.multilingual'),
                desc: t('landing.benefits.multilingualDesc'),
                tags: ['🇬🇧 EN', '🇹🇭 TH', '🇫🇷 FR', '🇨🇳 ZH', '🇯🇵 JP', '🇩🇪 DE']
              },
              {
                icon: '🎛️',
                title: t('landing.benefits.control'),
                desc: t('landing.benefits.controlDesc')
              },
              {
                icon: '📊',
                title: t('landing.benefits.dashboard'),
                desc: t('landing.benefits.dashboardDesc')
              },
              {
                icon: '🛡️',
                title: t('landing.benefits.protection'),
                desc: t('landing.benefits.protectionDesc')
              }
            ].map((item, i) => (
              <Card
                key={i}
                className="h-full p-8 rounded-3xl bg-white border-2 border-transparent hover:border-[#52B788]/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-[#52B788]/20 scroll-hidden"
                ref={(el) => { if (el) sectionRefs.current[16 + i] = el; }}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="text-5xl mb-6">{item.icon}</div>
                <h3 className="text-xl font-bold text-[#1B4332] mb-3">{item.title}</h3>
                <p className="text-[#2D6A4F]/70 leading-relaxed mb-4">{item.desc}</p>
                {item.tags && (
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag, j) => (
                      <Badge key={j} className="bg-[#2D6A4F]/5 text-[#2D6A4F] border-[#2D6A4F]/10 px-3 py-1 text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Thailand Special */}
          <div className="mt-16 scroll-hidden" ref={(el) => { if (el) sectionRefs.current[20] = el; }}>
            <Card className="bg-gradient-to-br from-[#2D6A4F] to-[#1B4332] border-0 rounded-3xl p-10 text-white">
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { emoji: '🇹🇭', title: t('landing.benefits.thailand'), desc: t('landing.benefits.thailandDesc') },
                  { emoji: '🏖️', title: t('landing.benefits.touristZones'), desc: t('landing.benefits.touristZonesDesc') },
                  { emoji: '⭐', title: t('landing.benefits.platforms'), desc: t('landing.benefits.platformsDesc') }
                ].map((item, i) => (
                  <div key={i} className="text-center">
                    <div className="text-5xl mb-4">{item.emoji}</div>
                    <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                    <p className="text-white/80">{item.desc}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Modern Cards */}
      <section id="testimonials" className="py-32 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20 scroll-hidden" ref={(el) => { if (el) sectionRefs.current[21] = el; }}>
            <Badge className="bg-[#2D6A4F]/10 text-[#2D6A4F] border-0 px-4 py-2 mb-6">
              {t('landing.testimonials.tag')}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black text-[#1B4332] mb-6 max-w-3xl mx-auto">
              {t('landing.testimonials.title')}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                initials: 'MA',
                name: 'Marc Alonso',
                role: 'Restaurant Le Gourmet, Paris',
                rating: 5,
                quote: 'En 3 mois, on est passé de 3.8 à 4.6 sur Google. Nos clients adorent la roue et reviennent plus vite !'
              },
              {
                initials: 'SP',
                name: 'Somchai Patel',
                role: 'Spa Thai Paradise, Phuket',
                rating: 5,
                quote: 'Les touristes adorent ! Notre note TripAdvisor a augmenté de 0.8 point en 2 mois.'
              },
              {
                initials: 'NC',
                name: 'Niran Chai',
                role: 'Sunrise Hotel, Koh Samui',
                rating: 5,
                quote: 'Parfait pour notre hôtel. Les clients internationaux adorent la roue !'
              }
            ].map((item, i) => (
              <Card
                key={i}
                className="p-8 rounded-3xl bg-gradient-to-b from-white to-[#F8FAF8] border-2 border-[#2D6A4F]/10 hover:border-[#52B788]/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-[#52B788]/20 scroll-hidden"
                ref={(el) => { if (el) sectionRefs.current[22 + i] = el; }}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#2D6A4F] to-[#52B788] rounded-2xl flex items-center justify-center text-white text-xl font-bold">
                    {item.initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1B4332] text-lg">{item.name}</h4>
                    <p className="text-sm text-[#2D6A4F]/70">{item.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-4">
                  {[...Array(item.rating)].map((_, j) => (
                    <svg key={j} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-[#2D6A4F]/80 leading-relaxed italic">"{item.quote}"</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - Modern Cards */}
      <section id="pricing" className="py-32 px-4 bg-gradient-to-b from-[#F8FAF8] to-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-20 scroll-hidden" ref={(el) => { if (el) sectionRefs.current[25] = el; }}>
            <Badge className="bg-[#2D6A4F]/10 text-[#2D6A4F] border-0 px-4 py-2 mb-6">
              {t('landing.pricing.tag')}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black text-[#1B4332] mb-6 max-w-3xl mx-auto">
              {t('landing.pricing.title')}
            </h2>
            <p className="text-xl text-[#2D6A4F]/70 max-w-2xl mx-auto">
              {t('landing.pricing.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-center">
            {/* Discovery */}
            <Card className="p-8 rounded-3xl bg-white border-2 border-[#2D6A4F]/10 hover:border-[#52B788]/50 transition-all duration-300 hover:-translate-y-2 scroll-hidden" ref={(el) => { if (el) sectionRefs.current[26] = el; }}>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-[#1B4332] mb-4">{t('landing.pricing.discovery')}</h3>
                <div className="mb-2">
                  <span className="text-5xl font-black text-[#1B4332]">{t('landing.pricing.discoveryPrice')}</span>
                </div>
                <p className="text-[#2D6A4F]/70">{t('landing.pricing.discoveryPeriod')}</p>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  `50 ${t('landing.pricing.scansMonth')}`,
                  `1 ${t('landing.pricing.establishment')}`,
                  t('landing.pricing.basicWheel'),
                  t('landing.pricing.essentialStats'),
                  t('landing.pricing.digitalLoyaltyCard')
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#52B788]/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-[#52B788]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[#2D6A4F]/80">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup?plan=discovery" className="block">
                <Button className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white py-4 rounded-2xl font-semibold">
                  {t('landing.pricing.startFree')}
                </Button>
              </Link>
            </Card>

            {/* Pro - Featured */}
            <Card className="p-8 rounded-3xl bg-gradient-to-br from-[#2D6A4F] to-[#52B788] border-0 shadow-2xl shadow-[#52B788]/30 relative md:-translate-y-4 scroll-hidden" ref={(el) => { if (el) sectionRefs.current[27] = el; }}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-[#FFD700] text-[#1B4332] border-0 px-4 py-1.5 font-bold shadow-lg">
                  {t('landing.pricing.popular')}
                </Badge>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">{t('landing.pricing.pro')}</h3>
                <div className="mb-2">
                  <span className="text-2xl text-white/60 line-through mr-2">2,000 ฿</span>
                  <span className="text-5xl font-black text-white">1,000 ฿</span>
                </div>
                <div className="inline-flex items-center gap-2 bg-[#FFD700]/20 rounded-full px-3 py-1 mb-2">
                  <span className="text-[#FFD700] font-bold text-sm">-50% PROMO</span>
                </div>
                <p className="text-white/80">{t('landing.pricing.proPeriod')}</p>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  `${t('landing.pricing.unlimited')} scans`,
                  `1 ${t('landing.pricing.establishment')}`,
                  t('landing.pricing.customWheel'),
                  t('landing.pricing.digitalLoyaltyCardPro'),
                  t('landing.pricing.autoWhatsappEmail'),
                  t('landing.pricing.fullDashboard'),
                  t('landing.pricing.multilingualSupport')
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-white font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup?plan=pro" className="block">
                <Button className="w-full bg-white text-[#2D6A4F] hover:bg-gray-100 py-4 rounded-2xl font-bold">
                  {t('landing.pricing.try14Days')}
                </Button>
              </Link>
            </Card>

            {/* Multi Store */}
            <Card className="p-8 rounded-3xl bg-white border-2 border-[#2D6A4F]/10 hover:border-[#52B788]/50 transition-all duration-300 hover:-translate-y-2 scroll-hidden" ref={(el) => { if (el) sectionRefs.current[28] = el; }}>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-[#1B4332] mb-4">{t('landing.pricing.multiStore')}</h3>
                <div className="mb-2">
                  <span className="text-5xl font-black text-[#1B4332]">{t('landing.pricing.multiStorePrice')}</span>
                </div>
                <p className="text-[#2D6A4F]/70">{t('landing.pricing.multiStorePeriod')}</p>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  t('landing.pricing.allProFeatures'),
                  t('landing.pricing.establishments'),
                  t('landing.pricing.centralizedDashboard'),
                  t('landing.pricing.dedicatedManager')
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#52B788]/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-[#52B788]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[#2D6A4F]/80">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/contact" className="block">
                <Button className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white py-4 rounded-2xl font-semibold">
                  {t('landing.pricing.contactUs')}
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12">
            {/* FAQ Accordion */}
            <div>
              <div className="text-center md:text-left mb-12 scroll-hidden" ref={(el) => { if (el) sectionRefs.current[29] = el; }}>
                <Badge className="bg-[#2D6A4F]/10 text-[#2D6A4F] border-0 px-4 py-2 mb-6">
                  FAQ
                </Badge>
                <h2 className="text-4xl font-black text-[#1B4332] mb-4">
                  {t('landing.faq.title')}
                </h2>
                <p className="text-xl text-[#2D6A4F]/70">
                  {t('landing.faq.subtitle')}
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { q: t('landing.faq.q1'), a: t('landing.faq.a1') },
                  { q: t('landing.faq.q2'), a: t('landing.faq.a2') },
                  { q: t('landing.faq.q3'), a: t('landing.faq.a3') },
                  { q: t('landing.faq.q4'), a: t('landing.faq.a4') }
                ].map((faq, i) => (
                  <Card
                    key={i}
                    className="bg-[#F8FAF8] border-0 rounded-2xl overflow-hidden"
                  >
                    <button
                      onClick={() => toggleFaq(i)}
                      className="w-full p-6 text-left flex items-center justify-between hover:bg-white/50 transition"
                    >
                      <span className="text-[#1B4332] font-bold text-lg pr-4">{faq.q}</span>
                      <div className={`w-10 h-10 rounded-xl bg-[#2D6A4F]/10 flex items-center justify-center flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}>
                        <svg className="w-5 h-5 text-[#2D6A4F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    {openFaq === i && (
                      <div className="px-6 pb-6 text-[#2D6A4F]/80 leading-relaxed border-t border-[#2D6A4F]/10 pt-6">
                        {faq.a}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>

            {/* Contact Form */}
            <div className="scroll-hidden" ref={(el) => { if (el) sectionRefs.current[33] = el; }}>
              <Card className="p-8 rounded-3xl bg-gradient-to-br from-[#2D6A4F] to-[#52B788] border-0 text-white">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{t('landing.faq.contactTitle')}</h3>
                    <p className="text-white/80">{t('landing.faq.contactSubtitle')}</p>
                  </div>
                </div>

                <form className="space-y-5">
                  <div>
                    <input
                      type="text"
                      placeholder={t('landing.faq.yourName')}
                      className="w-full p-4 bg-white/10 border border-white/20 rounded-xl focus:border-white focus:outline-none transition placeholder:text-white/50 text-white"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder={t('landing.faq.yourEmail')}
                      className="w-full p-4 bg-white/10 border border-white/20 rounded-xl focus:border-white focus:outline-none transition placeholder:text-white/50 text-white"
                    />
                  </div>
                  <div>
                    <textarea
                      placeholder={t('landing.faq.yourMessage')}
                      rows={4}
                      className="w-full p-4 bg-white/10 border border-white/20 rounded-xl focus:border-white focus:outline-none transition placeholder:text-white/50 text-white resize-none"
                    />
                  </div>
                  <Button className="w-full bg-white text-[#2D6A4F] hover:bg-gray-100 py-4 text-lg font-bold rounded-2xl">
                    {t('landing.faq.sendMessage')}
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Modern */}
      <section className="py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/BANNER-SPIN-HERO-.png"
            alt="StarSpin Banner"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#2D6A4F]/90 to-[#1B4332]/95" />
        </div>

        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-[2.5rem] p-12 md:p-16 text-center">
            <Badge className="bg-[#FFD700] text-[#1B4332] border-0 px-4 py-2 mb-8 font-bold">
              {t('landing.cta.tag')}
            </Badge>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
              {t('landing.cta.title')}
            </h2>
            <p className="text-xl md:text-2xl text-white/90 mb-10">
              {t('landing.cta.subtitle')}
            </p>
            <Link href="/auth/signup">
              <Button size="lg" className="bg-[#FFD700] hover:bg-[#FFC700] text-[#1B4332] px-12 py-7 text-xl font-bold rounded-full shadow-2xl shadow-[#FFD700]/30 hover:scale-105 transition-all duration-300">
                {t('landing.cta.tryFree')}
              </Button>
            </Link>
            <div className="mt-10 flex flex-wrap justify-center gap-6 text-white/80">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#52B788] rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>{t('landing.cta.noCommitment')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#52B788] rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>{t('landing.cta.quickSetup')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#52B788] rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>{t('landing.cta.support')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Modern */}
      <footer className="bg-[#1B4332] py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-[#52B788] to-[#FFD700] rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">S</span>
                </div>
                <span className="text-2xl font-bold text-white">StarSpin</span>
              </div>
              <p className="text-white/70 mb-8 leading-relaxed">
                {t('landing.hero.subtitle')}
              </p>
              <div className="flex gap-3">
                {['twitter', 'github', 'linkedin'].map((social) => (
                  <a
                    key={social}
                    href="#"
                    className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition hover:scale-110"
                  >
                    <span className="text-lg">{social === 'twitter' ? '𝕏' : social === 'github' ? '⌘' : '📱'}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-bold mb-6">Product</h4>
              <ul className="text-white/70 space-y-4">
                <li><a href="#features" className="hover:text-white transition hover:translate-x-1 inline-block">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition hover:translate-x-1 inline-block">Pricing</a></li>
                <li><a href="#testimonials" className="hover:text-white transition hover:translate-x-1 inline-block">Testimonials</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-bold mb-6">Company</h4>
              <ul className="text-white/70 space-y-4">
                <li><a href="#" className="hover:text-white transition hover:translate-x-1 inline-block">About</a></li>
                <li><a href="#" className="hover:text-white transition hover:translate-x-1 inline-block">Blog</a></li>
                <li><a href="#" className="hover:text-white transition hover:translate-x-1 inline-block">Contact</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-bold mb-6">Legal</h4>
              <ul className="text-white/70 space-y-4">
                <li><a href="#" className="hover:text-white transition hover:translate-x-1 inline-block">Terms</a></li>
                <li><a href="#" className="hover:text-white transition hover:translate-x-1 inline-block">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition hover:translate-x-1 inline-block">Cookies</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/60 text-sm">
              © 2025 StarSpin. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-white/60 text-sm">
              <span>Made with ❤️ in Thailand</span>
              <div className="flex gap-2">
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
