'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/config';
import { 
  LayoutDashboard, 
  Gift, 
  QrCode, 
  MessageSquare, 
  Settings, 
  LogOut,
  Menu,
  X,
  BarChart3,
  Users,
  Bell,
  CreditCard,
  Target,
  ScanLine,
  ChevronRight,
  Store
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  merchant?: any;
}

export function DashboardLayout({ children, merchant }: DashboardLayoutProps) {
  const { t, ready } = useTranslation(undefined, { useSuspense: false });
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navigation = [
    { name: t('dashboard.nav.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('dashboard.nav.scanner'), href: '/dashboard/scan', icon: ScanLine },
    { name: t('dashboard.nav.prizes'), href: '/dashboard/prizes', icon: Gift },
    { name: t('dashboard.nav.feedback'), href: '/dashboard/feedback', icon: MessageSquare },
    { name: t('dashboard.nav.qrCode'), href: '/dashboard/qr', icon: QrCode },
    { name: t('dashboard.nav.analytics'), href: '/dashboard/analytics', icon: BarChart3 },
    { name: t('dashboard.nav.strategy'), href: '/dashboard/strategy', icon: Target },
    { name: t('dashboard.nav.customers'), href: '/dashboard/customers', icon: Users },
    { name: t('dashboard.nav.billing'), href: '/dashboard/billing', icon: CreditCard },
    { name: t('dashboard.nav.settings'), href: '/dashboard/settings', icon: Settings },
  ];

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 bg-[#0F172A] border-r border-slate-800/50 transform transition-transform duration-300 ease-in-out shadow-2xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-slate-800/50 bg-[#0F172A]">
            <Link href="/dashboard" className="flex items-center gap-3">
              <img 
                src="/LOGO-STARSPIN-WHITE_web.png" 
                alt="StarSpin Logo" 
                className="h-8 w-auto transition-transform hover:scale-105"
              />
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Merchant Info */}
          {merchant && (
            <div className="px-6 py-6 border-b border-slate-800/50 bg-[#0F172A]/50">
              <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-teal-900/20">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {merchant.business_name || merchant.name}
                  </p>
                  <p className="text-xs text-slate-400 capitalize flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {merchant.subscription_tier || 'Free'} Plan
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">{t('dashboard.nav.mainMenu')}</p>
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg shadow-teal-900/20 border border-teal-500/20' 
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                  {item.name}
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto text-white/50" />}
                </Link>
              );
            })}
          </nav>

          {/* Sign Out */}
          <div className="p-4 border-t border-slate-800/50 bg-[#0F172A]">
            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="w-full justify-start gap-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              {t('dashboard.nav.signOut')}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
          <div className="flex items-center justify-between h-20 px-4 sm:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-slate-900">
                  {navigation.find(item => item.href === pathname)?.name || t('dashboard.nav.dashboard')}
                </h1>
                <p className="text-sm text-slate-500 hidden sm:block">
                  {t('dashboard.common.online')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <LanguageSwitcher variant="dark" />
              <div className="h-9 px-4 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-2 text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                {t('dashboard.common.online')}
              </div>
              <button className="p-2.5 rounded-full hover:bg-slate-100 relative transition-colors">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
