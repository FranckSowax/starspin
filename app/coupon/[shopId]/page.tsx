'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import QRCode from 'qrcode';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/config';

export default function CouponPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const shopId = params.shopId as string;
  const code = searchParams.get('code');

  const [coupon, setCoupon] = useState<any>(null);
  const [merchant, setMerchant] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const { data: couponData } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code)
        .single();

      const { data: merchantData } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', shopId)
        .single();

      setCoupon(couponData);
      setMerchant(merchantData);

      if (code) {
        const qr = await QRCode.toDataURL(code);
        setQrCodeUrl(qr);
      }
    };

    fetchData();
  }, [shopId, code]);

  useEffect(() => {
    if (!coupon) return;

    const updateTimer = () => {
      const now = new Date();
      const expires = new Date(coupon.expires_at);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft(t('coupon.expired'));
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [coupon, t]);

  if (!coupon || !merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#38A169] to-[#2F855A] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        {merchant.logo_url && (
          <div className="flex justify-center mb-6">
            <img src={merchant.logo_url} alt={merchant.business_name} className="h-20 object-contain" />
          </div>
        )}

        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          {t('wheel.congratulations')}
        </h1>

        <p className="text-center text-xl text-gray-700 mb-6">
          {t('wheel.youWon')}: <span className="font-bold text-[#38A169]">{coupon.prize_name}</span>
        </p>

        <div className="bg-gray-50 rounded-2xl p-6 mb-6">
          <p className="text-sm text-gray-600 text-center mb-2">{t('coupon.code')}</p>
          <p className="text-3xl font-mono font-bold text-center text-gray-900 mb-4">
            {coupon.code}
          </p>

          {qrCodeUrl && (
            <div className="flex justify-center mb-4">
              <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">{t('coupon.expiresIn')}</p>
            <p className="text-2xl font-bold text-[#E53E3E]">{timeLeft}</p>
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center">{t('coupon.terms')}</p>
      </div>
    </div>
  );
}
