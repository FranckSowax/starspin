'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SpinWheel } from '@/components/organisms/SpinWheel';
import { supabase } from '@/lib/supabase/client';
import { Prize } from '@/lib/types/database';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/config';

export default function SpinPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const shopId = params.shopId as string;

  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [merchant, setMerchant] = useState<any>(null);
  const [hasSpun, setHasSpun] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSpinEligibility = async () => {
      const userToken = localStorage.getItem('user_token');
      
      if (userToken) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data } = await supabase
          .from('spins')
          .select('*')
          .eq('merchant_id', shopId)
          .eq('user_token', userToken)
          .gte('created_at', today.toISOString())
          .single();

        if (data) {
          setHasSpun(true);
        }
      }

      const { data: merchantData } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', shopId)
        .single();

      const { data: prizesData } = await supabase
        .from('prizes')
        .select('*')
        .eq('merchant_id', shopId);

      setMerchant(merchantData);
      setPrizes(prizesData || []);
      setLoading(false);
    };

    checkSpinEligibility();
  }, [shopId]);

  const handleSpinComplete = async (prize: Prize) => {
    const userToken = localStorage.getItem('user_token') || crypto.randomUUID();
    localStorage.setItem('user_token', userToken);

    const { data: spinData } = await supabase
      .from('spins')
      .insert({
        merchant_id: shopId,
        prize_id: prize.id,
        user_token: userToken,
      })
      .select()
      .single();

    if (spinData) {
      const couponCode = `${merchant.business_name?.substring(0, 3).toUpperCase()}-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await supabase.from('coupons').insert({
        spin_id: spinData.id,
        merchant_id: shopId,
        code: couponCode,
        prize_name: prize.name,
        expires_at: expiresAt.toISOString(),
      });

      router.push(`/coupon/${shopId}?code=${couponCode}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">{t('common.loading')}</p>
      </div>
    );
  }

  if (hasSpun) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#9C27B0] to-[#E91E63] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t('wheel.alreadySpun')}
          </h1>
          <p className="text-gray-600">{t('wheel.tryAgainTomorrow')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#9C27B0] to-[#E91E63] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
        {merchant?.logo_url && (
          <div className="flex justify-center mb-6">
            <img src={merchant.logo_url} alt={merchant.business_name} className="h-20 object-contain" />
          </div>
        )}

        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          {t('wheel.title')}
        </h1>

        {prizes.length > 0 ? (
          <SpinWheel prizes={prizes} onSpinComplete={handleSpinComplete} />
        ) : (
          <p className="text-center text-gray-600">{t('common.error')}</p>
        )}
      </div>
    </div>
  );
}
