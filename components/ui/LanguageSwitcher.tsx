'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/config';

interface Language {
  code: string;
  name: string;
  flag: string;
}

// Languages for landing page and dashboard (EN, TH, FR)
export const MAIN_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

// All languages for /rate page (EN, RU, FR, TH, ZH, AR, ES)
export const ALL_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

interface LanguageSwitcherProps {
  variant?: 'light' | 'dark';
  languages?: Language[];
  className?: string;
}

export function LanguageSwitcher({ 
  variant = 'light', 
  languages = MAIN_LANGUAGES,
  className = '' 
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  // Return a placeholder during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={`relative ${className}`}>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all ${
          variant === 'light' 
            ? 'bg-white/10 text-white border-white/20' 
            : 'bg-gray-100 text-gray-900 border-gray-200'
        }`}>
          <span className="text-xl">🇬🇧</span>
          <span className="text-sm font-medium hidden sm:inline">EN</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  }

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('i18nextLng', langCode);
    setIsOpen(false);
  };

  const baseButtonStyles = variant === 'light' 
    ? 'bg-white/10 hover:bg-white/20 text-white border-white/20' 
    : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-200';

  const dropdownStyles = variant === 'light'
    ? 'bg-white/95 backdrop-blur-xl border-white/20'
    : 'bg-white border-gray-200';

  const itemStyles = variant === 'light'
    ? 'hover:bg-gray-100 text-gray-900'
    : 'hover:bg-gray-100 text-gray-900';

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all ${baseButtonStyles}`}
      >
        <span className="text-xl">{currentLanguage.flag}</span>
        <span className="text-sm font-medium hidden sm:inline">{currentLanguage.code.toUpperCase()}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg border overflow-hidden z-50 ${dropdownStyles}`}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${itemStyles} ${
                lang.code === i18n.language ? 'bg-[#2D6A4F]/10' : ''
              }`}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="font-medium">{lang.name}</span>
              {lang.code === i18n.language && (
                <svg className="w-4 h-4 ml-auto text-[#2D6A4F]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;
