'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Check, X, Loader2, Globe, Bell, Shield, Link2, Calendar,
  Settings, ExternalLink
} from 'lucide-react';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/config';

type TabId = 'general' | 'links' | 'planning';

interface DaySchedule {
  open: boolean;
  from: string;
  to: string;
}

type WeeklySchedule = Record<string, DaySchedule>;

const DEFAULT_SCHEDULE: WeeklySchedule = {
  monday: { open: true, from: '09:00', to: '18:00' },
  tuesday: { open: true, from: '09:00', to: '18:00' },
  wednesday: { open: true, from: '09:00', to: '18:00' },
  thursday: { open: true, from: '09:00', to: '18:00' },
  friday: { open: true, from: '09:00', to: '18:00' },
  saturday: { open: true, from: '10:00', to: '17:00' },
  sunday: { open: false, from: '10:00', to: '17:00' },
};

const DAY_LABELS: Record<string, { fr: string; en: string }> = {
  monday: { fr: 'Lundi', en: 'Monday' },
  tuesday: { fr: 'Mardi', en: 'Tuesday' },
  wednesday: { fr: 'Mercredi', en: 'Wednesday' },
  thursday: { fr: 'Jeudi', en: 'Thursday' },
  friday: { fr: 'Vendredi', en: 'Friday' },
  saturday: { fr: 'Samedi', en: 'Saturday' },
  sunday: { fr: 'Dimanche', en: 'Sunday' },
};

const TABS: { id: TabId; icon: React.ReactNode; labelFr: string; labelEn: string }[] = [
  { id: 'general', icon: <Settings className="w-4 h-4" />, labelFr: 'General', labelEn: 'General' },
  { id: 'links', icon: <Link2 className="w-4 h-4" />, labelFr: 'Liens', labelEn: 'Links' },
  { id: 'planning', icon: <Calendar className="w-4 h-4" />, labelFr: 'Planification', labelEn: 'Planning' },
];

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isFr = i18n.language === 'fr';

  const [user, setUser] = useState<any>(null);
  const [merchant, setMerchant] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('general');

  // General settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newReviewAlert, setNewReviewAlert] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [timezone, setTimezone] = useState('Africa/Libreville');

  // Links settings
  const [googleReviewLink, setGoogleReviewLink] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [tripadvisorUrl, setTripadvisorUrl] = useState('');

  // Planning settings
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>(DEFAULT_SCHEDULE);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login');
        return;
      }

      setUser(user);

      const { data: merchantData } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', user.id)
        .single();

      setMerchant(merchantData);
      if (merchantData?.timezone) setTimezone(merchantData.timezone);
      if (merchantData?.email_notifications !== undefined) setEmailNotifications(merchantData.email_notifications);
      if (merchantData?.new_review_alert !== undefined) setNewReviewAlert(merchantData.new_review_alert);
      if (merchantData?.weekly_summary !== undefined) setWeeklySummary(merchantData.weekly_summary);

      // Links
      setGoogleReviewLink(merchantData?.google_review_link || '');
      setTiktokUrl(merchantData?.tiktok_url || '');
      setInstagramUrl(merchantData?.instagram_url || '');
      setTripadvisorUrl(merchantData?.tripadvisor_url || '');

      // Schedule
      if (merchantData?.weekly_schedule) {
        try {
          const schedule = JSON.parse(merchantData.weekly_schedule);
          setWeeklySchedule({ ...DEFAULT_SCHEDULE, ...schedule });
        } catch {
          setWeeklySchedule(DEFAULT_SCHEDULE);
        }
      }
    };

    checkAuth();
  }, [router]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      const updateData: Record<string, any> = {};

      if (activeTab === 'general') {
        updateData.timezone = timezone;
        updateData.email_notifications = emailNotifications;
        updateData.new_review_alert = newReviewAlert;
        updateData.weekly_summary = weeklySummary;
      } else if (activeTab === 'links') {
        updateData.google_review_link = googleReviewLink || null;
        updateData.tiktok_url = tiktokUrl || null;
        updateData.instagram_url = instagramUrl || null;
        updateData.tripadvisor_url = tripadvisorUrl || null;
      } else if (activeTab === 'planning') {
        updateData.weekly_schedule = JSON.stringify(weeklySchedule);
      }

      const { error } = await supabase
        .from('merchants')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      setMessage({
        type: 'success',
        text: isFr ? 'Parametres enregistres avec succes !' : 'Settings saved successfully!',
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || (isFr ? 'Erreur lors de la sauvegarde' : 'Failed to save settings'),
      });
    } finally {
      setSaving(false);
    }
  };

  const updateScheduleDay = (day: string, field: keyof DaySchedule, value: any) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  if (!user || !merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">{isFr ? 'Chargement...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout merchant={merchant}>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{t('dashboard.nav.settings')}</h1>
          <p className="text-gray-500 text-sm">
            {isFr ? 'Gerez vos preferences et configurations' : 'Manage your preferences and configurations'}
          </p>
        </div>

        {/* Success/Error message */}
        {message && (
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
              message.type === 'success'
                ? 'bg-teal-50 border border-teal-200 text-teal-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="w-4 h-4 text-teal-600 shrink-0" />
            ) : (
              <X className="w-4 h-4 text-red-600 shrink-0" />
            )}
            {message.text}
          </div>
        )}

        {/* Tabs Navigation */}
        <nav className="flex gap-1 border-b-2 border-gray-100 overflow-x-auto" role="tablist">
          {TABS.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMessage(null);
              }}
              className={`
                relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all duration-300 rounded-t-lg whitespace-nowrap
                ${activeTab === tab.id
                  ? 'text-teal-600'
                  : 'text-gray-500 hover:text-teal-700 hover:bg-teal-50/50'
                }
              `}
            >
              {tab.icon}
              <span>{isFr ? tab.labelFr : tab.labelEn}</span>
              {/* Active underline */}
              <span
                className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 transition-transform duration-300 origin-left ${
                  activeTab === tab.id ? 'scale-x-100' : 'scale-x-0'
                }`}
              />
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <div className="animate-[fadeIn_0.3s_ease-out]" key={activeTab}>
          {/* ===== GENERAL TAB ===== */}
          {activeTab === 'general' && (
            <div className="space-y-5">
              {/* Language & Region */}
              <Card className="group relative p-6 border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-300 hover:shadow-md">
                <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 to-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      {isFr ? 'Langue & Region' : 'Language & Region'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {isFr ? 'Langue et fuseau horaire' : 'Language and timezone settings'}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {isFr ? 'Langue' : 'Language'}
                    </label>
                    <LanguageSwitcher variant="dark" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isFr ? 'Fuseau horaire' : 'Timezone'}
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-teal-50/30 transition-all duration-200"
                    >
                      <option value="Africa/Libreville">Africa/Libreville (UTC+1)</option>
                      <option value="Africa/Lagos">Africa/Lagos (UTC+1)</option>
                      <option value="Africa/Douala">Africa/Douala (UTC+1)</option>
                      <option value="Africa/Kinshasa">Africa/Kinshasa (UTC+1)</option>
                      <option value="Africa/Brazzaville">Africa/Brazzaville (UTC+1)</option>
                      <option value="Europe/Paris">Europe/Paris (UTC+1/+2)</option>
                      <option value="Europe/London">Europe/London (UTC+0/+1)</option>
                      <option value="America/New_York">America/New_York (UTC-5/-4)</option>
                      <option value="Asia/Bangkok">Asia/Bangkok (UTC+7)</option>
                      <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
                    </select>
                  </div>
                </div>
              </Card>

              {/* Notifications */}
              <Card className="group relative p-6 border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-300 hover:shadow-md">
                <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 to-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Notifications</h3>
                    <p className="text-xs text-gray-500">
                      {isFr ? 'Gerez vos alertes' : 'Manage your alerts'}
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {/* Email Notifications */}
                  <label className="flex items-center justify-between py-4 cursor-pointer rounded-lg hover:bg-gray-50/50 transition-colors duration-200 px-1">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {isFr ? 'Notifications par email' : 'Email Notifications'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {isFr ? 'Recevoir les notifications par email' : 'Receive notifications by email'}
                      </p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-teal-600 transition-colors" />
                      <div className="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
                    </div>
                  </label>

                  {/* New Review Alert */}
                  <label className="flex items-center justify-between py-4 cursor-pointer rounded-lg hover:bg-gray-50/50 transition-colors duration-200 px-1">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {isFr ? 'Alertes nouveaux avis' : 'New Review Alerts'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {isFr ? 'Etre notifie quand un client laisse un avis' : 'Get notified when a customer leaves a review'}
                      </p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={newReviewAlert}
                        onChange={(e) => setNewReviewAlert(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-teal-600 transition-colors" />
                      <div className="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
                    </div>
                  </label>

                  {/* Weekly Summary */}
                  <label className="flex items-center justify-between py-4 cursor-pointer rounded-lg hover:bg-gray-50/50 transition-colors duration-200 px-1">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {isFr ? 'Resume hebdomadaire' : 'Weekly Summary'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {isFr ? 'Recevoir un resume de performance chaque semaine' : 'Receive a weekly performance summary'}
                      </p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={weeklySummary}
                        onChange={(e) => setWeeklySummary(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-teal-600 transition-colors" />
                      <div className="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
                    </div>
                  </label>
                </div>
              </Card>

              {/* Account */}
              <Card className="group relative p-6 border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-300 hover:shadow-md">
                <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 to-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      {isFr ? 'Compte' : 'Account'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {isFr ? 'Informations de votre compte' : 'Your account information'}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-sm text-gray-600 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                      {user.email}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account ID</label>
                    <p className="text-xs text-gray-500 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg font-mono">
                      {user.id}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ===== LINKS TAB ===== */}
          {activeTab === 'links' && (
            <div className="space-y-5">
              <Card className="group relative p-6 border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-300 hover:shadow-md">
                <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 to-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Link2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      {isFr ? 'Liens de redirection' : 'Redirect Links'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {isFr
                        ? 'Configurez les liens vers vos reseaux sociaux'
                        : 'Configure links to your social networks'}
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Google Reviews */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Google Reviews
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={googleReviewLink}
                        onChange={(e) => setGoogleReviewLink(e.target.value)}
                        placeholder="https://g.page/r/..."
                        className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-teal-50/30 transition-all duration-200"
                      />
                      {googleReviewLink && (
                        <a href={googleReviewLink} target="_blank" rel="noopener noreferrer" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600 transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* TikTok */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.94a8.16 8.16 0 004.76 1.52V7.01a4.85 4.85 0 01-1-.32z"/>
                      </svg>
                      TikTok
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={tiktokUrl}
                        onChange={(e) => setTiktokUrl(e.target.value)}
                        placeholder="https://www.tiktok.com/@..."
                        className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-teal-50/30 transition-all duration-200"
                      />
                      {tiktokUrl && (
                        <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600 transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Instagram */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#ig-gradient)" strokeWidth="2"/>
                        <circle cx="12" cy="12" r="5" stroke="url(#ig-gradient)" strokeWidth="2"/>
                        <circle cx="17.5" cy="6.5" r="1.5" fill="url(#ig-gradient)"/>
                        <defs>
                          <linearGradient id="ig-gradient" x1="2" y1="22" x2="22" y2="2">
                            <stop stopColor="#F58529"/>
                            <stop offset="0.5" stopColor="#DD2A7B"/>
                            <stop offset="1" stopColor="#8134AF"/>
                          </linearGradient>
                        </defs>
                      </svg>
                      Instagram
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={instagramUrl}
                        onChange={(e) => setInstagramUrl(e.target.value)}
                        placeholder="https://www.instagram.com/..."
                        className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-teal-50/30 transition-all duration-200"
                      />
                      {instagramUrl && (
                        <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600 transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* TripAdvisor */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="#34E0A1" strokeWidth="2"/>
                        <circle cx="8.5" cy="12" r="2.5" stroke="#34E0A1" strokeWidth="1.5"/>
                        <circle cx="15.5" cy="12" r="2.5" stroke="#34E0A1" strokeWidth="1.5"/>
                        <circle cx="8.5" cy="12" r="1" fill="#34E0A1"/>
                        <circle cx="15.5" cy="12" r="1" fill="#34E0A1"/>
                        <path d="M12 7L8 10M12 7L16 10" stroke="#34E0A1" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      TripAdvisor
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={tripadvisorUrl}
                        onChange={(e) => setTripadvisorUrl(e.target.value)}
                        placeholder="https://www.tripadvisor.com/..."
                        className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-teal-50/30 transition-all duration-200"
                      />
                      {tripadvisorUrl && (
                        <a href={tripadvisorUrl} target="_blank" rel="noopener noreferrer" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600 transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ===== PLANNING TAB ===== */}
          {activeTab === 'planning' && (
            <div className="space-y-5">
              <Card className="group relative p-6 border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-300 hover:shadow-md">
                <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 to-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      {isFr ? "Horaires d'ouverture" : 'Opening Hours'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {isFr
                        ? 'Configurez vos horaires pour chaque jour de la semaine'
                        : 'Configure your hours for each day of the week'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {Object.entries(weeklySchedule).map(([day, schedule]) => (
                    <div
                      key={day}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors duration-200 ${
                        schedule.open ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      {/* Toggle */}
                      <label className="relative cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={schedule.open}
                          onChange={(e) => updateScheduleDay(day, 'open', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-teal-600 transition-colors" />
                        <div className="absolute left-[2px] top-[2px] w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform" />
                      </label>

                      {/* Day name */}
                      <span className={`text-sm font-medium w-24 ${schedule.open ? 'text-gray-900' : 'text-gray-400'}`}>
                        {isFr ? DAY_LABELS[day].fr : DAY_LABELS[day].en}
                      </span>

                      {/* Time inputs */}
                      {schedule.open ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="time"
                            value={schedule.from}
                            onChange={(e) => updateScheduleDay(day, 'from', e.target.value)}
                            className="px-2 py-1.5 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                          />
                          <span className="text-gray-400 text-xs">{isFr ? 'a' : 'to'}</span>
                          <input
                            type="time"
                            value={schedule.to}
                            onChange={(e) => updateScheduleDay(day, 'to', e.target.value)}
                            className="px-2 py-1.5 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          {isFr ? 'Ferme' : 'Closed'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isFr ? 'Enregistrement...' : 'Saving...'}
              </>
            ) : (
              isFr ? 'Enregistrer' : 'Save Settings'
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
