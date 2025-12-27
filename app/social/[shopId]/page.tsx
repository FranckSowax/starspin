'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import { supabase } from '@/lib/supabase/client';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/config';

export default function SocialPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const shopId = params.shopId as string;

  const [merchant, setMerchant] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchMerchant = async () => {
      const { data } = await supabase
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

  const handleDone = () => {
    router.push(`/spin/${shopId}`);
  };

  if (!isClient || !merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4CAF50] to-[#2196F3]">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <p className="text-lg text-gray-900">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4CAF50] to-[#2196F3] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        {merchant.logo_url && (
          <div className="flex justify-center mb-6">
            <img src={merchant.logo_url} alt={merchant.business_name} className="h-20 object-contain" />
          </div>
        )}

        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          {t('social.title')}
        </h1>

        <div className="space-y-4">
          {merchant.google_review_link && (
            <a
              href={merchant.google_review_link}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button variant="primary" className="w-full">
                ⭐ {t('social.googleReview')}
              </Button>
            </a>
          )}

          {merchant.instagram_handle && (
            <a
              href={`https://instagram.com/${merchant.instagram_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button variant="secondary" className="w-full">
                📸 {t('social.followInstagram')}
              </Button>
            </a>
          )}

          {merchant.tiktok_handle && (
            <a
              href={`https://tiktok.com/@${merchant.tiktok_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button variant="secondary" className="w-full">
                🎵 {t('social.followTikTok')}
              </Button>
            </a>
          )}

          <div className="pt-4">
            <Button onClick={handleDone} variant="outline" className="w-full">
              {t('common.done')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
