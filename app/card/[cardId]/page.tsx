'use client';

import { useState, useEffect, useCallback, use, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n/config';
import {
  Award,
  Star,
  Gift,
  QrCode,
  History,
  Loader2,
  AlertCircle,
  Calendar,
  TrendingUp,
  ExternalLink,
  CheckCircle,
  Download,
  Phone,
  Mail,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import QRCode from 'react-qr-code';
import type { LoyaltyClient, LoyaltyReward, PointsTransaction, Merchant } from '@/lib/types/database';

// Available languages
const LANGUAGES = [
  { code: 'fr', flag: '🇫🇷', name: 'Français' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'th', flag: '🇹🇭', name: 'ไทย' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'pt', flag: '🇵🇹', name: 'Português' }
];

// Apple Wallet Icon SVG
const AppleWalletIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="20" height="16" rx="2" fill="#000000"/>
    <rect x="2" y="4" width="20" height="4" fill="#FF3B30"/>
    <rect x="2" y="8" width="20" height="4" fill="#FF9500"/>
    <rect x="2" y="12" width="20" height="4" fill="#34C759"/>
    <rect x="2" y="16" width="20" height="4" rx="0 0 2 2" fill="#007AFF"/>
  </svg>
);

// Google Wallet Icon SVG
const GoogleWalletIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#4285F4"/>
    <path d="M12 2C6.48 2 2 6.48 2 12c0 2.76 1.12 5.26 2.93 7.07L12 12V2z" fill="#EA4335"/>
    <path d="M2 12c0 2.76 1.12 5.26 2.93 7.07L12 12H2z" fill="#FBBC05"/>
    <path d="M12 12l-7.07 7.07C6.74 20.88 9.24 22 12 22c5.52 0 10-4.48 10-10H12z" fill="#34A853"/>
    <circle cx="12" cy="12" r="4" fill="white"/>
  </svg>
);

interface WalletStatus {
  apple: { configured: boolean; loading: boolean; added: boolean };
  google: { configured: boolean; loading: boolean; added: boolean };
}

interface PageProps {
  params: Promise<{ cardId: string }>;
}

export default function LoyaltyCardPage({ params }: PageProps) {
  const { cardId } = use(params);
  const { t } = useTranslation();
  const [client, setClient] = useState<LoyaltyClient | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'card' | 'rewards' | 'history'>('card');
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [walletStatus, setWalletStatus] = useState<WalletStatus>({
    apple: { configured: false, loading: false, added: false },
    google: { configured: false, loading: false, added: false }
  });
  const [downloading, setDownloading] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [currentLang, setCurrentLang] = useState(i18n.language || 'fr');
  const qrRef = useRef<HTMLDivElement>(null);

  // Change language function
  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setCurrentLang(langCode);
    setShowLanguageMenu(false);
  };

  const fetchData = useCallback(async () => {
    try {
      const clientRes = await fetch(`/api/loyalty/client?qrCode=${cardId}`);
      if (!clientRes.ok) {
        setError('Card not found');
        setLoading(false);
        return;
      }
      const clientData = await clientRes.json();
      setClient(clientData.client);

      // Apply client's preferred language
      if (clientData.client?.preferred_language) {
        const clientLang = clientData.client.preferred_language;
        if (LANGUAGES.some(l => l.code === clientLang)) {
          i18n.changeLanguage(clientLang);
          setCurrentLang(clientLang);
        }
      }

      if (clientData.merchant) {
        setMerchant(clientData.merchant);
      }

      if (clientData.client?.merchant_id) {
        if (!clientData.merchant) {
          const merchantRes = await fetch(`/api/merchant?id=${clientData.client.merchant_id}`);
          if (merchantRes.ok) {
            const merchantData = await merchantRes.json();
            setMerchant(merchantData.merchant);
          }
        }

        const rewardsRes = await fetch(`/api/loyalty/rewards?merchantId=${clientData.client.merchant_id}`);
        if (rewardsRes.ok) {
          const rewardsData = await rewardsRes.json();
          setRewards(rewardsData.rewards?.filter((r: LoyaltyReward) => r.is_active) || []);
        }

        const transactionsRes = await fetch(`/api/loyalty/points?clientId=${clientData.client.id}`);
        if (transactionsRes.ok) {
          const transactionsData = await transactionsRes.json();
          setTransactions(transactionsData.transactions || []);
        }
      }
    } catch {
      setError('Failed to load card data');
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const checkWalletStatus = async () => {
      if (!cardId) return;
      try {
        const appleRes = await fetch(`/api/loyalty/wallet/apple?clientId=${cardId}`);
        if (appleRes.ok) {
          const data = await appleRes.json();
          setWalletStatus(prev => ({
            ...prev,
            apple: { ...prev.apple, configured: data.configured || false }
          }));
        }
      } catch { /* ignore */ }

      try {
        const googleRes = await fetch(`/api/loyalty/wallet/google?clientId=${cardId}`);
        if (googleRes.ok) {
          const data = await googleRes.json();
          setWalletStatus(prev => ({
            ...prev,
            google: { ...prev.google, configured: data.configured || false }
          }));
        }
      } catch { /* ignore */ }
    };
    checkWalletStatus();
  }, [cardId]);

  const handleAddToAppleWallet = async () => {
    setWalletStatus(prev => ({ ...prev, apple: { ...prev.apple, loading: true } }));
    try {
      const res = await fetch(`/api/loyalty/wallet/apple?clientId=${cardId}`);
      const data = await res.json();
      alert(data.configured ? t('loyalty.wallet.appleComingSoon') : t('loyalty.wallet.notConfigured'));
    } catch {
      alert(t('loyalty.wallet.error'));
    } finally {
      setWalletStatus(prev => ({ ...prev, apple: { ...prev.apple, loading: false } }));
    }
  };

  const handleAddToGoogleWallet = async () => {
    setWalletStatus(prev => ({ ...prev, google: { ...prev.google, loading: true } }));
    try {
      const res = await fetch(`/api/loyalty/wallet/google?clientId=${cardId}`);
      const data = await res.json();
      alert(data.configured ? t('loyalty.wallet.googleComingSoon') : t('loyalty.wallet.notConfigured'));
    } catch {
      alert(t('loyalty.wallet.error'));
    } finally {
      setWalletStatus(prev => ({ ...prev, google: { ...prev.google, loading: false } }));
    }
  };

  const handleRedeem = async (reward: LoyaltyReward) => {
    if (!client || !merchant) return;
    if (client.points < reward.points_cost) return;

    setRedeeming(reward.id);
    try {
      const res = await fetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          merchantId: merchant.id,
          rewardId: reward.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        alert(`${t('loyalty.redeem.success')}\n\n${t('loyalty.redeem.code')}: ${data.redemptionCode}\n\n${t('loyalty.redeem.showToStaff')}`);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to redeem reward');
      }
    } catch {
      alert('An error occurred');
    } finally {
      setRedeeming(null);
    }
  };

  // Generate card image with Canvas
  const handleDownloadCard = async () => {
    if (!client || !qrRef.current) return;

    const shopName = merchant?.business_name || 'StarSpin';
    setDownloading(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      // Card dimensions (credit card ratio ~1.586)
      const width = 800;
      const height = 500;
      canvas.width = width;
      canvas.height = height;

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#f59e0b');
      gradient.addColorStop(1, '#ea580c');
      ctx.fillStyle = gradient;
      ctx.roundRect(0, 0, width, height, 24);
      ctx.fill();

      // Shop name header
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${shopName} Card`, 40, 60);

      // Loyalty Card subtitle
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '18px system-ui, -apple-system, sans-serif';
      ctx.fillText(t('loyalty.card.title'), 40, 90);

      // White card area
      ctx.fillStyle = '#ffffff';
      ctx.roundRect(30, 120, width - 60, height - 150, 16);
      ctx.fill();

      // Client name
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
      ctx.fillText(client.name || t('dashboard.recentReviews.anonymous'), 50, 160);

      // Card ID
      ctx.fillStyle = '#64748b';
      ctx.font = '16px monospace';
      ctx.fillText(client.card_id, 50, 185);

      // Contact (phone or email)
      const contactInfo = client.phone || client.email;
      if (contactInfo) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px system-ui, -apple-system, sans-serif';
        const contactLabel = client.phone ? '📱 ' : '✉️ ';
        ctx.fillText(contactLabel + contactInfo, 50, 210);
      }

      // Points section
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
      const pointsText = `${client.points}`;
      ctx.fillText(pointsText, 50, contactInfo ? 280 : 260);

      const pointsY = contactInfo ? 280 : 260;
      ctx.fillStyle = '#64748b';
      ctx.font = '20px system-ui, -apple-system, sans-serif';
      ctx.fillText('points', 50 + ctx.measureText(pointsText).width + 10, pointsY);

      // Stats
      ctx.fillStyle = '#64748b';
      ctx.font = '14px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${client.total_purchases || 0} achats`, 50, pointsY + 40);

      const memberDate = client.created_at ? new Date(client.created_at).toLocaleDateString('fr-FR') : '-';
      ctx.fillText(`Membre depuis: ${memberDate}`, 50, pointsY + 65);

      // QR Code - get SVG from the ref and draw it
      const svgElement = qrRef.current.querySelector('svg');
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);

        const qrImage = new Image();
        await new Promise<void>((resolve, reject) => {
          qrImage.onload = () => resolve();
          qrImage.onerror = reject;
          qrImage.src = svgUrl;
        });

        // Draw QR code on right side
        const qrSize = 200;
        const qrX = width - qrSize - 60;
        const qrY = 150;

        // White background for QR
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);

        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
        URL.revokeObjectURL(svgUrl);

        // QR code label
        ctx.fillStyle = '#64748b';
        ctx.font = '12px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Scannez pour gagner des points', qrX + qrSize / 2, qrY + qrSize + 30);
        ctx.textAlign = 'left';
      }

      // Footer
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '12px system-ui, -apple-system, sans-serif';
      ctx.fillText('Powered by StarSpin', 40, height - 15);

      // Download as JPG
      const link = document.createElement('a');
      link.download = `${shopName.replace(/\s+/g, '_')}_card_${client.card_id}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
    } catch (err) {
      console.error('Download error:', err);
      alert(t('loyalty.card.downloadError') || 'Failed to download card image');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Card Not Found</h1>
          <p className="text-slate-600">This loyalty card does not exist or has been deactivated.</p>
        </div>
      </div>
    );
  }

  const cardImageUrl = merchant?.loyalty_card_image_url || merchant?.background_url;
  const shopName = merchant?.business_name || 'StarSpin';
  const logoBackgroundColor = merchant?.logo_background_color || '#FFFFFF';

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Desktop Layout Container */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {merchant?.logo_url && (
              <div
                className="w-16 h-16 rounded-full border-4 border-[#ffd700] flex items-center justify-center shadow-lg"
                style={{ backgroundColor: logoBackgroundColor }}
              >
                <img
                  src={merchant.logo_url}
                  alt={shopName}
                  className="w-12 h-12 object-contain rounded-full"
                />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{shopName} Card</h1>
              <p className="text-slate-600">{t('loyalty.card.title')}</p>
            </div>
          </div>

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="flex items-center gap-2 px-3 py-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all border border-slate-200"
            >
              <Globe className="w-4 h-4 text-slate-500" />
              <span className="text-lg">{LANGUAGES.find(l => l.code === currentLang)?.flag || '🇬🇧'}</span>
              <span className="text-sm font-medium text-slate-700 hidden sm:inline">
                {currentLang.toUpperCase()}
              </span>
            </button>

            {showLanguageMenu && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 min-w-[160px]">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-amber-50 transition-colors ${
                      currentLang === lang.code ? 'bg-amber-100 text-amber-700' : 'text-slate-700'
                    }`}
                  >
                    <span className="text-xl">{lang.flag}</span>
                    <span className="font-medium">{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Grid - Desktop: 2 columns, Mobile: 1 column */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Card Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Card Header with Background Image */}
              {cardImageUrl ? (
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={cardImageUrl}
                    alt={shopName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-6 text-white">
                    <p className="text-sm opacity-80">{client.name || t('dashboard.recentReviews.anonymous')}</p>
                    <p className="font-mono text-lg">{client.card_id}</p>
                    {(client.phone || client.email) && (
                      <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
                        {client.phone ? (
                          <>
                            <Phone className="w-3 h-3" />
                            <span>{client.phone}</span>
                          </>
                        ) : (
                          <>
                            <Mail className="w-3 h-3" />
                            <span>{client.email}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <Award className="absolute bottom-4 right-6 w-10 h-10 text-white/80" />
                </div>
              ) : (
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-amber-100 text-sm mb-1">{client.name || t('dashboard.recentReviews.anonymous')}</p>
                      <p className="font-mono text-lg">{client.card_id}</p>
                      {(client.phone || client.email) && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-amber-200">
                          {client.phone ? (
                            <>
                              <Phone className="w-3 h-3" />
                              <span>{client.phone}</span>
                            </>
                          ) : (
                            <>
                              <Mail className="w-3 h-3" />
                              <span>{client.email}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <Award className="w-10 h-10 text-white/80" />
                  </div>
                </div>
              )}

              {/* Points and Stats */}
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  {/* Points */}
                  <div className="text-center md:text-left">
                    <p className="text-slate-600 text-sm mb-1">{t('loyalty.card.balance')}</p>
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <Star className="w-10 h-10 text-amber-500" />
                      <span className="text-5xl font-bold text-slate-900">{client.points}</span>
                      <span className="text-slate-600 text-lg">{t('loyalty.clients.points')}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                      <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
                      <p className="text-2xl font-semibold text-slate-900">{client.total_purchases || 0}</p>
                      <p className="text-xs text-slate-600">Purchases</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                      <Calendar className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-900">
                        {client.created_at ? new Date(client.created_at).toLocaleDateString() : '-'}
                      </p>
                      <p className="text-xs text-slate-600">{t('loyalty.card.memberSince')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-t border-slate-200">
                <div className="flex">
                  {[
                    { id: 'card' as const, icon: QrCode, label: 'QR Code' },
                    { id: 'rewards' as const, icon: Gift, label: t('loyalty.rewards.title') },
                    { id: 'history' as const, icon: History, label: t('loyalty.clients.history') }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                        activeTab === tab.id
                          ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50/50'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'card' && (
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    {/* QR Code */}
                    <div className="text-center">
                      <div ref={qrRef} className="bg-white p-4 rounded-2xl shadow-inner inline-block border border-slate-100">
                        <QRCode value={client.qr_code_data} size={200} />
                      </div>
                      <p className="mt-3 text-slate-600 text-sm">{t('loyalty.card.scanToEarn')}</p>
                      <p className="mt-1 font-mono text-slate-400 text-xs">{client.qr_code_data.substring(0, 18)}...</p>
                    </div>

                    {/* Actions */}
                    <div className="flex-1 space-y-3 w-full md:max-w-xs">
                      <Button
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                        onClick={handleDownloadCard}
                        disabled={downloading}
                      >
                        {downloading ? (
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                          <Download className="w-5 h-5 mr-2" />
                        )}
                        {t('loyalty.card.download')}
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full bg-white hover:bg-gray-50 text-gray-800 border-gray-300"
                        onClick={handleAddToAppleWallet}
                        disabled={walletStatus.apple.loading}
                      >
                        {walletStatus.apple.loading ? (
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : walletStatus.apple.added ? (
                          <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                        ) : (
                          <AppleWalletIcon className="w-6 h-6 mr-2" />
                        )}
                        {t('loyalty.card.appleWallet')}
                        <span className="ml-2 text-xs text-gray-400">(Beta)</span>
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full bg-white hover:bg-gray-50 text-gray-800 border-gray-300"
                        onClick={handleAddToGoogleWallet}
                        disabled={walletStatus.google.loading}
                      >
                        {walletStatus.google.loading ? (
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : walletStatus.google.added ? (
                          <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                        ) : (
                          <GoogleWalletIcon className="w-6 h-6 mr-2" />
                        )}
                        {t('loyalty.card.googleWallet')}
                        <span className="ml-2 text-xs text-gray-400">(Beta)</span>
                      </Button>

                      <Button
                        variant="ghost"
                        className="w-full text-amber-600"
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: t('loyalty.card.shareTitle'),
                              text: t('loyalty.card.shareText'),
                              url: window.location.href
                            }).catch(() => {});
                          } else {
                            navigator.clipboard.writeText(window.location.href);
                            alert(t('loyalty.card.linkCopied'));
                          }
                        }}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {t('loyalty.card.share')}
                      </Button>
                    </div>
                  </div>
                )}

                {activeTab === 'rewards' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rewards.length === 0 ? (
                      <div className="col-span-full text-center py-12">
                        <Gift className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600">{t('loyalty.rewards.noRewards')}</p>
                      </div>
                    ) : (
                      rewards.map((reward) => {
                        const canRedeem = client.points >= reward.points_cost;
                        return (
                          <div
                            key={reward.id}
                            className={`border rounded-xl p-4 transition-all ${
                              canRedeem ? 'border-amber-200 bg-amber-50/50 hover:shadow-md' : 'border-slate-200'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-semibold text-slate-900">{reward.name}</h3>
                                {reward.description && (
                                  <p className="text-sm text-slate-600 mt-1">{reward.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 bg-amber-100 px-3 py-1 rounded-full">
                                <Star className="w-4 h-4 text-amber-600" />
                                <span className="font-semibold text-amber-700">{reward.points_cost}</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center mt-4">
                              <span className={`text-sm font-medium ${
                                reward.type === 'discount' ? 'text-blue-600' :
                                reward.type === 'product' ? 'text-green-600' :
                                reward.type === 'service' ? 'text-purple-600' :
                                'text-amber-600'
                              }`}>
                                {reward.value}
                              </span>
                              <Button
                                size="sm"
                                onClick={() => handleRedeem(reward)}
                                disabled={!canRedeem || redeeming === reward.id}
                                className={canRedeem ? 'bg-amber-500 hover:bg-amber-600' : ''}
                              >
                                {redeeming === reward.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : canRedeem ? (
                                  t('loyalty.redeem.confirm')
                                ) : (
                                  t('loyalty.redeem.insufficientPoints')
                                )}
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="space-y-2">
                    {transactions.length === 0 ? (
                      <div className="text-center py-12">
                        <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600">{t('loyalty.transactions.noTransactions')}</p>
                      </div>
                    ) : (
                      transactions.slice(0, 20).map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              tx.points > 0 ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {tx.points > 0 ? (
                                <TrendingUp className="w-5 h-5 text-green-600" />
                              ) : (
                                <Gift className="w-5 h-5 text-red-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">
                                {t(`loyalty.transactions.${tx.type}`)}
                              </p>
                              <p className="text-sm text-slate-500">
                                {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : '-'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-semibold ${tx.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.points > 0 ? '+' : ''}{tx.points}
                            </p>
                            <p className="text-sm text-slate-500">
                              Balance: {tx.balance_after}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Quick Info (Desktop only) */}
          <div className="hidden lg:block space-y-6">
            {/* Quick Stats Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Points Balance</span>
                  <span className="font-bold text-amber-600">{client.points}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Total Purchases</span>
                  <span className="font-bold text-slate-900">{client.total_purchases || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Available Rewards</span>
                  <span className="font-bold text-slate-900">
                    {rewards.filter(r => client.points >= r.points_cost).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Next Reward Progress */}
            {rewards.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Next Reward</h3>
                {(() => {
                  const nextReward = rewards
                    .filter(r => r.points_cost > client.points)
                    .sort((a, b) => a.points_cost - b.points_cost)[0];

                  if (!nextReward) {
                    return (
                      <p className="text-green-600 font-medium">
                        You can redeem all available rewards!
                      </p>
                    );
                  }

                  const progress = (client.points / nextReward.points_cost) * 100;
                  const pointsNeeded = nextReward.points_cost - client.points;

                  return (
                    <div>
                      <p className="font-medium text-slate-900 mb-2">{nextReward.name}</p>
                      <div className="w-full bg-slate-200 rounded-full h-3 mb-2">
                        <div
                          className="bg-amber-500 h-3 rounded-full transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <p className="text-sm text-slate-600">
                        {pointsNeeded} more points needed
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">Powered by StarSpin</p>
        </div>
      </div>
    </div>
  );
}
