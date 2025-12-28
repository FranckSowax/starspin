'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import i18n from '@/lib/i18n/config';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧', nativeName: 'English' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺', nativeName: 'Русский' },
  { code: 'fr', name: 'French', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'th', name: 'Thai', flag: '🇹🇭', nativeName: 'ไทย' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳', nativeName: '中文' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦', nativeName: 'العربية' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
];

export default function SelectLanguagePage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params.shopId as string;
  const [merchant, setMerchant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMerchant = async () => {
      const { data, error } = await supabase
        .from('merchants')
        .select('business_name, logo_url, background_url')
        .eq('id', shopId)
        .single();

      if (!error && data) {
        setMerchant(data);
      }
      setLoading(false);
    };

    fetchMerchant();
  }, [shopId]);

  const handleLanguageSelect = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('i18nextLng', langCode);
    router.push(`/rate/${shopId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-600 to-teal-700">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  const hasBackground = merchant?.background_url;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      {hasBackground ? (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${merchant.background_url})` }}
          />
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600 to-teal-700"></div>
      )}

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg">
        {/* Logo */}
        {merchant?.logo_url && (
          <div className="flex justify-center mb-8">
            <img 
              src={merchant.logo_url} 
              alt={merchant.business_name} 
              className="h-24 object-contain drop-shadow-lg" 
            />
          </div>
        )}

        {/* Language Selection Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Globe className="w-8 h-8 text-teal-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Select Your Language
            </h1>
          </div>

          <p className="text-center text-gray-600 mb-8">
            Choisissez votre langue / เลือกภาษาของคุณ
          </p>

          {/* Language Grid */}
          <div className="grid grid-cols-2 gap-3">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-teal-500 hover:bg-teal-50 transition-all duration-200 group"
              >
                <span className="text-3xl">{lang.flag}</span>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 group-hover:text-teal-700">
                    {lang.nativeName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {lang.name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Merchant Name */}
        {merchant?.business_name && (
          <p className="text-center text-white/80 mt-6 text-sm">
            {merchant.business_name}
          </p>
        )}
      </div>
    </div>
  );
}
