'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StarRating } from '@/components/molecules/StarRating';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { supabase } from '@/lib/supabase/client';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/config';

export default function RatingPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const shopId = params.shopId as string;

  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [merchant, setMerchant] = useState<any>(null);

  useEffect(() => {
    const fetchMerchant = async () => {
      const { data, error } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', shopId)
        .single();

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

  if (!merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF6F61] to-[#FFC107] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        {merchant.logo_url && (
          <div className="flex justify-center mb-6">
            <img src={merchant.logo_url} alt={merchant.business_name} className="h-20 object-contain" />
          </div>
        )}

        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          {merchant.business_name || merchant.name}
        </h1>

        <p className="text-center text-gray-600 mb-8">{t('rating.subtitle')}</p>

        {!rating ? (
          <div>
            <h2 className="text-xl font-semibold text-center mb-6">{t('rating.title')}</h2>
            <StarRating onRate={handleRating} />
          </div>
        ) : rating < 4 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">{t('feedback.title')}</h2>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={t('feedback.placeholder')}
              className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6F61] min-h-[120px]"
            />
            <Button
              onClick={handleFeedbackSubmit}
              disabled={loading}
              className="w-full"
            >
              {loading ? t('common.loading') : t('common.submit')}
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-lg mb-4">{t('social.title')}</p>
            <Button onClick={handleFeedbackSubmit} className="w-full">
              {t('common.done')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
