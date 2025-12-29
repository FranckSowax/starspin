'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StarRating } from '@/components/molecules/StarRating';
import { Button } from '@/components/atoms/Button';
import { supabase } from '@/lib/supabase/client';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n/config';
import { Star, Mail, Globe } from 'lucide-react';
import { ALL_LANGUAGES } from '@/components/ui/LanguageSwitcher';
import { feedbackSchema, sanitizeString, isValidUUID } from '@/lib/utils/validation';

export default function RatingPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const shopId = params.shopId as string;

  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [merchant, setMerchant] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchMerchant = async () => {
      try {
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
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setFetching(false);
      }
    };

    if (shopId) {
      fetchMerchant();
    } else {
      setFetching(false);
    }
  }, [shopId]);

  const handleRating = (selectedRating: number) => {
    setRating(selectedRating);
  };


  const handleFeedbackSubmit = async () => {
    if (!rating) return;

    // Validate shopId is a valid UUID
    if (!isValidUUID(shopId)) {
      console.error('Invalid shop ID');
      return;
    }

    // Get or create user token
    const userToken = localStorage.getItem('user_token') || crypto.randomUUID();
    localStorage.setItem('user_token', userToken);

    // Validate and sanitize all input data using Zod schema
    const validationResult = feedbackSchema.safeParse({
      merchant_id: shopId,
      rating,
      comment: feedback || undefined,
      customer_email: email,
      user_token: userToken,
    });

    if (!validationResult.success) {
      // Extract first error message
      const formErrors = validationResult.error.flatten().fieldErrors;
      if (formErrors.customer_email) {
        const emailErr = formErrors.customer_email[0];
        setEmailError(emailErr === 'Email requis' ? t('form.emailRequired') : t('form.emailInvalid'));
      } else {
        console.error('Validation errors:', validationResult.error.flatten());
      }
      return;
    }

    setEmailError('');
    setLoading(true);

    // Use sanitized data from validation
    const sanitizedData = validationResult.data;

    const { error } = await supabase.from('feedback').insert({
      merchant_id: sanitizedData.merchant_id,
      rating: sanitizedData.rating,
      comment: sanitizedData.comment ? sanitizeString(sanitizedData.comment, 2000) : null,
      customer_email: sanitizedData.customer_email,
      is_positive: sanitizedData.rating >= 4,
      user_token: sanitizedData.user_token,
    });

    setLoading(false);

    if (!error) {
      if (rating >= 4) {
        // Redirect to intermediate page for positive ratings
        router.push(`/redirect/${shopId}`);
      } else {
        alert(t('feedback.thankYou'));
        setRating(null);
        setFeedback('');
        setEmail('');
      }
    }
  };

  if (!isClient || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-600 to-teal-700">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-600 to-teal-700 p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Commerce introuvable</h1>
          <p className="text-gray-600 mb-6">Désolé, nous n'avons pas pu trouver ce commerce. Veuillez vérifier le lien.</p>
          <Button onClick={() => router.push('/')} className="w-full">
            Retour à l'accueil
          </Button>
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
            <img 
              src={merchant.logo_url} 
              alt={merchant.business_name} 
              className="h-40 object-contain drop-shadow-lg" 
            />
          </div>
        )}

        {/* Language Switcher */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => router.push(`/rate/${shopId}/select-language`)}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all backdrop-blur-sm"
          >
            <Globe className="w-4 h-4" />
            <span className="text-xl">{ALL_LANGUAGES.find(l => l.code === i18n.language)?.flag || '🇬🇧'}</span>
            <span className="text-sm font-medium">{i18n.language.toUpperCase()}</span>
          </button>
        </div>

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
                  {t('form.yourEmail')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError('');
                    }}
                    placeholder={t('form.emailPlaceholder')}
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
          ) : (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-center text-gray-900">{t('social.title')}</h2>
              <p className="text-center text-gray-600">{t('social.subtitle')}</p>
              
              {/* Email Field for positive ratings */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Mail className="w-4 h-4 text-teal-600" />
                  {t('form.yourEmail')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError('');
                    }}
                    placeholder={t('form.emailPlaceholder')}
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
