'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StarRating } from '@/components/molecules/StarRating';
import { Button } from '@/components/atoms/Button';
import { supabase } from '@/lib/supabase/client';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/config';
import { Star, Mail } from 'lucide-react';

export default function RatingPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const shopId = params.shopId as string;

  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [merchant, setMerchant] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [emailError, setEmailError] = useState('');

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
      }
    };

    fetchMerchant();
  }, [shopId]);

  const handleRating = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleFeedbackSubmit = async () => {
    if (!rating) return;

    // Validate email
    if (!email.trim()) {
      setEmailError('L\'email est obligatoire');
      return;
    }
    if (!validateEmail(email)) {
      setEmailError('Veuillez entrer un email valide');
      return;
    }

    setEmailError('');
    setLoading(true);

    const userToken = localStorage.getItem('user_token') || crypto.randomUUID();
    localStorage.setItem('user_token', userToken);

    const { error } = await supabase.from('feedback').insert({
      merchant_id: shopId,
      rating,
      comment: feedback,
      customer_email: email,
      is_positive: rating >= 4,
      user_token: userToken,
    });

    setLoading(false);

    if (!error) {
      if (rating >= 4) {
        // Get current day of week (0 = Sunday, 1 = Monday, etc.)
        const today = new Date().getDay();
        // Convert to Monday-based index (0 = Monday, 6 = Sunday)
        const dayIndex = today === 0 ? 6 : today - 1;
        
        // Get weekly schedule if available
        let strategy = 'google_maps';
        if (merchant.weekly_schedule) {
          try {
            const schedule = JSON.parse(merchant.weekly_schedule);
            if (Array.isArray(schedule) && schedule.length === 7) {
              strategy = schedule[dayIndex];
            }
          } catch (e) {
            console.error('Error parsing weekly schedule:', e);
            strategy = merchant.redirect_strategy || 'google_maps';
          }
        } else {
          strategy = merchant.redirect_strategy || 'google_maps';
        }
        
        let redirectUrl = '';

        switch (strategy) {
          case 'google_maps':
            redirectUrl = merchant.google_maps_url;
            break;
          case 'tripadvisor':
            redirectUrl = merchant.tripadvisor_url;
            break;
          case 'tiktok':
            redirectUrl = merchant.tiktok_url;
            break;
          case 'instagram':
            redirectUrl = merchant.instagram_url;
            break;
          case 'none':
            redirectUrl = '';
            break;
        }

        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          // Fallback to social page if no URL configured
          router.push(`/social/${shopId}`);
        }
      } else {
        alert(t('feedback.thankYou'));
        setRating(null);
        setFeedback('');
        setEmail('');
      }
    }
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
            <div className="bg-white rounded-2xl p-4 shadow-2xl">
              <img src={merchant.logo_url} alt={merchant.business_name} className="h-20 object-contain" />
            </div>
          </div>
        )}

        {/* Rating Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="w-6 h-6 text-teal-600 fill-teal-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              {merchant.business_name || merchant.name}
            </h1>
          </div>

          <p className="text-center text-gray-600 mb-8">{t('rating.subtitle')}</p>

          {!rating ? (
            <div>
              <h2 className="text-xl font-semibold text-center mb-6 text-gray-900">{t('rating.title')}</h2>
              <StarRating onRate={handleRating} />
            </div>
          ) : rating < 4 ? (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-center text-gray-900">{t('feedback.title')}</h2>
              
              {/* Email Field */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Mail className="w-4 h-4 text-teal-600" />
                  Votre email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError('');
                    }}
                    placeholder="exemple@email.com"
                    className={`w-full p-4 pl-11 border-2 ${
                      emailError ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-teal-500'
                    } rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                    required
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                {emailError && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    {emailError}
                  </p>
                )}
              </div>

              {/* Feedback Textarea */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Votre commentaire (optionnel)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={t('feedback.placeholder')}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[100px] transition-all"
                />
              </div>

              <Button
                onClick={handleFeedbackSubmit}
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                {loading ? t('common.loading') : t('common.submit')}
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-center text-gray-900">{t('social.title')}</h2>
              <p className="text-center text-gray-600">{t('social.subtitle')}</p>
              
              {/* Email Field for positive ratings */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Mail className="w-4 h-4 text-teal-600" />
                  Votre email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError('');
                    }}
                    placeholder="exemple@email.com"
                    className={`w-full p-4 pl-11 border-2 ${
                      emailError ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-teal-500'
                    } rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                    required
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                {emailError && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    {emailError}
                  </p>
                )}
              </div>

              <Button
                onClick={handleFeedbackSubmit}
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                {loading ? t('common.loading') : t('common.submit')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
