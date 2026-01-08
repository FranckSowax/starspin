'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Award, Star, Coins } from 'lucide-react';
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
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'verifying' | 'valid' | 'invalid' | 'redeemed' | 'loyalty'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Loyalty card states
  const [loyaltyClient, setLoyaltyClient] = useState<LoyaltyClient | null>(null);
  const [purchaseAmount, setPurchaseAmount] = useState<string>('');
  const [pointsToAdd, setPointsToAdd] = useState<number>(0);
  const [addingPoints, setAddingPoints] = useState(false);
  const [pointsAdded, setPointsAdded] = useState(false);

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
  };

  // Check if data is a UUID (loyalty card QR code)
  const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  const onScanSuccess = async (decodedText: string) => {
    if (scannerRef.current) {
      await scannerRef.current.clear();
      scannerRef.current = null;
    }

    setScanResult(decodedText);

    // Detect scan type: UUID = loyalty card, otherwise = coupon
    if (isUUID(decodedText) && merchant?.loyalty_enabled) {
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
        setErrorMessage('Carte fidélité introuvable pour ce commerce.');
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

  const verifyCoupon = async (data: string) => {
    setScanStatus('verifying');
    
    // Extract code from URL or raw text
    // Handles direct code (e.g., "ABC-1234") or URL (e.g., "https://.../coupon/...?code=ABC-1234")
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
        setErrorMessage(t('scan.invalidCode') || 'Code invalide ou appartenant à un autre commerçant.');
        return;
      }

      setCouponDetails(coupon);

      if (coupon.used) {
        setScanStatus('invalid');
        setErrorMessage(`${t('scan.alreadyUsed') || 'Ce coupon a déjà été utilisé le'} ${new Date(coupon.used_at).toLocaleDateString()}`);
      } else if (new Date(coupon.expires_at) < new Date()) {
        setScanStatus('invalid');
        setErrorMessage(t('scan.expired') || 'Ce coupon a expiré.');
      } else {
        setScanStatus('valid');
      }

    } catch {
      setScanStatus('invalid');
      setErrorMessage(t('common.error') || 'Une erreur est survenue lors de la vérification.');
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
          title: '✅ Coupon utilisé',
          message: `Le coupon "${couponDetails.code}" pour "${couponDetails.prize_name}" a été validé.`,
          data: { couponCode: couponDetails.code, prizeName: couponDetails.prize_name },
        }),
      }).catch(() => {}); // Fire and forget

    } catch {
      setErrorMessage('Impossible de valider le coupon. Veuillez réessayer.');
    }
  };

  if (!user || !merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#2D6A4F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout merchant={merchant}>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Scanner de Coupon</h1>
          <p className="text-gray-600">Scannez le QR code du client pour vérifier et valider son gain.</p>
        </div>

        <Card className="p-6">
          {scanStatus === 'idle' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Prêt à scanner</h3>
              <p className="text-gray-500 mb-8">Assurez-vous d'avoir autorisé l'accès à la caméra.</p>
              <Button onClick={startScanning} size="lg" className="bg-teal-600 hover:bg-teal-700">
                Lancer le scan
              </Button>
            </div>
          )}

          {scanStatus === 'scanning' && (
            <div className="w-full">
              <div id="reader" className="w-full overflow-hidden rounded-lg"></div>
              <Button onClick={() => setScanStatus('idle')} variant="outline" className="w-full mt-4">
                Annuler
              </Button>
            </div>
          )}

          {scanStatus === 'verifying' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-lg font-medium">Vérification du code...</p>
            </div>
          )}

          {scanStatus === 'valid' && couponDetails && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-green-700 mb-2">Coupon Valide !</h2>
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8 max-w-sm mx-auto">
                <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-1">Prix à remettre</p>
                <p className="text-3xl font-bold text-gray-900 mb-4">{couponDetails.prize_name}</p>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-600">Code: <span className="font-mono font-bold">{couponDetails.code}</span></p>
                  <p className="text-xs text-gray-400 mt-1">Expire le: {new Date(couponDetails.expires_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => setScanStatus('idle')} variant="outline">
                  Annuler
                </Button>
                <Button onClick={redeemCoupon} size="lg" className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/30">
                  Valider la remise du prix
                </Button>
              </div>
            </div>
          )}

          {(scanStatus === 'invalid' || errorMessage) && (scanStatus !== 'valid') && (scanStatus !== 'redeemed') && (scanStatus !== 'scanning') && (scanStatus !== 'verifying') && (scanStatus !== 'idle') && (scanStatus !== 'loyalty') && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-red-700 mb-2">Coupon Invalide</h2>
              <p className="text-gray-600 mb-8 max-w-xs mx-auto">{errorMessage}</p>
              <Button onClick={startScanning} className="bg-gray-900 hover:bg-gray-800">
                <RefreshCw className="w-4 h-4 mr-2" />
                Scanner un autre code
              </Button>
            </div>
          )}

          {scanStatus === 'redeemed' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Gift className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Prix Validé !</h2>
              <p className="text-gray-600 mb-8">Le coupon a été marqué comme utilisé avec succès.</p>
              <Button onClick={startScanning} size="lg" className="bg-teal-600 hover:bg-teal-700">
                Scanner un autre client
              </Button>
            </div>
          )}

          {/* Loyalty Card Mode */}
          {scanStatus === 'loyalty' && loyaltyClient && (
            <div className="py-6">
              {!pointsAdded ? (
                <>
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Award className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-amber-700 mb-2">{t('loyalty.scan.loyaltyCardDetected')}</h2>
                  </div>

                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 rounded-xl text-white mb-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-amber-100 text-sm">{t('loyalty.scan.clientName')}</p>
                        <p className="text-xl font-bold">{loyaltyClient.name || 'Client'}</p>
                        <p className="font-mono text-sm text-amber-200">{loyaltyClient.card_id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-amber-100 text-sm">{t('loyalty.scan.currentPoints')}</p>
                        <div className="flex items-center gap-1 justify-end">
                          <Star className="w-5 h-5" />
                          <span className="text-2xl font-bold">{loyaltyClient.points}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('loyalty.scan.enterAmount')} ({merchant?.loyalty_currency || 'THB'})
                      </label>
                      <Input
                        type="number"
                        min={0}
                        value={purchaseAmount}
                        onChange={handleAmountChange}
                        placeholder="0"
                        className="text-2xl text-center font-bold h-16"
                      />
                    </div>

                    {pointsToAdd > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                        <p className="text-sm text-amber-700 mb-1">{t('loyalty.scan.pointsToAdd')}</p>
                        <div className="flex items-center justify-center gap-2">
                          <Coins className="w-6 h-6 text-amber-500" />
                          <span className="text-3xl font-bold text-amber-600">+{pointsToAdd}</span>
                        </div>
                        <p className="text-xs text-amber-600 mt-2">
                          {merchant?.purchase_amount_threshold || 1000} {merchant?.loyalty_currency || 'THB'} = {merchant?.points_per_purchase || 10} points
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button onClick={() => setScanStatus('idle')} variant="outline" className="flex-1">
                        {t('dashboard.common.cancel')}
                      </Button>
                      <Button
                        onClick={handleAddPoints}
                        disabled={addingPoints || pointsToAdd <= 0}
                        className="flex-1 bg-amber-500 hover:bg-amber-600"
                      >
                        {addingPoints ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Coins className="w-4 h-4 mr-2" />
                            {t('loyalty.scan.addPointsBtn')}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-bold text-green-700 mb-2">{t('loyalty.scan.pointsAdded')}</h2>
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6 max-w-sm mx-auto">
                    <p className="text-sm text-gray-500 mb-2">{t('loyalty.scan.newBalance')}</p>
                    <div className="flex items-center justify-center gap-2">
                      <Star className="w-8 h-8 text-amber-500" />
                      <span className="text-4xl font-bold text-gray-900">{loyaltyClient.points}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{loyaltyClient.name || 'Client'}</p>
                  </div>
                  <Button onClick={startScanning} size="lg" className="bg-teal-600 hover:bg-teal-700">
                    Scanner un autre client
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Session History */}
        {sessionHistory.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Historique de la session</h3>
            <div className="space-y-4">
              {sessionHistory.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                  {item.type === 'loyalty' ? (
                    // Loyalty points entry
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.clientName}</p>
                          <p className="text-sm text-gray-500 font-mono">{item.cardId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-amber-600">+{item.pointsAdded} pts</p>
                        <p className="text-xs text-gray-400">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </>
                  ) : (
                    // Coupon entry
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                          <Gift className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.prize_name}</p>
                          <p className="text-sm text-gray-500 font-mono">{item.code}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">Validé</p>
                        <p className="text-xs text-gray-400">
                          {new Date(item.used_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </Card>
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
