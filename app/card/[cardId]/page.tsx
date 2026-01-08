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
  Download,
  Phone,
  Mail,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import QRCode from 'react-qr-code';
import { jsPDF } from 'jspdf';
import QRCodeLib from 'qrcode';
import type { LoyaltyClient, LoyaltyReward, PointsTransaction, Merchant } from '@/lib/types/database';

// Available languages
const LANGUAGES = [
  { code: 'fr', flag: '🇫🇷', name: 'Français' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'th', flag: '🇹🇭', name: 'ไทย' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'pt', flag: '🇵🇹', name: 'Português' }
];

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

  // Generate PDF card
  const handleDownloadCard = async () => {
    if (!client) return;

    const shopName = merchant?.business_name || 'StarSpin';
    const cardImageUrl = merchant?.loyalty_card_image_url || merchant?.background_url;
    setDownloading(true);

    try {
      // Create PDF (A6 format for a card-like size)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [105, 148] // A6 size
      });

      const pageWidth = 105;
      const margin = 8;
      const headerHeight = 45;
      let contentY = headerHeight + 8;

      // Try to load the banner image
      let bannerLoaded = false;
      if (cardImageUrl) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject();
            img.src = cardImageUrl;
          });

          // Draw banner image with dark overlay baked in
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            // Add dark overlay directly on canvas for text visibility
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            const imgData = canvas.toDataURL('image/jpeg', 0.9);
            pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, headerHeight);
            bannerLoaded = true;
          }
        } catch {
          // If image fails to load, use default gradient
          bannerLoaded = false;
        }
      }

      // Fallback: amber gradient header
      if (!bannerLoaded) {
        pdf.setFillColor(245, 158, 11);
        pdf.rect(0, 0, pageWidth, headerHeight, 'F');
      }

      // Header text overlay
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(shopName, margin, 12);

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(t('loyalty.card.title'), margin, 19);

      // Client name on banner
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(client.name || t('dashboard.recentReviews.anonymous'), margin, 30);

      // Card ID
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(client.card_id, margin, 38);

      // Contact info on banner
      const contactInfo = client.phone || client.email;
      if (contactInfo) {
        pdf.setFontSize(8);
        const contactLabel = client.phone ? 'Tel: ' : 'Email: ';
        pdf.text(contactLabel + contactInfo, margin, 43);
      }

      // Stats box
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(margin, contentY, pageWidth - 2 * margin, 18, 2, 2, 'F');

      pdf.setTextColor(71, 85, 105);
      pdf.setFontSize(7);
      pdf.text(t('loyalty.card.purchases') || 'Achats', margin + 5, contentY + 5);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${client.total_purchases || 0}`, margin + 5, contentY + 12);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.text(t('loyalty.card.memberSince') || 'Membre depuis', margin + 35, contentY + 5);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      const memberDate = client.created_at
        ? new Date(client.created_at).toLocaleDateString('fr-FR')
        : new Date().toLocaleDateString('fr-FR');
      pdf.text(memberDate, margin + 35, contentY + 12);

      // QR Code section
      contentY += 24;
      pdf.setTextColor(71, 85, 105);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(t('loyalty.card.scanToEarn'), pageWidth / 2, contentY, { align: 'center' });

      // Generate QR code
      const qrDataUrl = await QRCodeLib.toDataURL(client.qr_code_data, {
        width: 200,
        margin: 1,
        color: { dark: '#000000', light: '#FFFFFF' }
      });

      const qrSize = 32;
      const qrX = (pageWidth - qrSize) / 2;
      pdf.addImage(qrDataUrl, 'PNG', qrX, contentY + 3, qrSize, qrSize);

      // Footer
      const footerY = contentY + qrSize + 10;
      pdf.setTextColor(148, 163, 184);
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Powered by StarSpin', pageWidth / 2, footerY, { align: 'center' });
      pdf.setFontSize(5);
      pdf.text(`starspin.netlify.app/card/${client.qr_code_data}`, pageWidth / 2, footerY + 3, { align: 'center' });

      // Download PDF
      pdf.save(`${shopName.replace(/\s+/g, '_')}_card_${client.card_id}.pdf`);
    } catch (err) {
      console.error('Download error:', err);
      alert(t('loyalty.card.downloadError') || 'Failed to download card');
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
