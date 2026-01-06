'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2, Calendar, MapPin, Star, Music, Instagram as InstagramIcon, Globe, MessageCircle } from 'lucide-react';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const PLATFORMS = [
  { value: 'google_maps', label: 'Google Reviews', icon: MapPin, color: 'bg-red-500' },
  { value: 'tripadvisor', label: 'TripAdvisor', icon: Star, color: 'bg-green-500' },
  { value: 'tiktok', label: 'TikTok', icon: Music, color: 'bg-black' },
  { value: 'instagram', label: 'Instagram', icon: InstagramIcon, color: 'bg-pink-500' },
];

export default function StrategyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [merchant, setMerchant] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Workflow mode: 'web' or 'whatsapp'
  const [workflowMode, setWorkflowMode] = useState<'web' | 'whatsapp'>('web');

  // WhatsApp configuration
  const [whatsappMessageTemplate, setWhatsappMessageTemplate] = useState('');

  // Redirect URLs
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [tripadvisorUrl, setTripadvisorUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');

  // Weekly schedule: array of 7 days, each with a platform
  const [weeklySchedule, setWeeklySchedule] = useState<string[]>(
    Array(7).fill('google_maps')
  );

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
      
      // Load workflow mode and WhatsApp config
      setWorkflowMode(merchantData?.workflow_mode || 'web');
      setWhatsappMessageTemplate(merchantData?.whatsapp_message_template || 'Merci pour votre avis ! 🎉 Tournez la roue pour gagner un cadeau : {{spin_url}}');

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
        whatsapp_message_template: whatsappMessageTemplate || null,
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

      setMessage({ type: 'success', text: 'Stratégie sauvegardée avec succès !' });
      
      // Refresh merchant data
      const { data: merchantData } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', user.id)
        .single();
      setMerchant(merchantData);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Échec de la sauvegarde' });
    } finally {
      setLoading(false);
    }
  };

  const getPlatformInfo = (platformValue: string) => {
    return PLATFORMS.find(p => p.value === platformValue) || PLATFORMS[0];
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Stratégie de Redirection</h1>
          <p className="text-gray-600">Configurez vos liens et planifiez automatiquement vos redirections sur 7 jours</p>
        </div>

        {message && (
          <Card className={`p-4 ${message.type === 'success' ? 'bg-teal-50 border-teal-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <Check className="w-5 h-5 text-teal-600" />
              ) : (
                <X className="w-5 h-5 text-red-600" />
              )}
              <p className={message.type === 'success' ? 'text-teal-700' : 'text-red-700'}>
                {message.text}
              </p>
            </div>
          </Card>
        )}

        {/* Workflow Mode Selection */}
        <Card className="p-6 border-2 border-teal-200">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Mode de Workflow</h3>
            <p className="text-sm text-gray-600">
              Choisissez comment vos clients recevront le lien vers la roue après avoir laissé un avis
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Après l'avis Google, le client voit un timer de 15 secondes puis clique sur un bouton pour accéder à la roue.
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
                Après l'avis Google, le client reçoit automatiquement un message WhatsApp avec le lien vers la roue.
              </p>
            </button>
          </div>

          {/* WhatsApp Configuration (shown only when WhatsApp mode is selected) */}
          {workflowMode === 'whatsapp' && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-600" />
                Configuration WhatsApp
              </h4>

              {/* WhatsApp Message Template */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modèle de Message WhatsApp
                </label>
                <textarea
                  value={whatsappMessageTemplate}
                  onChange={(e) => setWhatsappMessageTemplate(e.target.value)}
                  rows={3}
                  placeholder="Merci pour votre avis ! Tournez la roue : {{spin_url}}"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Utilisez <code className="bg-gray-100 px-1 rounded">{'{{spin_url}}'}</code> comme espace réservé pour le lien de la roue
                </p>
              </div>

              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  💡 <strong>Fonctionnement :</strong> Dans ce mode, le client entre son numéro WhatsApp au lieu de son email.
                  Après avoir laissé un avis, il reçoit automatiquement un message WhatsApp avec le lien vers la roue.
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Redirect URLs Configuration */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Liens de Redirection</h3>
            <p className="text-sm text-gray-600">Configurez les URLs vers lesquelles rediriger vos clients</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Google Reviews URL */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 text-red-500" />
                Google Reviews
              </label>
              <input
                type="url"
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                placeholder="https://g.page/your-business"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            {/* TripAdvisor URL */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Star className="w-4 h-4 text-green-500" />
                TripAdvisor
              </label>
              <input
                type="url"
                value={tripadvisorUrl}
                onChange={(e) => setTripadvisorUrl(e.target.value)}
                placeholder="https://www.tripadvisor.com/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            {/* TikTok URL */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Music className="w-4 h-4 text-black" />
                TikTok
              </label>
              <input
                type="url"
                value={tiktokUrl}
                onChange={(e) => setTiktokUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@your-account"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            {/* Instagram URL */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <InstagramIcon className="w-4 h-4 text-pink-500" />
                Instagram
              </label>
              <input
                type="url"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://www.instagram.com/your-account"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>
        </Card>

        {/* Weekly Schedule */}
        <Card className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-gray-900">Planification Automatique (7 jours)</h3>
            </div>
            <p className="text-sm text-gray-600">
              Sélectionnez la plateforme de redirection pour chaque jour de la semaine. 
              Le système utilisera automatiquement le bon lien selon le jour.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {DAYS.map((day, index) => {
              const selectedPlatform = getPlatformInfo(weeklySchedule[index]);
              const Icon = selectedPlatform.icon;
              
              return (
                <div key={index} className="border-2 border-gray-200 rounded-lg p-4 hover:border-teal-500 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-gray-900">{day}</span>
                    <div className={`w-8 h-8 ${selectedPlatform.color} rounded-full flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  
                  <select
                    value={weeklySchedule[index]}
                    onChange={(e) => handleDayChange(index, e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    {PLATFORMS.map((platform) => (
                      <option key={platform.value} value={platform.value}>
                        {platform.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Astuce :</strong> Le système détecte automatiquement le jour de la semaine et redirige vos clients 
              vers la plateforme configurée. Par exemple, si vous configurez "TikTok" pour le vendredi, tous les clients 
              qui notent 4-5 étoiles le vendredi seront redirigés vers votre TikTok !
            </p>
          </div>
        </Card>

        {/* Current Day Preview */}
        <Card className="p-6 bg-gradient-to-r from-teal-50 to-blue-50 border-teal-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Aujourd'hui</h3>
              <p className="text-sm text-gray-600">
                Les clients seront redirigés vers : 
                <span className="font-bold text-teal-700 ml-1">
                  {getPlatformInfo(weeklySchedule[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]).label}
                </span>
              </p>
            </div>
            <div className={`w-16 h-16 ${getPlatformInfo(weeklySchedule[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]).color} rounded-full flex items-center justify-center shadow-lg`}>
              {React.createElement(getPlatformInfo(weeklySchedule[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]).icon, {
                className: "w-8 h-8 text-white"
              })}
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setWorkflowMode(merchant.workflow_mode || 'web');
              setWhatsappMessageTemplate(merchant.whatsapp_message_template || 'Merci pour votre avis ! 🎉 Tournez la roue pour gagner un cadeau : {{spin_url}}');
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
            }}
          >
            Réinitialiser
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              'Sauvegarder la Stratégie'
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
