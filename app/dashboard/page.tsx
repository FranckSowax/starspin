'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/atoms/Button';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [merchant, setMerchant] = useState<any>(null);
  const [stats, setStats] = useState({
    totalScans: 0,
    avgRating: 0,
    conversionRate: 0,
    rewardsDistributed: 0,
  });

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

      const { data: feedbackData } = await supabase
        .from('feedback')
        .select('*')
        .eq('merchant_id', user.id);

      const { data: spinsData } = await supabase
        .from('spins')
        .select('*')
        .eq('merchant_id', user.id);

      const totalScans = feedbackData?.length || 0;
      const avgRating = feedbackData?.reduce((sum, f) => sum + f.rating, 0) / (totalScans || 1);
      const positiveReviews = feedbackData?.filter(f => f.is_positive).length || 0;
      const conversionRate = totalScans > 0 ? (positiveReviews / totalScans) * 100 : 0;
      const rewardsDistributed = spinsData?.length || 0;

      setStats({
        totalScans,
        avgRating: Math.round(avgRating * 10) / 10,
        conversionRate: Math.round(conversionRate),
        rewardsDistributed,
      });
    };

    checkAuth();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (!user || !merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">StarSpin Dashboard</h1>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {merchant.business_name || merchant.name}!
          </h2>
          <p className="text-gray-600">Subscription: {merchant.subscription_tier}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">Total Scans</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalScans}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">Average Rating</p>
            <p className="text-3xl font-bold text-gray-900">{stats.avgRating} ⭐</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">Conversion Rate</p>
            <p className="text-3xl font-bold text-gray-900">{stats.conversionRate}%</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">Rewards Distributed</p>
            <p className="text-3xl font-bold text-gray-900">{stats.rewardsDistributed}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button onClick={() => router.push('/dashboard/prizes')} className="w-full">
                Manage Prizes
              </Button>
              <Button onClick={() => router.push('/dashboard/qr')} className="w-full" variant="secondary">
                Generate QR Code
              </Button>
              <Button onClick={() => router.push('/dashboard/feedback')} className="w-full" variant="outline">
                View Feedback
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Your QR Code Link</h3>
            <div className="bg-gray-50 rounded p-4 mb-4">
              <code className="text-sm break-all">
                {`${process.env.NEXT_PUBLIC_APP_URL}/rate/${user.id}`}
              </code>
            </div>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL}/rate/${user.id}`);
                alert('Link copied to clipboard!');
              }}
              variant="outline"
              className="w-full"
            >
              Copy Link
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
