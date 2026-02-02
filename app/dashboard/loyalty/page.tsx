'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/config';
import {
  Award,
  Users,
  Gift,
  TrendingUp,
  Search,
  Eye,
  Plus,
  CreditCard,
  History,
  Settings,
  ChevronRight,
  Star,
  Loader2,
  AlertCircle,
  Coins,
  Check,
  X,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { Merchant, LoyaltyClient, LoyaltyStats } from '@/lib/types/database';

export default function LoyaltyPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [user, setUser] = useState<any>(null);
  const [clients, setClients] = useState<LoyaltyClient[]>([]);
  const [stats, setStats] = useState<LoyaltyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Loyalty settings state
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(false);
  const [pointsPerPurchase, setPointsPerPurchase] = useState(10);
  const [purchaseThreshold, setPurchaseThreshold] = useState(1000);
  const [loyaltyCurrency, setLoyaltyCurrency] = useState<'THB' | 'EUR' | 'USD' | 'XAF'>('THB');
  const [welcomePoints, setWelcomePoints] = useState(50);
  const [loyaltyCardFile, setLoyaltyCardFile] = useState<File | null>(null);
  const [loyaltyCardPreview, setLoyaltyCardPreview] = useState<string>('');
  const [savingLoyalty, setSavingLoyalty] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      setUser(user);

      // Fetch merchant
      const { data: merchantData } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!merchantData) {
        router.push('/auth');
        return;
      }

      setMerchant(merchantData);

      // Load loyalty settings
      setLoyaltyEnabled(merchantData?.loyalty_enabled || false);
      setPointsPerPurchase(merchantData?.points_per_purchase || 10);
      setPurchaseThreshold(merchantData?.purchase_amount_threshold || 1000);
      setLoyaltyCurrency(merchantData?.loyalty_currency || 'THB');
      setWelcomePoints(merchantData?.welcome_points || 50);
      if (merchantData?.loyalty_card_image_url) setLoyaltyCardPreview(merchantData.loyalty_card_image_url);

      // Fetch loyalty clients
      const clientsRes = await fetch(`/api/loyalty/client?merchantId=${user.id}`);
      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setClients(clientsData.clients || []);
      }

      // Calculate stats
      const { data: allClients } = await supabase
        .from('loyalty_clients')
        .select('id, points, status')
        .eq('merchant_id', user.id);

      const { data: transactions } = await supabase
        .from('points_transactions')
        .select('points, type')
        .eq('merchant_id', user.id);

      const { data: redeemed } = await supabase
        .from('redeemed_rewards')
        .select('id, status')
        .eq('merchant_id', user.id);

      const total_clients = allClients?.length || 0;
      const active_clients = allClients?.filter(c => c.status === 'active').length || 0;
      const total_points_issued = transactions
        ?.filter(t => t.points > 0)
        .reduce((sum, t) => sum + t.points, 0) || 0;
      const total_points_redeemed = transactions
        ?.filter(t => t.points < 0)
        .reduce((sum, t) => sum + Math.abs(t.points), 0) || 0;
      const total_rewards_redeemed = redeemed?.filter(r => r.status === 'used').length || 0;
      const average_points_per_client = total_clients > 0 ? Math.round(total_points_issued / total_clients) : 0;

      setStats({
        total_clients,
        active_clients,
        total_points_issued,
        total_points_redeemed,
        total_rewards_redeemed,
        average_points_per_client
      });

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const uploadImage = async (file: File) => {
    if (!user) throw new Error('Not authenticated');
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('merchant-assets')
      .upload(fileName, file, { cacheControl: '3600', upsert: true });

    if (uploadError) throw new Error(uploadError.message || 'Failed to upload image');

    const { data: { publicUrl } } = supabase.storage
      .from('merchant-assets')
      .getPublicUrl(fileName);

    return publicUrl;
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
        const cardImageUrl = await uploadImage(loyaltyCardFile);
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

  const filteredClients = clients.filter(client => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      client.name?.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.phone?.includes(query) ||
      client.card_id?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <DashboardLayout merchant={merchant}>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout merchant={merchant}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <Award className="w-7 h-7 text-amber-500" />
              {t('loyalty.title')}
            </h1>
            <p className="text-slate-600 mt-1">{t('loyalty.subtitle')}</p>
          </div>
          {loyaltyEnabled && (
            <div className="flex gap-3">
              <Link href="/dashboard/loyalty/rewards">
                <Button variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50">
                  <Gift className="w-4 h-4 mr-2" />
                  {t('loyalty.rewards.title')}
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Message */}
        {message && (
          <Card className={`p-4 ${message.type === 'success' ? 'bg-teal-50 border-teal-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <Check className="w-5 h-5 text-teal-600" />
              ) : (
                <X className="w-5 h-5 text-red-600" />
              )}
              <p className={`font-medium ${message.type === 'success' ? 'text-teal-700' : 'text-red-700'}`}>
                {message.text}
              </p>
            </div>
          </Card>
        )}

        {/* Loyalty Settings */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{t('loyalty.settings.title')}</h2>
              <p className="text-gray-600 text-sm">{t('loyalty.settings.enabledDesc')}</p>
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
          <div className="flex justify-end gap-3">
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

        {/* Stats & Clients only shown when loyalty is enabled */}
        {loyaltyEnabled && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">{t('loyalty.overview.totalClients')}</p>
                    <p className="text-2xl font-bold text-slate-900">{stats?.total_clients || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">{t('loyalty.overview.totalPoints')}</p>
                    <p className="text-2xl font-bold text-slate-900">{stats?.total_points_issued?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Gift className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">{t('loyalty.overview.totalRewards')}</p>
                    <p className="text-2xl font-bold text-slate-900">{stats?.total_rewards_redeemed || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">{t('loyalty.overview.activeCards')}</p>
                    <p className="text-2xl font-bold text-slate-900">{stats?.active_clients || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/dashboard/loyalty/rewards" className="block">
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <Gift className="w-8 h-8 mb-3" />
                      <h3 className="font-semibold text-lg">{t('loyalty.rewards.title')}</h3>
                      <p className="text-amber-100 text-sm mt-1">{t('loyalty.rewards.subtitle')}</p>
                    </div>
                    <ChevronRight className="w-6 h-6" />
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/scan" className="block">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <CreditCard className="w-8 h-8 mb-3" />
                      <h3 className="font-semibold text-lg">{t('dashboard.nav.scanner')}</h3>
                      <p className="text-blue-100 text-sm mt-1">{t('loyalty.scan.loyaltyCardDetected')}</p>
                    </div>
                    <ChevronRight className="w-6 h-6" />
                  </div>
                </div>
              </Link>
            </div>

            {/* Clients List */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {t('loyalty.clients.title')}
                  </h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder={t('loyalty.clients.search')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                </div>
              </div>

              {filteredClients.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    {t('loyalty.clients.noClients')}
                  </h3>
                  <p className="text-slate-600">
                    {t('loyalty.clients.noClientsDesc')}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {t('loyalty.clients.cardId')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {t('loyalty.clients.points')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {t('loyalty.clients.lastVisit')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {t('loyalty.clients.status')}
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredClients.map((client) => (
                        <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-mono text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
                              {client.card_id}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="font-medium text-slate-900">
                                {client.name || t('dashboard.recentReviews.anonymous')}
                              </p>
                              <p className="text-sm text-slate-500">
                                {client.email || client.phone || '-'}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-amber-500" />
                              <span className="font-semibold text-slate-900">{client.points}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {client.last_visit
                              ? new Date(client.last_visit).toLocaleDateString()
                              : '-'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              client.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : client.status === 'suspended'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}>
                              {t(`loyalty.clients.${client.status}`)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link href={`/card/${client.qr_code_data}`} target="_blank">
                                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-amber-600">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-amber-600">
                                <History className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
