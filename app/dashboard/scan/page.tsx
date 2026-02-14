'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { CheckCircle2, XCircle, RefreshCw, Award, Star, Coins, Ticket, ChevronDown, ChevronUp, ScanLine } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { LoyaltyClient } from '@/lib/types/database';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/config';

export default function ScanPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [merchant, setMerchant] = useState<any>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [couponDetails, setCouponDetails] = useState<any>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'verifying' | 'valid' | 'invalid' | 'redeemed' | 'loyalty' | 'redemption' | 'redemption_used'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Loyalty card states
  const [loyaltyClient, setLoyaltyClient] = useState<LoyaltyClient | null>(null);
  const [purchaseAmount, setPurchaseAmount] = useState<string>('');
  const [pointsToAdd, setPointsToAdd] = useState<number>(0);
  const [addingPoints, setAddingPoints] = useState(false);
  const [pointsAdded, setPointsAdded] = useState(false);

  // Redemption states
  const [redemptionDetails, setRedemptionDetails] = useState<any>(null);
  const [validatingRedemption, setValidatingRedemption] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login');
        return;
      }

      setUser(user);

      const { data: merchantData } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', user.id)
        .single();

      setMerchant(merchantData);
    };

    checkAuth();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, [router]);

  useEffect(() => {
    if (merchant && scanStatus === 'scanning') {
      // Initialize scanner
      const scanner = new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true
        },
        /* verbose= */ false
      );

      scanner.render(onScanSuccess, onScanFailure);
      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, [merchant, scanStatus]);

  const startScanning = () => {
    setScanStatus('scanning');
    setScanResult(null);
    setCouponDetails(null);
    setErrorMessage(null);
    setLoyaltyClient(null);
    setPurchaseAmount('');
    setPointsToAdd(0);
    setPointsAdded(false);
    setRedemptionDetails(null);
    setValidatingRedemption(false);
  };

  // Check if data is a UUID (loyalty card QR code)
  const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  // Check if data is a redemption code (RWD-XXXXXX)
  const isRedemptionCode = (str: string) => /^RWD-[A-Z0-9]{5,8}$/i.test(str.trim());

  const onScanSuccess = async (decodedText: string) => {
    if (scannerRef.current) {
      await scannerRef.current.clear();
      scannerRef.current = null;
    }

    setScanResult(decodedText);

    // Detect scan type: UUID = loyalty card, RWD- = redemption, otherwise = coupon
    if (isRedemptionCode(decodedText.trim())) {
      verifyRedemption(decodedText.trim());
    } else if (isUUID(decodedText) && merchant?.loyalty_enabled) {
      verifyLoyaltyCard(decodedText);
    } else {
      verifyCoupon(decodedText);
    }
  };

  const onScanFailure = () => {
    // Silent failure
  };

  // Verify loyalty card by QR code data (UUID)
  const verifyLoyaltyCard = async (qrCodeData: string) => {
    setScanStatus('verifying');

    try {
      const res = await fetch(`/api/loyalty/client?qrCode=${qrCodeData}&merchantId=${merchant.id}`);

      if (!res.ok) {
        setScanStatus('invalid');
        setErrorMessage(t('loyalty.scan.loyaltyCardDetected') + ' - ' + t('common.error'));
        return;
      }

      const data = await res.json();

      if (!data.client) {
        setScanStatus('invalid');
        setErrorMessage('Carte fidelite introuvable pour ce commerce.');
        return;
      }

      setLoyaltyClient(data.client);
      setScanStatus('loyalty');
    } catch {
      setScanStatus('invalid');
      setErrorMessage(t('common.error'));
    }
  };

  // Calculate points based on purchase amount
  const calculatePoints = (amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    const threshold = merchant?.purchase_amount_threshold || 1000;
    const pointsPerUnit = merchant?.points_per_purchase || 10;
    return Math.floor(numAmount / threshold) * pointsPerUnit;
  };

  // Handle purchase amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPurchaseAmount(value);
    setPointsToAdd(calculatePoints(value));
  };

  // Add points to loyalty client
  const handleAddPoints = async () => {
    if (!loyaltyClient || pointsToAdd <= 0) return;

    setAddingPoints(true);
    try {
      const res = await fetch('/api/loyalty/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: loyaltyClient.id,
          merchantId: merchant.id,
          action: 'earn',
          points: pointsToAdd,
          purchaseAmount: parseFloat(purchaseAmount) || 0,
          description: `Achat de ${purchaseAmount} ${merchant?.loyalty_currency || 'THB'}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLoyaltyClient(prev => prev ? { ...prev, points: data.newBalance } : null);
        setPointsAdded(true);

        // Add to session history
        setSessionHistory(prev => [{
          type: 'loyalty',
          clientName: loyaltyClient.name || 'Client',
          cardId: loyaltyClient.card_id,
          pointsAdded: pointsToAdd,
          newBalance: data.newBalance,
          timestamp: new Date().toISOString()
        }, ...prev]);
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Erreur lors de l\'ajout des points');
      }
    } catch {
      setErrorMessage('Erreur lors de l\'ajout des points');
    } finally {
      setAddingPoints(false);
    }
  };

  // Verify a redemption code (RWD-XXXXXX)
  const verifyRedemption = async (code: string) => {
    setScanStatus('verifying');

    try {
      const res = await fetch(`/api/loyalty/redeem?code=${encodeURIComponent(code)}`);

      if (!res.ok) {
        setScanStatus('invalid');
        setErrorMessage('Code de redemption introuvable.');
        return;
      }

      const data = await res.json();

      if (!data.found || !data.redeemedReward) {
        setScanStatus('invalid');
        setErrorMessage('Code de redemption introuvable.');
        return;
      }

      const reward = data.redeemedReward;

      // Check if it belongs to this merchant
      if (reward.merchant_id !== merchant.id) {
        setScanStatus('invalid');
        setErrorMessage('Ce code appartient a un autre commerce.');
        return;
      }

      setRedemptionDetails(reward);

      if (reward.status === 'used') {
        setScanStatus('invalid');
        setErrorMessage(`Ce code a deja ete utilise le ${new Date(reward.used_at).toLocaleDateString()}.`);
      } else if (reward.status === 'expired' || (reward.expires_at && new Date(reward.expires_at) < new Date())) {
        setScanStatus('invalid');
        setErrorMessage('Ce code de redemption a expire.');
      } else if (reward.status === 'cancelled') {
        setScanStatus('invalid');
        setErrorMessage('Ce code de redemption a ete annule.');
      } else {
        setScanStatus('redemption');
      }
    } catch {
      setScanStatus('invalid');
      setErrorMessage('Erreur lors de la verification du code.');
    }
  };

  // Mark a redemption as used
  const markRedemptionUsed = async () => {
    if (!redemptionDetails) return;

    setValidatingRedemption(true);
    try {
      const res = await fetch('/api/loyalty/redeem', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          redemptionCode: redemptionDetails.redemption_code,
          merchantId: merchant.id,
          action: 'use'
        })
      });

      if (res.ok) {
        setScanStatus('redemption_used');

        setSessionHistory(prev => [{
          type: 'redemption',
          rewardName: redemptionDetails.reward_name,
          rewardValue: redemptionDetails.reward_value,
          code: redemptionDetails.redemption_code,
          clientName: redemptionDetails.loyalty_clients?.name || 'Client',
          clientPhone: redemptionDetails.loyalty_clients?.phone || '',
          pointsSpent: redemptionDetails.points_spent,
          timestamp: new Date().toISOString()
        }, ...prev]);
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Erreur lors de la validation.');
      }
    } catch {
      setErrorMessage('Erreur lors de la validation du code.');
    } finally {
      setValidatingRedemption(false);
    }
  };

  const verifyCoupon = async (data: string) => {
    setScanStatus('verifying');

    // Extract code from URL or raw text
    let codeToVerify = data;
    try {
      if (data.includes('code=')) {
        const urlObj = new URL(data);
        const codeParam = urlObj.searchParams.get('code');
        if (codeParam) codeToVerify = codeParam;
      }
    } catch (e) {
      // Not a URL, stick with raw data
    }

    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', codeToVerify)
        .eq('merchant_id', merchant.id)
        .single();

      if (error || !coupon) {
        setScanStatus('invalid');
        setErrorMessage(t('scan.invalidCode') || 'Code invalide ou appartenant a un autre commercant.');
        return;
      }

      setCouponDetails(coupon);

      if (coupon.used) {
        setScanStatus('invalid');
        setErrorMessage(`${t('scan.alreadyUsed') || 'Ce coupon a deja ete utilise le'} ${new Date(coupon.used_at).toLocaleDateString()}`);
      } else if (new Date(coupon.expires_at) < new Date()) {
        setScanStatus('invalid');
        setErrorMessage(t('scan.expired') || 'Ce coupon a expire.');
      } else {
        setScanStatus('valid');
      }

    } catch {
      setScanStatus('invalid');
      setErrorMessage(t('common.error') || 'Une erreur est survenue lors de la verification.');
    }
  };

  const redeemCoupon = async () => {
    if (!couponDetails) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .update({
          used: true,
          used_at: new Date().toISOString()
        })
        .eq('id', couponDetails.id);

      if (error) throw error;

      setScanStatus('redeemed');

      // Update local state to reflect change immediately
      const updatedCoupon = {
        ...couponDetails,
        used: true,
        used_at: new Date().toISOString()
      };

      setCouponDetails(updatedCoupon);
      setSessionHistory(prev => [updatedCoupon, ...prev]);

      // Send coupon used notification
      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: merchant.id,
          type: 'coupon_used',
          title: 'Coupon utilise',
          message: `Le coupon "${couponDetails.code}" pour "${couponDetails.prize_name}" a ete valide.`,
          data: { couponCode: couponDetails.code, prizeName: couponDetails.prize_name },
        }),
      }).catch(() => {}); // Fire and forget

    } catch {
      setErrorMessage('Impossible de valider le coupon. Veuillez reessayer.');
    }
  };

  if (!user || !merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout merchant={merchant}>
      <div className="max-w-xl mx-auto space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('scan.title') || 'Scanner'}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('scan.subtitle') || 'Scannez le QR code du client pour verifier et valider.'}</p>
        </div>

        {/* Scanner Card */}
        <div className="group relative border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-300 hover:shadow-md bg-white">
          <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 to-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          <div className="p-5">

            {/* Idle State */}
            {scanStatus === 'idle' && (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4">
                  <ScanLine className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{t('scan.ready') || 'Pret a scanner'}</h3>
                <p className="text-xs text-gray-500 mb-5">Coupon, carte fidelite ou code de redemption</p>
                <Button onClick={startScanning} className="bg-teal-600 hover:bg-teal-700 gap-2">
                  <ScanLine className="w-4 h-4" />
                  {t('scan.start') || 'Lancer le scan'}
                </Button>
              </div>
            )}

            {/* Scanning State */}
            {scanStatus === 'scanning' && (
              <div>
                <div id="reader" className="w-full overflow-hidden rounded-lg border border-gray-200"></div>
                <Button onClick={() => setScanStatus('idle')} variant="outline" className="w-full mt-3" size="sm">
                  {t('dashboard.common.cancel') || 'Annuler'}
                </Button>
              </div>
            )}

            {/* Verifying State */}
            {scanStatus === 'verifying' && (
              <div className="text-center py-8">
                <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm font-medium text-gray-700">Verification du code...</p>
              </div>
            )}

            {/* Valid Coupon */}
            {scanStatus === 'valid' && couponDetails && (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-bold text-green-700 mb-1">Coupon Valide</h2>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-5 max-w-xs mx-auto">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-0.5">Prix a remettre</p>
                  <p className="text-xl font-bold text-gray-900 mb-2">{couponDetails.prize_name}</p>
                  <div className="border-t border-gray-200 pt-2 space-y-1">
                    <p className="text-xs text-gray-600">Code: <span className="font-mono font-bold">{couponDetails.code}</span></p>
                    <p className="text-xs text-gray-400">Expire le: {new Date(couponDetails.expires_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => setScanStatus('idle')} variant="outline" size="sm">
                    Annuler
                  </Button>
                  <Button onClick={redeemCoupon} className="bg-green-600 hover:bg-green-700 gap-1.5" size="sm">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Valider la remise
                  </Button>
                </div>
              </div>
            )}

            {/* Invalid */}
            {(scanStatus === 'invalid' || errorMessage) && (scanStatus !== 'valid') && (scanStatus !== 'redeemed') && (scanStatus !== 'scanning') && (scanStatus !== 'verifying') && (scanStatus !== 'idle') && (scanStatus !== 'loyalty') && (scanStatus !== 'redemption') && (scanStatus !== 'redemption_used') && (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-bold text-red-700 mb-1">Invalide</h2>
                <p className="text-sm text-gray-600 mb-5 max-w-xs mx-auto">{errorMessage}</p>
                <Button onClick={startScanning} variant="outline" className="gap-1.5" size="sm">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Scanner un autre code
                </Button>
              </div>
            )}

            {/* Redeemed Coupon Success */}
            {scanStatus === 'redeemed' && (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Prix Valide</h2>
                <p className="text-sm text-gray-500 mb-5">Le coupon a ete marque comme utilise.</p>
                <Button onClick={startScanning} className="bg-teal-600 hover:bg-teal-700 gap-1.5" size="sm">
                  <ScanLine className="w-3.5 h-3.5" />
                  Scanner un autre client
                </Button>
              </div>
            )}

            {/* Loyalty Card Mode */}
            {scanStatus === 'loyalty' && loyaltyClient && (
              <div className="py-4">
                {!pointsAdded ? (
                  <>
                    <div className="text-center mb-4">
                      <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Award className="w-7 h-7" />
                      </div>
                      <h2 className="text-lg font-bold text-amber-700">{t('loyalty.scan.loyaltyCardDetected')}</h2>
                    </div>

                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 rounded-xl text-white mb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-amber-100 text-xs">{t('loyalty.scan.clientName')}</p>
                          <p className="text-base font-bold">{loyaltyClient.name || 'Client'}</p>
                          <p className="font-mono text-xs text-amber-200">{loyaltyClient.card_id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-amber-100 text-xs">{t('loyalty.scan.currentPoints')}</p>
                          <div className="flex items-center gap-1 justify-end">
                            <Star className="w-4 h-4" />
                            <span className="text-xl font-bold">{loyaltyClient.points}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          {t('loyalty.scan.enterAmount')} ({merchant?.loyalty_currency || 'THB'})
                        </label>
                        <Input
                          type="number"
                          min={0}
                          value={purchaseAmount}
                          onChange={handleAmountChange}
                          placeholder="0"
                          className="text-xl text-center font-bold h-12"
                        />
                      </div>

                      {pointsToAdd > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                          <p className="text-xs text-amber-700 mb-0.5">{t('loyalty.scan.pointsToAdd')}</p>
                          <div className="flex items-center justify-center gap-1.5">
                            <Coins className="w-5 h-5 text-amber-500" />
                            <span className="text-2xl font-bold text-amber-600">+{pointsToAdd}</span>
                          </div>
                          <p className="text-[10px] text-amber-600 mt-1">
                            {merchant?.purchase_amount_threshold || 1000} {merchant?.loyalty_currency || 'THB'} = {merchant?.points_per_purchase || 10} points
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button onClick={() => setScanStatus('idle')} variant="outline" className="flex-1" size="sm">
                          {t('dashboard.common.cancel')}
                        </Button>
                        <Button
                          onClick={handleAddPoints}
                          disabled={addingPoints || pointsToAdd <= 0}
                          className="flex-1 bg-amber-500 hover:bg-amber-600 gap-1.5"
                          size="sm"
                        >
                          {addingPoints ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Coins className="w-3.5 h-3.5" />
                              {t('loyalty.scan.addPointsBtn')}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h2 className="text-lg font-bold text-green-700 mb-1">{t('loyalty.scan.pointsAdded')}</h2>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-5 max-w-xs mx-auto">
                      <p className="text-xs text-gray-500 mb-1">{t('loyalty.scan.newBalance')}</p>
                      <div className="flex items-center justify-center gap-1.5">
                        <Star className="w-6 h-6 text-amber-500" />
                        <span className="text-3xl font-bold text-gray-900">{loyaltyClient.points}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{loyaltyClient.name || 'Client'}</p>
                    </div>
                    <Button onClick={startScanning} className="bg-teal-600 hover:bg-teal-700 gap-1.5" size="sm">
                      <ScanLine className="w-3.5 h-3.5" />
                      Scanner un autre client
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Redemption Code Mode */}
            {scanStatus === 'redemption' && redemptionDetails && (
              <div className="py-4">
                <div className="text-center mb-4">
                  <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Gift className="w-7 h-7" />
                  </div>
                  <h2 className="text-lg font-bold text-purple-700 mb-0.5">Redemption de recompense</h2>
                  <p className="text-xs text-gray-500">Code : <span className="font-mono font-bold">{redemptionDetails.redemption_code}</span></p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Recompense</span>
                    <span className="font-semibold text-gray-900 text-right">{redemptionDetails.reward_name}</span>
                  </div>
                  {redemptionDetails.reward_value && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Valeur</span>
                      <span className="font-medium text-gray-900">{redemptionDetails.reward_value}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Points depenses</span>
                    <span className="font-medium text-amber-600">{redemptionDetails.points_spent} pts</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between">
                    <span className="text-gray-500">Client</span>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{redemptionDetails.loyalty_clients?.name || 'Client'}</p>
                      {redemptionDetails.loyalty_clients?.phone && (
                        <p className="text-xs text-gray-500">{redemptionDetails.loyalty_clients.phone}</p>
                      )}
                      {redemptionDetails.loyalty_clients?.email && (
                        <p className="text-xs text-gray-500">{redemptionDetails.loyalty_clients.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Echange le</span>
                    <span className="text-gray-700">{new Date(redemptionDetails.created_at).toLocaleDateString()}</span>
                  </div>
                  {redemptionDetails.expires_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Expire le</span>
                      <span className={`font-medium ${new Date(redemptionDetails.expires_at) < new Date() ? 'text-red-600' : 'text-green-600'}`}>
                        {new Date(redemptionDetails.expires_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Statut</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">En attente</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => setScanStatus('idle')} variant="outline" className="flex-1" size="sm">
                    Annuler
                  </Button>
                  <Button
                    onClick={markRedemptionUsed}
                    disabled={validatingRedemption}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 gap-1.5"
                    size="sm"
                  >
                    {validatingRedemption ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Valider la remise
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Redemption Used Success */}
            {scanStatus === 'redemption_used' && (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Recompense remise</h2>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-semibold">{redemptionDetails?.reward_name}</span> remise a {redemptionDetails?.loyalty_clients?.name || 'client'}.
                </p>
                <p className="text-xs text-gray-400 mb-5 font-mono">{redemptionDetails?.redemption_code}</p>
                <Button onClick={startScanning} className="bg-teal-600 hover:bg-teal-700 gap-1.5" size="sm">
                  <ScanLine className="w-3.5 h-3.5" />
                  Scanner un autre client
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Session History - Collapsible */}
        {sessionHistory.length > 0 && (
          <div className="group relative border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-300 hover:shadow-md bg-white">
            <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 to-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            <button
              onClick={() => setHistoryOpen(!historyOpen)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Historique de la session</p>
                  <p className="text-xs text-gray-500">{sessionHistory.length} element{sessionHistory.length > 1 ? 's' : ''}</p>
                </div>
              </div>
              {historyOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {historyOpen && (
              <div className="px-4 pb-4 space-y-2">
                {sessionHistory.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm">
                    {item.type === 'loyalty' ? (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                            <Award className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-900">{item.clientName}</p>
                            <p className="text-[10px] text-gray-500 font-mono">{item.cardId}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-amber-600">+{item.pointsAdded} pts</p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </>
                    ) : item.type === 'redemption' ? (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                            <Gift className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-900">{item.rewardName}</p>
                            <p className="text-[10px] text-gray-500">{item.clientName}{item.clientPhone ? ` - ${item.clientPhone}` : ''}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-purple-600">Remis</p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                            <Gift className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-900">{item.prize_name}</p>
                            <p className="text-[10px] text-gray-500 font-mono">{item.code}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-green-600">Valide</p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(item.used_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// Icon component helper
function Gift({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
    </svg>
  )
}
