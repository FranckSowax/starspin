'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StarRating } from '@/components/molecules/StarRating';
import { Button } from '@/components/atoms/Button';
import { supabase } from '@/lib/supabase/client';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/config';
import { Star } from 'lucide-react';

export default function RatingPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const shopId = params.shopId as string;

  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [merchant, setMerchant] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

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

  const handleFeedbackSubmit = async () => {
    if (!rating) return;

    setLoading(true);

    const userToken = localStorage.getItem('user_token') || crypto.randomUUID();
    localStorage.setItem('user_token', userToken);

    const { error } = await supabase.from('feedback').insert({
      merchant_id: shopId,
      rating,
      comment: feedback,
      is_positive: rating >= 4,
      user_token: userToken,
    });

    setLoading(false);

    if (!error) {
      if (rating >= 4) {
        router.push(`/social/${shopId}`);
      } else {
        alert(t('feedback.thankYou'));
        setRating(null);
        setFeedback('');
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
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-center text-gray-900">{t('feedback.title')}</h2>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={t('feedback.placeholder')}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[120px] transition-all"
              />
              <Button
                onClick={handleFeedbackSubmit}
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-semibold transition-all"
              >
                {loading ? t('common.loading') : t('common.submit')}
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <div className="mb-4 p-4 bg-teal-50 rounded-xl">
                <p className="text-lg text-gray-900 font-semibold">{t('social.title')}</p>
              </div>
              <Button 
                onClick={handleFeedbackSubmit} 
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-semibold transition-all"
              >
                {t('common.done')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
