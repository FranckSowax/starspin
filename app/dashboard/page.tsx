'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChartAreaInteractive } from '@/components/dashboard/ChartAreaInteractive';
import { 
  TrendingUp, 
  TrendingDown, 
  Copy, 
  ArrowUpRight,
  Star,
  Users,
  Gift,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [merchant, setMerchant] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalScans: 0,
    avgRating: 0,
    conversionRate: 0,
    rewardsDistributed: 0,
    totalRevenue: 0,
    positiveReviews: 0,
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
        totalRevenue: totalScans * 2.5,
        positiveReviews,
      });

      // Get recent activity (last 5 feedback items)
      const recentFeedback = feedbackData?.slice(0, 5).map(f => ({
        id: f.id,
        type: f.is_positive ? 'positive' : 'negative',
        rating: f.rating,
        comment: f.comment,
        date: f.created_at,
        status: f.is_positive ? 'success' : 'pending'
      })) || [];
      
      setRecentActivity(recentFeedback);
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
        {/* Date Range Selector */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1.5 text-sm">
              <Calendar className="w-4 h-4 mr-2" />
              Last 30 days
            </Badge>
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
              Export
            </Button>
          </div>
        </div>

        {/* Hero Card - Total Balance */}
        <Card className="bg-gradient-to-br from-teal-600 to-teal-700 border-0 shadow-xl">
          <div className="p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-teal-100 text-sm font-medium mb-2">Total Reviews</p>
                <div className="flex items-baseline gap-3 mb-1">
                  <h2 className="text-5xl font-bold text-white">{stats.totalScans}</h2>
                  <div className="flex items-center gap-1 text-teal-100">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-semibold">16.5%</span>
                  </div>
                </div>
                <p className="text-teal-100 text-sm">vs. previous period</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Add
                </Button>
                <Button size="sm" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                  Manage
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Chart */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chart */}
            <ChartAreaInteractive />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-5 hover:shadow-lg transition-shadow border-l-4 border-l-teal-500">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-teal-50 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-teal-600" />
                  </div>
                  <span className="text-xs text-gray-500">Last 30 days</span>
                </div>
                <p className="text-sm text-gray-600 mb-1">Positive Reviews</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-gray-900">{stats.positiveReviews}</p>
                  <span className="text-xs text-teal-600 font-semibold">+16.0%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">vs. {stats.positiveReviews - 12} Last Period</p>
              </Card>

              <Card className="p-5 hover:shadow-lg transition-shadow border-l-4 border-l-emerald-500">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-xs text-gray-500">Last 30 days</span>
                </div>
                <p className="text-sm text-gray-600 mb-1">Total Saving</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</p>
                  <span className="text-xs text-red-600 font-semibold">-8.2%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">vs. {stats.conversionRate + 3}% Last Period</p>
              </Card>

              <Card className="p-5 hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Gift className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-xs text-gray-500">Last 30 days</span>
                </div>
                <p className="text-sm text-gray-600 mb-1">Rewards Given</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-gray-900">{stats.rewardsDistributed}</p>
                  <span className="text-xs text-teal-600 font-semibold">+35.2%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">vs. {stats.rewardsDistributed - 8} Last Period</p>
              </Card>
            </div>
          </div>

          {/* Right Column - Income/Expense & Cards */}
          <div className="space-y-6">
            {/* Income Card */}
            <Card className="p-6 bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-teal-600 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-gray-600">Last 30 days</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">Positive Reviews</p>
              <div className="flex items-baseline gap-2 mb-1">
                <h3 className="text-3xl font-bold text-gray-900">{stats.positiveReviews}</h3>
                <span className="text-sm text-teal-600 font-semibold">+46.0%</span>
              </div>
            </Card>

            {/* Expense Card */}
            <Card className="p-6 bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-red-600 rounded-xl">
                  <TrendingDown className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-gray-600">Last 30 days</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">Negative Feedback</p>
              <div className="flex items-baseline gap-2 mb-1">
                <h3 className="text-3xl font-bold text-gray-900">{stats.totalScans - stats.positiveReviews}</h3>
                <span className="text-sm text-red-600 font-semibold">-12.6%</span>
              </div>
            </Card>

            {/* QR Card */}
            <Card className="p-6 bg-gradient-to-br from-teal-600 to-teal-700 border-0 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-xl">💳</span>
                  </div>
                  <div>
                    <p className="text-xs text-teal-100">VISA</p>
                    <p className="text-xs text-teal-100">•••• •••• •••• 2104</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/10">
                  See All
                </Button>
              </div>
              <p className="text-3xl font-bold mb-2">★ {stats.avgRating}</p>
              <p className="text-sm text-teal-100">Average Rating</p>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" className="text-sm">
                  Filter
                </Button>
                <Button size="sm" variant="ghost" className="text-sm">
                  Sort
                </Button>
              </div>
            </div>
          </div>
          <div className="divide-y">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-2 rounded-lg ${
                        activity.type === 'positive' ? 'bg-teal-50' : 'bg-red-50'
                      }`}>
                        {activity.type === 'positive' ? (
                          <TrendingUp className="w-5 h-5 text-teal-600" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900">
                            {activity.type === 'positive' ? 'Positive Review' : 'Feedback Received'}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {activity.rating} ⭐
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {activity.comment || 'No comment provided'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {new Date(activity.date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge 
                        className={activity.status === 'success' 
                          ? 'bg-teal-100 text-teal-700 border-teal-200' 
                          : 'bg-orange-100 text-orange-700 border-orange-200'
                        }
                      >
                        {activity.status === 'success' ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <Clock className="w-3 h-3 mr-1" />
                        )}
                        {activity.status === 'success' ? 'Success' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => router.push('/dashboard/prizes')} 
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-teal-50 hover:border-teal-600 hover:text-teal-700"
              >
                <Gift className="w-5 h-5" />
                <span className="text-sm font-medium">Prizes</span>
              </Button>
              <Button 
                onClick={() => router.push('/dashboard/qr')} 
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-teal-50 hover:border-teal-600 hover:text-teal-700"
              >
                <BarChart3 className="w-5 h-5" />
                <span className="text-sm font-medium">QR Code</span>
              </Button>
              <Button 
                onClick={() => router.push('/dashboard/feedback')} 
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-teal-50 hover:border-teal-600 hover:text-teal-700"
              >
                <Star className="w-5 h-5" />
                <span className="text-sm font-medium">Feedback</span>
              </Button>
              <Button 
                onClick={() => router.push('/dashboard/analytics')} 
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-teal-50 hover:border-teal-600 hover:text-teal-700"
              >
                <Users className="w-5 h-5" />
                <span className="text-sm font-medium">Analytics</span>
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
