'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { ChartAreaInteractive } from '@/components/dashboard/ChartAreaInteractive';
import { TrendingUp, TrendingDown, Star, Users, Gift, BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [merchant, setMerchant] = useState<any>(null);
  const [stats, setStats] = useState({
    totalReviews: 0,
    positiveReviews: 0,
    negativeReviews: 0,
    avgRating: 0,
    conversionRate: 0,
    totalSpins: 0,
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

      const totalReviews = feedbackData?.length || 0;
      const positiveReviews = feedbackData?.filter(f => f.is_positive).length || 0;
      const negativeReviews = totalReviews - positiveReviews;
      const avgRating = feedbackData?.reduce((sum, f) => sum + f.rating, 0) / (totalReviews || 1);
      const conversionRate = totalReviews > 0 ? (positiveReviews / totalReviews) * 100 : 0;

      setStats({
        totalReviews,
        positiveReviews,
        negativeReviews,
        avgRating: Math.round(avgRating * 10) / 10,
        conversionRate: Math.round(conversionRate),
        totalSpins: spinsData?.length || 0,
      });
    };

    checkAuth();
  }, [router]);

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-600">Detailed insights into your business performance</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 border-l-4 border-l-teal-500">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-teal-50 rounded-lg">
                <BarChart3 className="w-5 h-5 text-teal-600" />
              </div>
              <TrendingUp className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Reviews</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalReviews}</p>
            <p className="text-xs text-teal-600 mt-2">+12% from last month</p>
          </Card>

          <Card className="p-6 border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Positive Reviews</p>
            <p className="text-3xl font-bold text-gray-900">{stats.positiveReviews}</p>
            <p className="text-xs text-emerald-600 mt-2">+18% from last month</p>
          </Card>

          <Card className="p-6 border-l-4 border-l-red-500">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Negative Reviews</p>
            <p className="text-3xl font-bold text-gray-900">{stats.negativeReviews}</p>
            <p className="text-xs text-red-600 mt-2">-5% from last month</p>
          </Card>

          <Card className="p-6 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Star className="w-5 h-5 text-blue-600" />
              </div>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Average Rating</p>
            <p className="text-3xl font-bold text-gray-900">{stats.avgRating} ⭐</p>
            <p className="text-xs text-blue-600 mt-2">+0.3 from last month</p>
          </Card>
        </div>

        {/* Chart */}
        <ChartAreaInteractive />

        {/* Additional Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Metrics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</p>
                </div>
                <div className="p-3 bg-teal-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-teal-600" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Total Spins</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSpins}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Gift className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Distribution</h3>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = 0; // You can calculate this from feedbackData
                const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 w-8">{rating} ⭐</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-teal-600 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
