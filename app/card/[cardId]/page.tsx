'use client';

import { useState, useEffect, useCallback, use, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/config';
import {
  Award,
  Star,
  Gift,
  QrCode,
  History,
  ChevronRight,
  Loader2,
  AlertCircle,
  Wallet,
  Apple,
  Smartphone,
  Store,
  Calendar,
  TrendingUp,
  ExternalLink,
  CheckCircle,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import QRCode from 'react-qr-code';
import type { LoyaltyClient, LoyaltyReward, PointsTransaction, Merchant } from '@/lib/types/database';

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
  const cardRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    try {
      // Fetch client by QR code data (includes merchant data)
      const clientRes = await fetch(`/api/loyalty/client?qrCode=${cardId}`);
      if (!clientRes.ok) {
        setError('Card not found');
        setLoading(false);
        return;
      }
      const clientData = await clientRes.json();
      setClient(clientData.client);

      // Use merchant data from client API response if available
      if (clientData.merchant) {
        setMerchant(clientData.merchant);
      }

      if (clientData.client?.merchant_id) {
        // Fallback: Fetch merchant info if not included in client response
        if (!clientData.merchant) {
          const merchantRes = await fetch(`/api/merchant?id=${clientData.client.merchant_id}`);
          if (merchantRes.ok) {
            const merchantData = await merchantRes.json();
            setMerchant(merchantData.merchant);
          }
        }

        // Fetch available rewards
        const rewardsRes = await fetch(`/api/loyalty/rewards?merchantId=${clientData.client.merchant_id}`);
        if (rewardsRes.ok) {
          const rewardsData = await rewardsRes.json();
          setRewards(rewardsData.rewards?.filter((r: LoyaltyReward) => r.is_active) || []);
        }

        // Fetch transaction history
        const transactionsRes = await fetch(`/api/loyalty/points?clientId=${clientData.client.id}`);
        if (transactionsRes.ok) {
          const transactionsData = await transactionsRes.json();
          setTransactions(transactionsData.transactions || []);
        }
      }
    } catch (err) {
      setError('Failed to load card data');
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Check wallet configuration status
  useEffect(() => {
    const checkWalletStatus = async () => {
      if (!cardId) return;

      // Check Apple Wallet
      try {
        const appleRes = await fetch(`/api/loyalty/wallet/apple?clientId=${cardId}`);
        if (appleRes.ok) {
          const data = await appleRes.json();
          setWalletStatus(prev => ({
            ...prev,
            apple: { ...prev.apple, configured: data.configured || false }
          }));
        }
      } catch {
        // Apple Wallet not configured
      }

      // Check Google Wallet
      try {
        const googleRes = await fetch(`/api/loyalty/wallet/google?clientId=${cardId}`);
        if (googleRes.ok) {
          const data = await googleRes.json();
          setWalletStatus(prev => ({
            ...prev,
            google: { ...prev.google, configured: data.configured || false }
          }));
        }
      } catch {
        // Google Wallet not configured
      }
    };

    checkWalletStatus();
  }, [cardId]);

  const handleAddToAppleWallet = async () => {
    setWalletStatus(prev => ({
      ...prev,
      apple: { ...prev.apple, loading: true }
    }));

    try {
      const res = await fetch(`/api/loyalty/wallet/apple?clientId=${cardId}`);
      const data = await res.json();

      if (data.configured) {
        // TODO: Télécharger le .pkpass quand implémenté
        alert(t('loyalty.wallet.appleComingSoon'));
      } else {
        // Afficher message configuration requise
        alert(t('loyalty.wallet.notConfigured'));
      }
    } catch {
      alert(t('loyalty.wallet.error'));
    } finally {
      setWalletStatus(prev => ({
        ...prev,
        apple: { ...prev.apple, loading: false }
      }));
    }
  };

  const handleAddToGoogleWallet = async () => {
    setWalletStatus(prev => ({
      ...prev,
      google: { ...prev.google, loading: true }
    }));

    try {
      const res = await fetch(`/api/loyalty/wallet/google?clientId=${cardId}`);
      const data = await res.json();

      if (data.configured) {
        // TODO: Ouvrir le lien Google Wallet quand implémenté
        alert(t('loyalty.wallet.googleComingSoon'));
      } else {
        // Afficher message configuration requise
        alert(t('loyalty.wallet.notConfigured'));
      }
    } catch {
      alert(t('loyalty.wallet.error'));
    } finally {
      setWalletStatus(prev => ({
        ...prev,
        google: { ...prev.google, loading: false }
      }));
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
        // Show redemption code
        alert(`${t('loyalty.redeem.success')}\n\n${t('loyalty.redeem.code')}: ${data.redemptionCode}\n\n${t('loyalty.redeem.showToStaff')}`);
        fetchData(); // Refresh data
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to redeem reward');
      }
    } catch (err) {
      alert('An error occurred');
    } finally {
      setRedeeming(null);
    }
  };

  const handleDownloadCard = async () => {
    if (!cardRef.current || !client) return;

    const downloadShopName = merchant?.business_name || 'StarSpin';

    setDownloading(true);
    try {
      // Dynamically import html2canvas
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default;

      // Clone the element to avoid modifying the original
      const clonedElement = cardRef.current.cloneNode(true) as HTMLElement;
      clonedElement.style.position = 'absolute';
      clonedElement.style.left = '-9999px';
      clonedElement.style.top = '0';
      document.body.appendChild(clonedElement);

      // Replace any lab() colors with fallback colors in computed styles
      const allElements = clonedElement.querySelectorAll('*');
      allElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const computedStyle = window.getComputedStyle(htmlEl);
        // Force standard colors to avoid lab() parsing issues
        if (computedStyle.backgroundColor.includes('lab')) {
          htmlEl.style.backgroundColor = '#f8fafc';
        }
        if (computedStyle.color.includes('lab')) {
          htmlEl.style.color = '#1e293b';
        }
      });

      const canvas = await html2canvas(clonedElement, {
        backgroundColor: '#fffbeb',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        ignoreElements: (element) => {
          // Ignore elements that might cause issues
          return element.tagName === 'IFRAME' || element.tagName === 'VIDEO';
        },
      });

      // Remove the cloned element
      document.body.removeChild(clonedElement);

      // Convert to PNG and download
      const link = document.createElement('a');
      link.download = `${downloadShopName.replace(/\s+/g, '_')}_card_${client.card_id}.png`;
      link.href = canvas.toDataURL('image/png');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Top Banner Image */}
      {cardImageUrl && (
        <div className="relative w-full h-48 overflow-hidden">
          <img
            src={cardImageUrl}
            alt={`${shopName} Card`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-amber-50/90" />
        </div>
      )}

      {/* Header */}
      <div className={`relative ${cardImageUrl ? '-mt-16' : 'pt-8'}`}>
        <div className={`${!cardImageUrl ? 'bg-gradient-to-r from-amber-500 to-orange-500 pt-8' : ''} px-4 pb-24`}>
          <div className="flex items-center gap-3 mb-4">
            {merchant?.logo_url && (
              <img
                src={merchant.logo_url ?? undefined}
                alt={shopName}
                className="h-14 w-14 object-contain bg-white rounded-xl p-1.5 shadow-lg"
              />
            )}
            <div>
              <h1 className={`text-2xl font-bold ${cardImageUrl ? 'text-slate-900' : 'text-white'}`}>
                {shopName} Card
              </h1>
              <p className={`text-sm ${cardImageUrl ? 'text-slate-600' : 'text-white/80'}`}>
                {t('loyalty.card.title')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="px-4 -mt-20 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Downloadable Card Section */}
          <div ref={cardRef}>
            {/* Card Header with Shop Branding */}
            {cardImageUrl && (
              <div className="relative w-full h-32 overflow-hidden">
                <img
                  src={cardImageUrl}
                  alt={`${shopName} Card`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/50" />
                {merchant?.logo_url && (
                  <div className="absolute bottom-3 left-4 flex items-center gap-2">
                    <img
                      src={merchant.logo_url}
                      alt={shopName}
                      className="h-10 w-10 object-contain bg-white rounded-lg p-1 shadow"
                    />
                    <span className="text-white font-bold text-lg drop-shadow">{shopName}</span>
                  </div>
                )}
              </div>
            )}
            {/* Card Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-amber-100 text-sm mb-1">{client.name || t('dashboard.recentReviews.anonymous')}</p>
                  <p className="font-mono text-lg">{client.card_id}</p>
                </div>
                <Award className="w-10 h-10 text-white/80" />
              </div>
            </div>

            {/* Points Balance */}
            <div className="p-6 bg-white">
              <div className="text-center">
                <p className="text-slate-600 text-sm mb-1">{t('loyalty.card.balance')}</p>
                <div className="flex items-center justify-center gap-2">
                  <Star className="w-8 h-8 text-amber-500" />
                  <span className="text-4xl font-bold text-slate-900">{client.points}</span>
                  <span className="text-slate-600">{t('loyalty.clients.points')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <p className="text-lg font-semibold text-slate-900">{client.total_purchases || 0}</p>
                  <p className="text-xs text-slate-600">Purchases</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <Calendar className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-sm font-medium text-slate-900">
                    {client.created_at ? new Date(client.created_at).toLocaleDateString() : '-'}
                  </p>
                  <p className="text-xs text-slate-600">{t('loyalty.card.memberSince')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100"></div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('card')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'card'
                  ? 'text-amber-600 border-b-2 border-amber-500'
                  : 'text-slate-600'
              }`}
            >
              <QrCode className="w-4 h-4 mx-auto mb-1" />
              QR Code
            </button>
            <button
              onClick={() => setActiveTab('rewards')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'rewards'
                  ? 'text-amber-600 border-b-2 border-amber-500'
                  : 'text-slate-600'
              }`}
            >
              <Gift className="w-4 h-4 mx-auto mb-1" />
              {t('loyalty.rewards.title')}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'text-amber-600 border-b-2 border-amber-500'
                  : 'text-slate-600'
              }`}
            >
              <History className="w-4 h-4 mx-auto mb-1" />
              {t('loyalty.clients.history')}
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'card' && (
              <div className="text-center">
                <p className="text-slate-600 text-sm mb-4">{t('loyalty.card.scanToEarn')}</p>
                <div className="bg-white p-4 rounded-2xl shadow-inner inline-block">
                  <QRCode value={client.qr_code_data} size={180} />
                </div>
                <p className="mt-4 font-mono text-slate-500 text-sm">{client.qr_code_data}</p>

                {/* Download Button */}
                <div className="mt-6">
                  <Button
                    variant="default"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={handleDownloadCard}
                    disabled={downloading}
                  >
                    {downloading ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-5 h-5 mr-2" />
                    )}
                    {t('loyalty.card.download') || 'Download Card Image'}
                  </Button>
                </div>

                {/* Wallet Buttons */}
                <div className="mt-4 space-y-3">
                  <Button
                    variant="outline"
                    className="w-full border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                    onClick={handleAddToAppleWallet}
                    disabled={walletStatus.apple.loading || walletStatus.apple.added}
                  >
                    {walletStatus.apple.loading ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : walletStatus.apple.added ? (
                      <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                    ) : (
                      <Apple className="w-5 h-5 mr-2" />
                    )}
                    {walletStatus.apple.added
                      ? t('loyalty.wallet.added')
                      : t('loyalty.card.appleWallet')
                    }
                    {!walletStatus.apple.configured && !walletStatus.apple.added && (
                      <span className="ml-2 text-xs text-amber-500">(Beta)</span>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                    onClick={handleAddToGoogleWallet}
                    disabled={walletStatus.google.loading || walletStatus.google.added}
                  >
                    {walletStatus.google.loading ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : walletStatus.google.added ? (
                      <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                    ) : (
                      <Smartphone className="w-5 h-5 mr-2" />
                    )}
                    {walletStatus.google.added
                      ? t('loyalty.wallet.added')
                      : t('loyalty.card.googleWallet')
                    }
                    {!walletStatus.google.configured && !walletStatus.google.added && (
                      <span className="ml-2 text-xs text-amber-500">(Beta)</span>
                    )}
                  </Button>
                </div>

                {/* Share Button */}
                <div className="mt-4">
                  <Button
                    variant="ghost"
                    className="w-full text-amber-600 hover:text-amber-700 hover:bg-amber-50"
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
              <div className="space-y-4">
                {rewards.length === 0 ? (
                  <div className="text-center py-8">
                    <Gift className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600">{t('loyalty.rewards.noRewards')}</p>
                  </div>
                ) : (
                  rewards.map((reward) => {
                    const canRedeem = client.points >= reward.points_cost;
                    return (
                      <div
                        key={reward.id}
                        className={`border rounded-xl p-4 ${canRedeem ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200'}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-slate-900">{reward.name}</h3>
                            {reward.description && (
                              <p className="text-sm text-slate-600">{reward.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 bg-amber-100 px-2 py-1 rounded-full">
                            <Star className="w-3 h-3 text-amber-600" />
                            <span className="text-sm font-semibold text-amber-700">{reward.points_cost}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-3">
                          <span className={`text-sm ${
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
                            className={canRedeem ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-300'}
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
              <div className="space-y-3">
                {transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600">{t('loyalty.transactions.noTransactions')}</p>
                  </div>
                ) : (
                  transactions.slice(0, 20).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          tx.points > 0 ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {tx.points > 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <Gift className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {t(`loyalty.transactions.${tx.type}`)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : '-'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${tx.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.points > 0 ? '+' : ''}{tx.points}
                        </p>
                        <p className="text-xs text-slate-500">
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

      {/* Footer */}
      <div className="p-4 mt-6 text-center">
        <p className="text-sm text-slate-500">Powered by StarSpin</p>
      </div>
    </div>
  );
}
