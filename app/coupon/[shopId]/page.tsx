'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import QRCode from 'qrcode';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n/config';

function CouponContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const shopId = params.shopId as string;
  const code = searchParams.get('code');
  const langFromUrl = searchParams.get('lang');

  const [coupon, setCoupon] = useState<any>(null);
  const [merchant, setMerchant] = useState<any>(null);
  const [prizeImage, setPrizeImage] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [timeLeft, setTimeLeft] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    // Apply language from URL if provided
    if (langFromUrl && i18n.language !== langFromUrl) {
      i18n.changeLanguage(langFromUrl);
    }
  }, [langFromUrl]);

  useEffect(() => {
    if (!isClient) return;

    if (!shopId) {
      setError("Identifiant boutique manquant");
      setLoading(false);
      return;
    }
    
    if (!code) {
      setError("Code coupon manquant");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const { data: couponData, error: couponError } = await supabase
          .from('coupons')
          .select('*')
          .eq('code', code)
          .single();

        if (couponError) {
          setError('Erreur lors de la récupération du coupon');
          setLoading(false);
          return;
        }

        if (!couponData) {
          setError('Coupon introuvable');
          setLoading(false);
          return;
        }

        const { data: merchantData, error: merchantError } = await supabase
          .from('merchants')
          .select('*')
          .eq('id', shopId)
          .single();

        if (merchantError || !merchantData) {
          setError('Commerçant introuvable');
          setLoading(false);
          return;
        }

        setCoupon(couponData);
        setMerchant(merchantData);

        if (couponData?.spin_id) {
          const { data: spinData } = await supabase
            .from('spins')
            .select('prize_id')
            .eq('id', couponData.spin_id)
            .single();
          
          if (spinData?.prize_id) {
            const { data: prizeData } = await supabase
              .from('prizes')
              .select('image_url')
              .eq('id', spinData.prize_id)
              .single();
              
            if (prizeData?.image_url) {
              setPrizeImage(prizeData.image_url);
            }
          }
        }

        if (code) {
          try {
            const qr = await QRCode.toDataURL(code);
            setQrCodeUrl(qr);
          } catch {
            // QR code generation failed silently
          }
        }
      } catch (err: any) {
        setError(err.message || 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [shopId, code, isClient]);

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

  if (!isClient || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-[#ffd700]/30">
          <div className="w-12 h-12 border-4 border-[#ffd700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-[#ffd700] font-bold text-center">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !coupon || !merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md w-full border border-red-500/30 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">{t('common.error')}</h2>
          <p className="text-gray-300">{error || 'Impossible de charger le coupon'}</p>
          <p className="text-xs text-gray-500 mt-4">ID: {shopId} | Code: {code}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Russo+One&display=swap');
      `}</style>
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
        {/* Main Card */}
        <div className="relative z-10 w-full max-w-md bg-black/40 backdrop-blur-xl rounded-3xl p-8 border border-[#ffd700]/30 shadow-[0_0_50px_rgba(255,215,0,0.1)]">
          {merchant?.logo_url && (
            <div className="flex justify-center mb-8">
              <div
                className="w-24 h-24 rounded-full p-2 shadow-[0_0_20px_rgba(255,215,0,0.3)] flex items-center justify-center border-4 border-[#ffd700]"
                style={{ backgroundColor: merchant.logo_background_color || '#FFFFFF' }}
              >
                <img src={merchant.logo_url} alt={merchant.business_name} className="w-full h-full object-contain rounded-full" />
              </div>
            </div>
          )}

          <h1 className="text-3xl font-bold text-center text-[#ffd700] mb-2 font-['Russo_One'] tracking-wider" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            {t('wheel.congratulations')}
          </h1>

          <p className="text-center text-xl text-white mb-8">
            {t('wheel.youWon')}: <span className="font-bold text-[#ffd700] text-2xl block mt-2">{coupon.prize_name}</span>
          </p>

          {prizeImage && (
            <div className="flex justify-center mb-8">
              <div className="relative w-48 h-48 rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-4 border-[#ffd700]">
                <img 
                  src={prizeImage} 
                  alt={coupon.prize_name} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg transform rotate-1 hover:rotate-0 transition-transform duration-300">
            <p className="text-sm text-gray-500 text-center mb-2 uppercase tracking-widest font-bold">{t('coupon.code')}</p>
            <p className="text-3xl font-mono font-bold text-center text-black mb-6 tracking-wider border-b-2 border-dashed border-gray-200 pb-4">
              {coupon.code}
            </p>

            {qrCodeUrl && (
              <div className="flex flex-col items-center justify-center mb-4">
                <div className="p-2 bg-white rounded-lg shadow-inner">
                  <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 mix-blend-multiply" />
                </div>
                <p className="text-xs text-gray-400 mt-2">Scannez pour valider</p>
              </div>
            )}

            <div className="text-center mt-4 pt-4 border-t-2 border-dashed border-gray-200">
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-bold">{t('coupon.expiresIn')}</p>
              <p className="text-xl font-bold text-[#E53E3E] font-mono">{timeLeft}</p>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center opacity-70">
            {t('coupon.terms')}
          </p>
        </div>
      </div>
    </>
  );
}

export default function CouponPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-[#ffd700]/30">
          <div className="w-12 h-12 border-4 border-[#ffd700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        </div>
      </div>
    }>
      <CouponContent />
    </Suspense>
  );
}
