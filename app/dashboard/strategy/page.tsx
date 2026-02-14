'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2, Calendar, MapPin, Star, Music, Instagram as InstagramIcon, Globe, MessageCircle, Palette, Link2, Route } from 'lucide-react';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const PLATFORMS = [
  { value: 'google_maps', label: 'Google Reviews', icon: MapPin, color: 'bg-red-500' },
  { value: 'tripadvisor', label: 'TripAdvisor', icon: Star, color: 'bg-green-500' },
  { value: 'tiktok', label: 'TikTok', icon: Music, color: 'bg-black' },
  { value: 'instagram', label: 'Instagram', icon: InstagramIcon, color: 'bg-pink-500' },
];

type TabId = 'workflow' | 'routing';

const TABS: { id: TabId; icon: React.ReactNode; label: string }[] = [
  { id: 'workflow', icon: <Globe className="w-4 h-4" />, label: 'Workflow' },
  { id: 'routing', icon: <Route className="w-4 h-4" />, label: 'Routage' },
];

export default function StrategyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [merchant, setMerchant] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('workflow');

  // Workflow mode: 'web' or 'whatsapp'
  const [workflowMode, setWorkflowMode] = useState<'web' | 'whatsapp'>('web');

  // Logo background color
  const [logoBackgroundColor, setLogoBackgroundColor] = useState('#FFFFFF');

  // Redirect URLs
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [tripadvisorUrl, setTripadvisorUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');

  // Weekly schedule: array of 7 days, each with a platform
  const [weeklySchedule, setWeeklySchedule] = useState<string[]>(
    Array(7).fill('google_maps')
  );

  // Current day index (0 = Monday, 6 = Sunday) - computed client-side to avoid hydration mismatch
  const [currentDayIndex, setCurrentDayIndex] = useState<number | null>(null);

  // Set current day index on client-side only
  useEffect(() => {
    const jsDay = new Date().getDay(); // 0 = Sunday, 1 = Monday, ...
    const dayIndex = jsDay === 0 ? 6 : jsDay - 1; // Convert to 0 = Monday, 6 = Sunday
    setCurrentDayIndex(dayIndex);
  }, []);

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

      // Load workflow mode
      setWorkflowMode(merchantData?.workflow_mode || 'web');

      // Load logo background color
      setLogoBackgroundColor(merchantData?.logo_background_color || '#FFFFFF');

      // Load redirect URLs
      setGoogleMapsUrl(merchantData?.google_maps_url || '');
      setTripadvisorUrl(merchantData?.tripadvisor_url || '');
      setTiktokUrl(merchantData?.tiktok_url || '');
      setInstagramUrl(merchantData?.instagram_url || '');

      // Load weekly schedule
      if (merchantData?.weekly_schedule) {
        try {
          const schedule = JSON.parse(merchantData.weekly_schedule);
          if (Array.isArray(schedule) && schedule.length === 7) {
            setWeeklySchedule(schedule);
          }
        } catch {
          // Invalid schedule format, use defaults
        }
      }
    };

    checkAuth();
  }, [router]);

  const handleDayChange = (dayIndex: number, platform: string) => {
    const newSchedule = [...weeklySchedule];
    newSchedule[dayIndex] = platform;
    setWeeklySchedule(newSchedule);
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    setMessage(null);

    try {
      const updates: any = {
        workflow_mode: workflowMode,
        logo_background_color: logoBackgroundColor || '#FFFFFF',
        google_maps_url: googleMapsUrl || null,
        tripadvisor_url: tripadvisorUrl || null,
        tiktok_url: tiktokUrl || null,
        instagram_url: instagramUrl || null,
        weekly_schedule: JSON.stringify(weeklySchedule),
      };

      const { error } = await supabase
        .from('merchants')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Strategie sauvegardee avec succes !' });

      // Refresh merchant data
      const { data: merchantData } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', user.id)
        .single();
      setMerchant(merchantData);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Echec de la sauvegarde' });
    } finally {
      setLoading(false);
    }
  };

  const getPlatformInfo = (platformValue: string) => {
    return PLATFORMS.find(p => p.value === platformValue) || PLATFORMS[0];
  };

  const handleReset = () => {
    setWorkflowMode(merchant.workflow_mode || 'web');
    setLogoBackgroundColor(merchant.logo_background_color || '#FFFFFF');
    setGoogleMapsUrl(merchant.google_maps_url || '');
    setTripadvisorUrl(merchant.tripadvisor_url || '');
    setTiktokUrl(merchant.tiktok_url || '');
    setInstagramUrl(merchant.instagram_url || '');
    if (merchant.weekly_schedule) {
      try {
        const schedule = JSON.parse(merchant.weekly_schedule);
        setWeeklySchedule(schedule);
      } catch {
        setWeeklySchedule(Array(7).fill('google_maps'));
      }
    }
  };

  if (!user || !merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout merchant={merchant}>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Strategie de Redirection</h1>
          <p className="text-gray-500 text-sm">Configurez vos liens et planifiez vos redirections</p>
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
              <span>{tab.label}</span>
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

          {/* ===== WORKFLOW TAB ===== */}
          {activeTab === 'workflow' && (
            <div className="space-y-5">
              {/* Workflow Mode */}
              <Card className="group relative p-6 border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-300 hover:shadow-md">
                <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 to-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Mode de Workflow</h3>
                    <p className="text-xs text-gray-500">Comment vos clients recoivent le lien vers la roue</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Web Mode */}
                  <button
                    type="button"
                    onClick={() => setWorkflowMode('web')}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      workflowMode === 'web'
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        workflowMode === 'web' ? 'bg-teal-500' : 'bg-gray-200'
                      }`}>
                        <Globe className={`w-5 h-5 ${workflowMode === 'web' ? 'text-white' : 'text-gray-500'}`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Mode Web</h4>
                        <p className="text-xs text-gray-500">Workflow actuel</p>
                      </div>
                      {workflowMode === 'web' && (
                        <Check className="w-5 h-5 text-teal-500 ml-auto" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Apres l'avis Google, le client voit un timer de 15 secondes puis clique sur un bouton pour acceder a la roue.
                    </p>
                  </button>

                  {/* WhatsApp Mode */}
                  <button
                    type="button"
                    onClick={() => setWorkflowMode('whatsapp')}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      workflowMode === 'whatsapp'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        workflowMode === 'whatsapp' ? 'bg-green-500' : 'bg-gray-200'
                      }`}>
                        <MessageCircle className={`w-5 h-5 ${workflowMode === 'whatsapp' ? 'text-white' : 'text-gray-500'}`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Mode WhatsApp</h4>
                        <p className="text-xs text-gray-500">Nouveau</p>
                      </div>
                      {workflowMode === 'whatsapp' && (
                        <Check className="w-5 h-5 text-green-500 ml-auto" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Apres l'avis Google, le client recoit automatiquement un message WhatsApp avec le lien vers la roue.
                    </p>
                  </button>
                </div>

                {/* WhatsApp Configuration (shown only when WhatsApp mode is selected) */}
                {workflowMode === 'whatsapp' && (
                  <div className="mt-5 p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                      <MessageCircle className="w-4 h-4 text-green-600" />
                      Configuration WhatsApp
                    </h4>

                    <div className="bg-white border border-green-200 rounded-lg p-3 space-y-2">
                      <p className="text-sm text-gray-700 font-medium">Messages automatiques</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="bg-green-50 rounded-lg p-2.5 border border-green-100">
                          <p className="font-medium text-green-800 text-xs mb-0.5">Nouveau client</p>
                          <p className="text-gray-600 text-xs">
                            "Merci pour votre avis ! Tournez la roue pour gagner un cadeau."
                          </p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-100">
                          <p className="font-medium text-blue-800 text-xs mb-0.5">Client fidele</p>
                          <p className="text-gray-600 text-xs">
                            "Bon retour ! Tournez la roue pour tenter de gagner un cadeau."
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Les messages sont traduits automatiquement (FR, EN, TH, ES, PT)
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                      <p className="text-xs text-blue-800">
                        Le client entre son numero WhatsApp au lieu de son email.
                        Apres l'avis, il recoit un message avec 2 boutons : <strong>Tourner la Roue</strong> et <strong>Ma Carte Fidelite</strong>.
                      </p>
                    </div>
                  </div>
                )}
              </Card>

              {/* Logo Background Color */}
              <Card className="group relative p-6 border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-300 hover:shadow-md">
                <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 to-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Couleur de Fond du Logo</h3>
                    <p className="text-xs text-gray-500">Cercle contenant votre logo sur la roue et la page coupon</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={logoBackgroundColor}
                      onChange={(e) => setLogoBackgroundColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-300 hover:border-teal-500 transition-colors"
                    />
                    <input
                      type="text"
                      value={logoBackgroundColor}
                      onChange={(e) => setLogoBackgroundColor(e.target.value)}
                      placeholder="#FFFFFF"
                      className="w-24 px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-teal-50/30 transition-all duration-200"
                    />
                  </div>

                  {/* Preview */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Apercu :</span>
                    <div
                      className="w-12 h-12 rounded-full border-4 border-[#ffd700] flex items-center justify-center shadow-md"
                      style={{ backgroundColor: logoBackgroundColor }}
                    >
                      {merchant?.logo_url ? (
                        <img
                          src={merchant.logo_url}
                          alt="Logo"
                          className="w-8 h-8 object-contain rounded-full"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">Logo</span>
                      )}
                    </div>
                  </div>

                  {/* Presets */}
                  <div className="flex gap-1.5">
                    {[
                      { label: 'Blanc', value: '#FFFFFF' },
                      { label: 'Noir', value: '#000000' },
                      { label: 'Or', value: '#FFD700' },
                      { label: 'Nuit', value: '#1a1a2e' },
                    ].map(preset => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setLogoBackgroundColor(preset.value)}
                        className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                          logoBackgroundColor === preset.value
                            ? 'bg-gray-100 border-gray-400'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ===== ROUTING TAB ===== */}
          {activeTab === 'routing' && (
            <div className="space-y-5">
              {/* Weekly Schedule - Compact */}
              <Card className="group relative p-6 border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-300 hover:shadow-md">
                <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 to-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Planification Hebdomadaire</h3>
                    <p className="text-xs text-gray-500">Plateforme de redirection par jour de la semaine</p>
                  </div>
                </div>

                {/* Compact 7-day grid */}
                <div className="grid grid-cols-7 gap-2">
                  {DAYS.map((day, index) => {
                    const selectedPlatform = getPlatformInfo(weeklySchedule[index]);
                    const Icon = selectedPlatform.icon;
                    const isToday = currentDayIndex === index;

                    return (
                      <div key={index} className={`rounded-lg border-2 p-2 text-center transition-colors ${
                        isToday ? 'border-teal-400 bg-teal-50' : 'border-gray-200'
                      }`}>
                        <span className={`text-xs font-semibold block mb-1.5 ${isToday ? 'text-teal-600' : 'text-gray-700'}`}>
                          {DAYS_SHORT[index]}
                        </span>
                        <div className={`w-7 h-7 mx-auto ${selectedPlatform.color} rounded-full flex items-center justify-center mb-1.5`}>
                          <Icon className="w-3.5 h-3.5 text-white" />
                        </div>
                        <select
                          value={weeklySchedule[index]}
                          onChange={(e) => handleDayChange(index, e.target.value)}
                          className="w-full px-0.5 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-teal-500 focus:border-teal-500 bg-white"
                        >
                          {PLATFORMS.map((platform) => (
                            <option key={platform.value} value={platform.value}>
                              {platform.label.split(' ')[0]}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>

                {/* Today's preview */}
                {currentDayIndex !== null && (
                  <div className="mt-4 flex items-center gap-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                    <div className={`w-8 h-8 ${getPlatformInfo(weeklySchedule[currentDayIndex]).color} rounded-full flex items-center justify-center flex-shrink-0`}>
                      {React.createElement(getPlatformInfo(weeklySchedule[currentDayIndex]).icon, {
                        className: "w-4 h-4 text-white"
                      })}
                    </div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Aujourd'hui ({DAYS[currentDayIndex]})</span> : redirection vers{' '}
                      <span className="font-bold text-teal-700">
                        {getPlatformInfo(weeklySchedule[currentDayIndex]).label}
                      </span>
                    </p>
                  </div>
                )}
              </Card>

              {/* Redirect URLs */}
              <Card className="group relative p-6 border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-300 hover:shadow-md">
                <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 to-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Link2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Liens de Redirection</h3>
                    <p className="text-xs text-gray-500">URLs vers lesquelles rediriger vos clients</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Google Reviews URL */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                      <MapPin className="w-4 h-4 text-red-500" />
                      Google Reviews
                    </label>
                    <input
                      type="url"
                      value={googleMapsUrl}
                      onChange={(e) => setGoogleMapsUrl(e.target.value)}
                      placeholder="https://g.page/your-business"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-teal-50/30 transition-all duration-200"
                    />
                  </div>

                  {/* TripAdvisor URL */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                      <Star className="w-4 h-4 text-green-500" />
                      TripAdvisor
                    </label>
                    <input
                      type="url"
                      value={tripadvisorUrl}
                      onChange={(e) => setTripadvisorUrl(e.target.value)}
                      placeholder="https://www.tripadvisor.com/..."
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-teal-50/30 transition-all duration-200"
                    />
                  </div>

                  {/* TikTok URL */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                      <Music className="w-4 h-4 text-black" />
                      TikTok
                    </label>
                    <input
                      type="url"
                      value={tiktokUrl}
                      onChange={(e) => setTiktokUrl(e.target.value)}
                      placeholder="https://www.tiktok.com/@your-account"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-teal-50/30 transition-all duration-200"
                    />
                  </div>

                  {/* Instagram URL */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                      <InstagramIcon className="w-4 h-4 text-pink-500" />
                      Instagram
                    </label>
                    <input
                      type="url"
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                      placeholder="https://www.instagram.com/your-account"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-teal-50/30 transition-all duration-200"
                    />
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Save / Reset Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={handleReset}>
            Reinitialiser
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              'Sauvegarder'
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
