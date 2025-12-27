'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/atoms/Input';
import { Prize } from '@/lib/types/database';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

export default function PrizesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [merchant, setMerchant] = useState<any>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    probability: 0,
  });
  const [loading, setLoading] = useState(false);

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
      fetchPrizes(user.id);
    };

    checkAuth();
  }, [router]);

  const fetchPrizes = async (merchantId: string) => {
    const { data } = await supabase
      .from('prizes')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    setPrizes(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('prizes').insert({
      merchant_id: user.id,
      name: formData.name,
      description: formData.description,
      probability: formData.probability,
    });

    setLoading(false);

    if (!error) {
      setShowForm(false);
      setFormData({ name: '', description: '', probability: 0 });
      fetchPrizes(user.id);
    }
  };

  const handleDelete = async (prizeId: string) => {
    if (!confirm('Are you sure you want to delete this prize?')) return;

    await supabase.from('prizes').delete().eq('id', prizeId);
    fetchPrizes(user.id);
  };

  const totalProbability = prizes.reduce((sum, p) => sum + p.probability, 0);

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
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Prize Management</h1>
            <div className="flex items-center gap-2">
              <p className="text-gray-600">
                Total Probability: <span className="font-semibold">{totalProbability}%</span>
              </p>
              {totalProbability !== 100 && (
                <div className="flex items-center gap-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>Must equal 100%</span>
                </div>
              )}
            </div>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            {showForm ? (
              <>
                <span>Cancel</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Add Prize</span>
              </>
            )}
          </Button>
        </div>

        {showForm && (
          <Card className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Prize</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Prize Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="10% Discount"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Get 10% off your next purchase"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6F61]"
                  rows={3}
                />
              </div>

              <Input
                type="number"
                label="Probability (%)"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: parseFloat(e.target.value) })}
                placeholder="20"
                min="0"
                max="100"
                step="0.1"
                required
              />

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Adding...' : 'Add Prize'}
              </Button>
            </form>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prizes.map((prize) => (
            <Card key={prize.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-bold text-gray-900">{prize.name}</h3>
                <div className="px-3 py-1 bg-[#2D6A4F]/10 rounded-full">
                  <span className="text-sm font-bold text-[#2D6A4F]">{prize.probability}%</span>
                </div>
              </div>
              {prize.description && (
                <p className="text-gray-600 mb-4 text-sm">{prize.description}</p>
              )}
              <Button
                onClick={() => handleDelete(prize.id)}
                variant="outline"
                className="w-full text-red-600 border-red-600 hover:bg-red-50 gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Prize
              </Button>
            </Card>
          ))}
        </div>

        {prizes.length === 0 && !showForm && (
          <Card className="p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🎁</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No prizes yet</h3>
              <p className="text-gray-600 mb-6">Add your first prize to get started with the reward wheel!</p>
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Your First Prize
              </Button>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
