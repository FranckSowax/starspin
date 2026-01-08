'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/config';
import {
  Award,
  Gift,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  X,
  Check,
  AlertCircle,
  ArrowLeft,
  Star,
  Percent,
  Package,
  Wrench,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import type { Merchant, LoyaltyReward } from '@/lib/types/database';

type RewardType = 'discount' | 'product' | 'service' | 'cashback';

interface RewardForm {
  name: string;
  description: string;
  type: RewardType;
  value: string;
  points_cost: number;
  quantity_available: number | null;
  is_active: boolean;
}

const defaultForm: RewardForm = {
  name: '',
  description: '',
  type: 'discount',
  value: '',
  points_cost: 100,
  quantity_available: null,
  is_active: true
};

const typeIcons: Record<RewardType, typeof Percent> = {
  discount: Percent,
  product: Package,
  service: Wrench,
  cashback: DollarSign
};

export default function RewardsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);
  const [form, setForm] = useState<RewardForm>(defaultForm);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

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

      // Fetch rewards
      const res = await fetch(`/api/loyalty/rewards?merchantId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setRewards(data.rewards || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openAddModal = () => {
    setEditingReward(null);
    setForm(defaultForm);
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (reward: LoyaltyReward) => {
    setEditingReward(reward);
    setForm({
      name: reward.name,
      description: reward.description || '',
      type: reward.type as RewardType,
      value: reward.value,
      points_cost: reward.points_cost,
      quantity_available: reward.quantity_available,
      is_active: reward.is_active
    });
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant) return;

    setSaving(true);
    setError(null);

    try {
      // Transform snake_case to camelCase for API
      const payload = {
        merchantId: merchant.id,
        name: form.name,
        description: form.description,
        type: form.type,
        value: form.value,
        pointsCost: form.points_cost,
        quantityAvailable: form.quantity_available,
        isActive: form.is_active
      };

      let res: Response;

      if (editingReward) {
        res = await fetch('/api/loyalty/rewards', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rewardId: editingReward.id,
            merchantId: merchant.id,
            updates: form
          })
        });
      } else {
        res = await fetch('/api/loyalty/rewards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save reward');
      }

      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rewardId: string) => {
    if (!confirm(t('loyalty.rewards.confirmDelete'))) return;
    if (!merchant) return;

    try {
      const res = await fetch('/api/loyalty/rewards', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId, merchantId: merchant.id })
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting reward:', error);
    }
  };

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
          <div className="flex items-center gap-4">
            <Link href="/dashboard/loyalty">
              <Button variant="ghost" size="sm" className="text-slate-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('dashboard.common.back')}
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <Gift className="w-7 h-7 text-amber-500" />
                {t('loyalty.rewards.title')}
              </h1>
              <p className="text-slate-600 mt-1">{t('loyalty.rewards.subtitle')}</p>
            </div>
          </div>
          <Button onClick={openAddModal} className="bg-amber-500 hover:bg-amber-600">
            <Plus className="w-4 h-4 mr-2" />
            {t('loyalty.rewards.add')}
          </Button>
        </div>

        {/* Rewards Grid */}
        {rewards.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {t('loyalty.rewards.noRewards')}
            </h3>
            <p className="text-slate-600 mb-6">
              {t('loyalty.rewards.noRewardsDesc')}
            </p>
            <Button onClick={openAddModal} className="bg-amber-500 hover:bg-amber-600">
              <Plus className="w-4 h-4 mr-2" />
              {t('loyalty.rewards.add')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward) => {
              const TypeIcon = typeIcons[reward.type as RewardType] || Gift;
              return (
                <div
                  key={reward.id}
                  className={`bg-white rounded-xl border ${reward.is_active ? 'border-slate-200' : 'border-slate-200 opacity-60'} overflow-hidden hover:shadow-md transition-shadow`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        reward.type === 'discount' ? 'bg-blue-100' :
                        reward.type === 'product' ? 'bg-green-100' :
                        reward.type === 'service' ? 'bg-purple-100' :
                        'bg-amber-100'
                      }`}>
                        <TypeIcon className={`w-6 h-6 ${
                          reward.type === 'discount' ? 'text-blue-600' :
                          reward.type === 'product' ? 'text-green-600' :
                          reward.type === 'service' ? 'text-purple-600' :
                          'text-amber-600'
                        }`} />
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(reward)}
                          className="text-slate-400 hover:text-blue-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(reward.id)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {reward.name}
                    </h3>
                    {reward.description && (
                      <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                        {reward.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500" />
                        <span className="font-semibold text-slate-900">{reward.points_cost}</span>
                        <span className="text-sm text-slate-500">{t('loyalty.clients.points')}</span>
                      </div>
                      <div className="text-sm">
                        {reward.quantity_available !== null ? (
                          <span className="text-slate-600">
                            {reward.quantity_available} {t('loyalty.rewards.quantity').toLowerCase()}
                          </span>
                        ) : (
                          <span className="text-green-600">{t('loyalty.rewards.quantityUnlimited')}</span>
                        )}
                      </div>
                    </div>

                    {!reward.is_active && (
                      <div className="mt-3 px-3 py-1.5 bg-slate-100 rounded-lg text-center">
                        <span className="text-sm text-slate-600">Inactive</span>
                      </div>
                    )}
                  </div>

                  <div className={`px-6 py-3 ${
                    reward.type === 'discount' ? 'bg-blue-50' :
                    reward.type === 'product' ? 'bg-green-50' :
                    reward.type === 'service' ? 'bg-purple-50' :
                    'bg-amber-50'
                  }`}>
                    <p className={`text-sm font-medium ${
                      reward.type === 'discount' ? 'text-blue-700' :
                      reward.type === 'product' ? 'text-green-700' :
                      reward.type === 'service' ? 'text-purple-700' :
                      'text-amber-700'
                    }`}>
                      {t(`loyalty.rewards.type${reward.type.charAt(0).toUpperCase() + reward.type.slice(1)}`)}: {reward.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingReward ? t('loyalty.rewards.edit') : t('loyalty.rewards.add')}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('loyalty.rewards.name')} *
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t('loyalty.rewards.namePlaceholder')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('loyalty.rewards.description')}
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={t('loyalty.rewards.descriptionPlaceholder')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('loyalty.rewards.type')} *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['discount', 'product', 'service', 'cashback'] as RewardType[]).map((type) => {
                    const Icon = typeIcons[type];
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm({ ...form, type })}
                        className={`p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                          form.type === type
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${form.type === type ? 'text-amber-600' : 'text-slate-400'}`} />
                        <span className={`text-sm font-medium ${form.type === type ? 'text-amber-700' : 'text-slate-600'}`}>
                          {t(`loyalty.rewards.type${type.charAt(0).toUpperCase() + type.slice(1)}`)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('loyalty.rewards.value')} *
                </label>
                <Input
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  placeholder={t('loyalty.rewards.valuePlaceholder')}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('loyalty.rewards.pointsCost')} *
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={form.points_cost}
                    onChange={(e) => setForm({ ...form, points_cost: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('loyalty.rewards.quantity')}
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={form.quantity_available ?? ''}
                    onChange={(e) => setForm({ ...form, quantity_available: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder={t('loyalty.rewards.quantityUnlimited')}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  className={`w-12 h-6 rounded-full transition-colors ${form.is_active ? 'bg-amber-500' : 'bg-slate-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-sm font-medium text-slate-700">
                  {t('loyalty.rewards.isActive')}
                </span>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1"
                  disabled={saving}
                >
                  {t('dashboard.common.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-600"
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {t('dashboard.common.save')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
