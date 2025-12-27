'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Copy, ArrowUpRight } from 'lucide-react';

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

  if (!user || !merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#2D6A4F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout merchant={merchant}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {merchant.business_name || merchant.name}! 👋
          </h1>
          <p className="text-gray-600">Here's what's happening with your business today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-600">Total Scans</p>
              <div className="p-2 bg-blue-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">{stats.totalScans}</p>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-green-600 font-medium">+12%</span>
              <span className="text-gray-500">vs last month</span>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-600">Average Rating</p>
              <div className="p-2 bg-yellow-50 rounded-lg">
                <span className="text-2xl">⭐</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">{stats.avgRating}</p>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-green-600 font-medium">+0.3</span>
              <span className="text-gray-500">vs last month</span>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <div className="p-2 bg-green-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">{stats.conversionRate}%</p>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-green-600 font-medium">+5%</span>
              <span className="text-gray-500">vs last month</span>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-600">Rewards Given</p>
              <div className="p-2 bg-purple-50 rounded-lg">
                <span className="text-2xl">🎁</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">{stats.rewardsDistributed}</p>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-green-600 font-medium">+18%</span>
              <span className="text-gray-500">vs last month</span>
            </div>
          </Card>
        </div>

        {/* Quick Actions & QR Code */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={() => router.push('/dashboard/prizes')} 
                className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#2D6A4F] to-[#52B788] hover:from-[#1B4332] hover:to-[#2D6A4F]"
              >
                <span className="text-2xl">🎁</span>
                <span>Manage Prizes</span>
              </Button>
              <Button 
                onClick={() => router.push('/dashboard/qr')} 
                className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                <span className="text-2xl">📱</span>
                <span>QR Code</span>
              </Button>
              <Button 
                onClick={() => router.push('/dashboard/feedback')} 
                className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                <span className="text-2xl">💬</span>
                <span>Feedback</span>
              </Button>
              <Button 
                onClick={() => router.push('/dashboard/analytics')} 
                className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
              >
                <span className="text-2xl">📊</span>
                <span>Analytics</span>
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Your Review Link</h3>
            <p className="text-sm text-gray-600 mb-4">
              Share this link with your customers to collect reviews
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-4 border-2 border-gray-200">
              <code className="text-sm break-all text-gray-700">
                {`${process.env.NEXT_PUBLIC_APP_URL}/rate/${user.id}`}
              </code>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL}/rate/${user.id}`);
                  alert('Link copied to clipboard!');
                }}
                className="flex-1 gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Link
              </Button>
              <Button
                onClick={() => router.push('/dashboard/qr')}
                variant="outline"
                className="gap-2"
              >
                <ArrowUpRight className="w-4 h-4" />
                View QR
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
