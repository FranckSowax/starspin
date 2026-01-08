'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Image as ImageIcon, Check, X, Loader2, Award, Star, Coins, Gift } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/config';

export default function SettingsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [merchant, setMerchant] = useState<any>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [loyaltyCardFile, setLoyaltyCardFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [backgroundPreview, setBackgroundPreview] = useState<string>('');
  const [loyaltyCardPreview, setLoyaltyCardPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [savingLoyalty, setSavingLoyalty] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string, sql?: string } | null>(null);

  // Loyalty settings state
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(false);
  const [pointsPerPurchase, setPointsPerPurchase] = useState(10);
  const [purchaseThreshold, setPurchaseThreshold] = useState(1000);
  const [loyaltyCurrency, setLoyaltyCurrency] = useState<'THB' | 'EUR' | 'USD' | 'XAF'>('THB');
  const [welcomePoints, setWelcomePoints] = useState(50);

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
      if (merchantData?.logo_url) setLogoPreview(merchantData.logo_url);
      if (merchantData?.background_url) setBackgroundPreview(merchantData.background_url);
      if (merchantData?.loyalty_card_image_url) setLoyaltyCardPreview(merchantData.loyalty_card_image_url);

      // Load loyalty settings
      setLoyaltyEnabled(merchantData?.loyalty_enabled || false);
      setPointsPerPurchase(merchantData?.points_per_purchase || 10);
      setPurchaseThreshold(merchantData?.purchase_amount_threshold || 1000);
      setLoyaltyCurrency(merchantData?.loyalty_currency || 'THB');
      setWelcomePoints(merchantData?.welcome_points || 50);
    };

    checkAuth();
  }, [router]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Set file immediately to enable Save button
      setBackgroundFile(file);
      
      // Check aspect ratio (9:16 for vertical) - warning only, not blocking
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const target = 9 / 16;
        if (Math.abs(aspectRatio - target) > 0.15) {
          setMessage({ 
            type: 'error', 
            text: `Image ratio is ${(aspectRatio * 16 / 9).toFixed(2)}:16. Recommended: 9:16 (vertical format)` 
          });
        } else {
          setMessage(null);
        }
      };
      img.src = URL.createObjectURL(file);
      
      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackgroundPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoyaltyCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoyaltyCardFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLoyaltyCardPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveLoyalty = async () => {
    if (!user) return;

    setSavingLoyalty(true);
    setMessage(null);

    try {
      const updates: any = {
        loyalty_enabled: loyaltyEnabled,
        points_per_purchase: pointsPerPurchase,
        purchase_amount_threshold: purchaseThreshold,
        loyalty_currency: loyaltyCurrency,
        welcome_points: welcomePoints
      };

      if (loyaltyCardFile) {
        const cardImageUrl = await uploadImage(loyaltyCardFile, 'loyalty-cards');
        updates.loyalty_card_image_url = cardImageUrl;
      }

      const { error } = await supabase
        .from('merchants')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: t('loyalty.settings.title') + ' - ' + t('dashboard.common.save') + '!' });
      setLoyaltyCardFile(null);

      // Refresh merchant data
      const { data: merchantData } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', user.id)
        .single();
      setMerchant(merchantData);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save loyalty settings' });
    } finally {
      setSavingLoyalty(false);
    }
  };

  const uploadImage = async (file: File, path: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('merchant-assets')
      .upload(filePath, file, { 
        cacheControl: '3600',
        upsert: true 
      });

    if (uploadError) {
      throw new Error(uploadError.message || 'Failed to upload image');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('merchant-assets')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSave = async () => {
    if (!user) return;

    setUploading(true);
    setMessage(null);

    try {
      const updates: any = {};

      if (logoFile) {
        const logoUrl = await uploadImage(logoFile, 'logos');
        updates.logo_url = logoUrl;
      }

      if (backgroundFile) {
        const backgroundUrl = await uploadImage(backgroundFile, 'backgrounds');
        updates.background_url = backgroundUrl;
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('merchants')
          .update(updates)
          .eq('id', user.id);

        if (error) throw error;

        setMessage({ type: 'success', text: 'Images uploaded successfully!' });
        setLogoFile(null);
        setBackgroundFile(null);
        
        // Refresh merchant data
        const { data: merchantData } = await supabase
          .from('merchants')
          .select('*')
          .eq('id', user.id)
          .single();
        setMerchant(merchantData);
      }
    } catch (error: any) {
      if (error.message && (error.message.includes('row-level security') || error.message.includes('StorageApiError'))) {
        setMessage({
          type: 'warning',
          text: 'Database configuration required: Storage policies are missing.',
          sql: `
-- Run this in your Supabase SQL Editor:
INSERT INTO storage.buckets (id, name, public) VALUES ('merchant-assets', 'merchant-assets', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'merchant-assets' );

DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'merchant-assets' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Auth Update" ON storage.objects;
CREATE POLICY "Auth Update" ON storage.objects FOR UPDATE USING ( bucket_id = 'merchant-assets' AND auth.role() = 'authenticated' );`
        });
      } else {
        setMessage({ type: 'error', text: error.message || 'Failed to upload images' });
      }
    } finally {
      setUploading(false);
    }
  };

  if (!user || !merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout merchant={merchant}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Customize your rating page appearance</p>
        </div>

        {message && (
          <Card className={`p-4 ${
            message.type === 'success' ? 'bg-teal-50 border-teal-200' : 
            message.type === 'warning' ? 'bg-amber-50 border-amber-200' :
            'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-2">
              {message.type === 'success' ? (
                <Check className="w-5 h-5 text-teal-600 mt-0.5" />
              ) : message.type === 'warning' ? (
                <div className="w-5 h-5 text-amber-600 mt-0.5">⚠️</div>
              ) : (
                <X className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${
                  message.type === 'success' ? 'text-teal-700' : 
                  message.type === 'warning' ? 'text-amber-800' :
                  'text-red-700'
                }`}>
                  {message.text}
                </p>
                {message.sql && (
                  <pre className="mt-2 p-3 bg-white/50 rounded border text-xs font-mono overflow-x-auto">
                    {message.sql}
                  </pre>
                )}
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Logo Upload */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Business Logo</h3>
                <p className="text-sm text-gray-600">Displayed at the top of your rating page</p>
              </div>
              <Badge variant="outline">Square</Badge>
            </div>

            <div className="space-y-4">
              {logoPreview && (
                <div className="relative w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  <img src={logoPreview} alt="Logo preview" className="max-h-full max-w-full object-contain" />
                </div>
              )}

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-500 transition-colors">
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <label htmlFor="logo-upload" className="cursor-pointer">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="text-teal-600 font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                </label>
              </div>
            </div>
          </Card>

          {/* Background Upload */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Background Image</h3>
                <p className="text-sm text-gray-600">Background for your rating page</p>
              </div>
              <Badge variant="outline">9:16 Ratio</Badge>
            </div>

            <div className="space-y-4">
              {backgroundPreview && (
                <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                  <img src={backgroundPreview} alt="Background preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <p className="text-white text-sm">With overlay (40% opacity)</p>
                  </div>
                </div>
              )}

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-500 transition-colors">
                <input
                  type="file"
                  id="background-upload"
                  accept="image/*"
                  onChange={handleBackgroundChange}
                  className="hidden"
                />
                <label htmlFor="background-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="text-teal-600 font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG (9:16 format) up to 10MB</p>
                </label>
              </div>
            </div>
          </Card>
        </div>

        {/* Preview */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="max-w-sm mx-auto aspect-[9/16] bg-white rounded-2xl shadow-xl overflow-hidden relative">
              {backgroundPreview && (
                <div className="absolute inset-0">
                  <img src={backgroundPreview} alt="Background" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40"></div>
                </div>
              )}
              <div className="relative z-10 p-6 flex flex-col items-center justify-center h-full">
                {logoPreview && (
                  <img src={logoPreview} alt="Logo" className="h-16 mb-4 object-contain" />
                )}
                <div className="bg-white rounded-2xl shadow-2xl p-6 w-full">
                  <h3 className="text-xl font-bold text-center mb-4">{merchant.business_name}</h3>
                  <p className="text-center text-gray-600 text-sm">Rating window preview</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setLogoFile(null);
              setBackgroundFile(null);
              setLogoPreview(merchant.logo_url || '');
              setBackgroundPreview(merchant.background_url || '');
            }}
          >
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={uploading || (!logoFile && !backgroundFile)}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>

        {/* Loyalty Settings Section */}
        <div className="border-t border-gray-200 pt-8 mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t('loyalty.settings.title')}</h2>
              <p className="text-gray-600">{t('loyalty.settings.enabledDesc')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enable Toggle */}
            <Card className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${loyaltyEnabled ? 'bg-amber-100' : 'bg-gray-100'}`}>
                    <Star className={`w-6 h-6 ${loyaltyEnabled ? 'text-amber-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('loyalty.settings.enabled')}</h3>
                    <p className="text-sm text-gray-600">{t('loyalty.settings.enabledDesc')}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLoyaltyEnabled(!loyaltyEnabled)}
                  className={`w-14 h-7 rounded-full transition-colors ${loyaltyEnabled ? 'bg-amber-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform ${loyaltyEnabled ? 'translate-x-7' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </Card>

            {loyaltyEnabled && (
              <>
                {/* Points Configuration */}
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Coins className="w-5 h-5 text-amber-500" />
                    <h3 className="font-semibold text-gray-900">{t('loyalty.settings.pointsPerPurchase')}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{t('loyalty.settings.pointsPerPurchaseDesc')}</p>
                  <Input
                    type="number"
                    min={1}
                    value={pointsPerPurchase}
                    onChange={(e) => setPointsPerPurchase(parseInt(e.target.value) || 10)}
                    className="mb-4"
                  />

                  <div className="flex items-center gap-3 mb-4 mt-6">
                    <Coins className="w-5 h-5 text-amber-500" />
                    <h3 className="font-semibold text-gray-900">{t('loyalty.settings.purchaseThreshold')}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{t('loyalty.settings.purchaseThresholdDesc')}</p>
                  <Input
                    type="number"
                    min={1}
                    value={purchaseThreshold}
                    onChange={(e) => setPurchaseThreshold(parseInt(e.target.value) || 1000)}
                  />
                </Card>

                {/* Currency & Welcome Points */}
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Star className="w-5 h-5 text-amber-500" />
                    <h3 className="font-semibold text-gray-900">{t('loyalty.settings.currency')}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{t('loyalty.settings.currencyDesc')}</p>
                  <select
                    value={loyaltyCurrency}
                    onChange={(e) => setLoyaltyCurrency(e.target.value as 'THB' | 'EUR' | 'USD' | 'XAF')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 mb-4"
                  >
                    <option value="THB">THB - Thai Baht (฿)</option>
                    <option value="EUR">EUR - Euro (€)</option>
                    <option value="USD">USD - US Dollar ($)</option>
                    <option value="XAF">XAF - CFA Franc</option>
                  </select>

                  <div className="flex items-center gap-3 mb-4 mt-6">
                    <Gift className="w-5 h-5 text-amber-500" />
                    <h3 className="font-semibold text-gray-900">{t('loyalty.settings.welcomePoints')}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{t('loyalty.settings.welcomePointsDesc')}</p>
                  <Input
                    type="number"
                    min={0}
                    value={welcomePoints}
                    onChange={(e) => setWelcomePoints(parseInt(e.target.value) || 0)}
                  />
                </Card>

                {/* Loyalty Card Image */}
                <Card className="p-6 lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{t('loyalty.settings.cardImage')}</h3>
                      <p className="text-sm text-gray-600">{t('loyalty.settings.cardImageDesc')}</p>
                    </div>
                    <Badge variant="outline" className="border-amber-200 text-amber-700">16:9</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {loyaltyCardPreview && (
                      <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <img src={loyaltyCardPreview} alt="Loyalty card preview" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="border-2 border-dashed border-amber-300 rounded-lg p-6 text-center hover:border-amber-500 transition-colors bg-amber-50/50">
                      <input
                        type="file"
                        id="loyalty-card-upload"
                        accept="image/*"
                        onChange={handleLoyaltyCardChange}
                        className="hidden"
                      />
                      <label htmlFor="loyalty-card-upload" className="cursor-pointer">
                        <Award className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="text-amber-600 font-semibold">{t('loyalty.settings.uploadImage')}</span>
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG (16:9) up to 5MB</p>
                      </label>
                    </div>
                  </div>
                </Card>

                {/* Points Calculation Preview */}
                <Card className="p-6 lg:col-span-2 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                  <h3 className="font-semibold text-gray-900 mb-4">Points Calculation Example</h3>
                  <div className="flex items-center justify-center gap-4 text-center">
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <p className="text-2xl font-bold text-amber-600">{purchaseThreshold.toLocaleString()} {loyaltyCurrency}</p>
                      <p className="text-sm text-gray-600">Purchase Amount</p>
                    </div>
                    <div className="text-2xl text-amber-500">=</div>
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <p className="text-2xl font-bold text-amber-600">{pointsPerPurchase}</p>
                      <p className="text-sm text-gray-600">Points Earned</p>
                    </div>
                  </div>
                  <p className="text-center text-sm text-gray-600 mt-4">
                    Example: {(purchaseThreshold * 5).toLocaleString()} {loyaltyCurrency} purchase = {pointsPerPurchase * 5} points
                  </p>
                </Card>
              </>
            )}
          </div>

          {/* Save Loyalty Settings */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              onClick={handleSaveLoyalty}
              disabled={savingLoyalty}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {savingLoyalty ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {t('dashboard.common.save')}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
