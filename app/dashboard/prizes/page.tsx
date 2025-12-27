'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Prize } from '@/lib/types/database';

export default function PrizesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Prize Management</h1>
            <Button onClick={() => router.push('/dashboard')} variant="outline" size="sm">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Prizes</h2>
            <p className="text-gray-600">
              Total Probability: {totalProbability}% 
              {totalProbability !== 100 && (
                <span className="text-red-500 ml-2">(Must equal 100%)</span>
              )}
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add Prize'}
          </Button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
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
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prizes.map((prize) => (
            <div key={prize.id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{prize.name}</h3>
              {prize.description && (
                <p className="text-gray-600 mb-4">{prize.description}</p>
              )}
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-600">Probability:</span>
                <span className="text-lg font-bold text-[#FF6F61]">{prize.probability}%</span>
              </div>
              <Button
                onClick={() => handleDelete(prize.id)}
                variant="outline"
                size="sm"
                className="w-full text-red-600 border-red-600 hover:bg-red-50"
              >
                Delete
              </Button>
            </div>
          ))}
        </div>

        {prizes.length === 0 && !showForm && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No prizes yet. Add your first prize to get started!</p>
          </div>
        )}
      </main>
    </div>
  );
}
