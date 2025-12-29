'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import { supabase } from '@/lib/supabase/client';
import { Star, ExternalLink } from 'lucide-react';

export default function RedirectPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params.shopId as string;

  const [merchant, setMerchant] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [canProceed, setCanProceed] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('');
  const [strategy, setStrategy] = useState('google_maps');
  const [hasClickedSocial, setHasClickedSocial] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchMerchant = async () => {
      const { data, error } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', shopId)
        .single();

      if (error) {
        console.error('Error fetching merchant:', error);
        return;
      }

      if (data) {
        setMerchant(data);
        
        // Get current day of week (0 = Sunday, 1 = Monday, etc.)
        const today = new Date().getDay();
        // Convert to Monday-based index (0 = Monday, 6 = Sunday)
        const dayIndex = today === 0 ? 6 : today - 1;
        
        // Get weekly schedule if available
        let currentStrategy = 'google_maps';
        if (data.weekly_schedule) {
          try {
            const schedule = JSON.parse(data.weekly_schedule);
            if (Array.isArray(schedule) && schedule.length === 7) {
              currentStrategy = schedule[dayIndex];
            }
          } catch (e) {
            currentStrategy = data.redirect_strategy || 'google_maps';
          }
        } else {
          currentStrategy = data.redirect_strategy || 'google_maps';
        }
        
        setStrategy(currentStrategy);

        // Set redirect URL based on strategy
        let url = '';
        switch (currentStrategy) {
          case 'google_maps':
            url = data.google_maps_url;
            break;
          case 'tripadvisor':
            url = data.tripadvisor_url;
            break;
          case 'tiktok':
            url = data.tiktok_url;
            break;
          case 'instagram':
            url = data.instagram_url;
            break;
        }
        setRedirectUrl(url);
      }
    };

    fetchMerchant();
  }, [shopId]);

  // Countdown timer - only starts after social link is clicked
  useEffect(() => {
    if (hasClickedSocial && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (hasClickedSocial && countdown === 0) {
      setCanProceed(true);
    }
  }, [countdown, hasClickedSocial]);

  const getStrategyInfo = () => {
    switch (strategy) {
      case 'google_maps':
        return {
          icon: '🗺️',
          name: 'Google Reviews',
          message: 'Merci, votre avis compte pour nous. Pouvez-vous le partager ici ?',
          bg: 'bg-green-50',
          border: 'border-green-200',
          text_color: 'text-green-800',
          button_bg: 'bg-green-600',
          button_hover: 'hover:bg-green-700'
        };
      case 'tripadvisor':
        return {
          icon: '⭐',
          name: 'TripAdvisor',
          message: 'Merci, votre avis compte pour nous. Pouvez-vous le partager ici ?',
          bg: 'bg-green-50',
          border: 'border-green-200',
          text_color: 'text-green-800',
          button_bg: 'bg-green-600',
          button_hover: 'hover:bg-green-700'
        };
      case 'tiktok':
        return {
          icon: '🎵',
          name: 'TikTok',
          message: 'Merci, votre soutien compte pour nous. Pouvez-vous nous rejoindre ici ?',
          bg: 'bg-gray-50',
          border: 'border-gray-300',
          text_color: 'text-gray-800',
          button_bg: 'bg-gray-900',
          button_hover: 'hover:bg-black'
        };
      case 'instagram':
        return {
          icon: '📸',
          name: 'Instagram',
          message: 'Merci, votre soutien compte pour nous. Pouvez-vous nous rejoindre ici ?',
          bg: 'bg-pink-50',
          border: 'border-pink-200',
          text_color: 'text-pink-800',
          button_bg: 'bg-pink-600',
          button_hover: 'hover:bg-pink-700'
        };
      default:
        return {
          icon: '🎁',
          name: 'Récompense',
          message: 'Merci pour votre avis !',
          bg: 'bg-teal-50',
          border: 'border-teal-200',
          text_color: 'text-teal-800',
          button_bg: 'bg-teal-600',
          button_hover: 'hover:bg-teal-700'
        };
    }
  };

  const handleOpenSocial = () => {
    if (redirectUrl) {
      window.open(redirectUrl, '_blank');
      setHasClickedSocial(true);
    }
  };

  const handleLaunchWheel = () => {
    // Redirect to wheel/spin page (to be created)
    router.push(`/spin/${shopId}`);
  };

  if (!isClient || !merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-600 to-teal-700">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  const hasBackground = merchant.background_url;
  const strategyInfo = getStrategyInfo();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image with Overlay */}
      {hasBackground ? (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${merchant.background_url})` }}
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600 to-teal-700"></div>
      )}

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        {merchant.logo_url && (
          <div className="flex justify-center mb-8">
            <img 
              src={merchant.logo_url} 
              alt={merchant.business_name} 
              className="h-40 object-contain drop-shadow-lg" 
            />
          </div>
        )}

        {/* Redirect Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="w-6 h-6 text-teal-600 fill-teal-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Merci pour votre avis !
            </h1>
          </div>

          <p className="text-center text-gray-600 mb-6">
            Votre avis compte énormément pour nous
          </p>

          {/* Strategy Message Card */}
          <div className={`${strategyInfo.bg} ${strategyInfo.border} border-2 rounded-xl p-6 mb-6`}>
            <div className="text-center mb-4">
              <span className="text-6xl mb-3 block">{strategyInfo.icon}</span>
              <h2 className={`text-xl font-bold ${strategyInfo.text_color} mb-2`}>
                {strategyInfo.name}
              </h2>
            </div>
            <p className={`text-sm font-medium ${strategyInfo.text_color} text-center leading-relaxed`}>
              {strategyInfo.message}
            </p>
          </div>

          {/* Button Flow */}
          {!hasClickedSocial ? (
            <div className="space-y-3">
              <Button
                onClick={handleOpenSocial}
                className={`w-full ${strategyInfo.button_bg} ${strategyInfo.button_hover} text-white py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2`}
              >
                <ExternalLink className="w-5 h-5" />
                Déposer mon avis sur {strategyInfo.name}
              </Button>
              <p className="text-xs text-center text-gray-500">
                Cliquez pour ouvrir {strategyInfo.name} et laisser votre avis
              </p>
            </div>
          ) : !canProceed ? (
            <div className="text-center space-y-4">
              <div className="relative">
                <Button
                  disabled
                  className="w-full bg-gray-300 text-gray-500 cursor-not-allowed py-3 rounded-xl font-semibold"
                >
                  J'ai fait
                </Button>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white/90 rounded-full w-12 h-12 flex items-center justify-center shadow-lg">
                    <span className="text-2xl font-bold text-teal-600">{countdown}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Le bouton sera actif dans {countdown} seconde{countdown > 1 ? 's' : ''}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={handleLaunchWheel}
                className={`w-full ${strategyInfo.button_bg} ${strategyInfo.button_hover} text-white py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2`}
              >
                <ExternalLink className="w-5 h-5" />
                J'ai fait - Lancer la roue
              </Button>
              <p className="text-xs text-center text-gray-500">
                Cliquez pour tourner la roue et gagner !
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
