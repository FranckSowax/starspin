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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option>Mar - Apr 2021</option>
              <option>Last 30 days</option>
              <option>Last 7 days</option>
            </select>
          </div>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Now */}
          <Card className="p-5 bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-pink-500 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm text-gray-600">Active now</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.positiveReviews}</p>
          </Card>

          {/* Total Users */}
          <Card className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm text-gray-600">Total users</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalScans}</p>
          </Card>

          {/* Total Reviews */}
          <Card className="p-5 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Star className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm text-gray-600">Total review</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalScans}</p>
          </Card>

          {/* New Reviews */}
          <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm text-gray-600">New review</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.rewardsDistributed}</p>
          </Card>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Chart */}
          <div className="lg:col-span-2 space-y-6">
            {/* Reviews Chart */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Reviews in the last 1 month</h3>
                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
              </div>
              <ChartAreaInteractive />
            </Card>

            {/* Data Distribution */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Data distribution</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">5 Stars</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-gray-900">{Math.round(stats.positiveReviews * 0.6)}</span>
                    <div className="w-16 h-8">
                      <svg viewBox="0 0 64 32" className="w-full h-full">
                        <path d="M0,16 Q16,8 32,12 T64,16" fill="none" stroke="#ec4899" strokeWidth="2"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">4 Stars</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-gray-900">{Math.round(stats.positiveReviews * 0.3)}</span>
                    <div className="w-16 h-8">
                      <svg viewBox="0 0 64 32" className="w-full h-full">
                        <path d="M0,20 Q16,12 32,16 T64,20" fill="none" stroke="#3b82f6" strokeWidth="2"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">3 Stars</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-gray-900">{Math.round((stats.totalScans - stats.positiveReviews) * 0.5)}</span>
                    <div className="w-16 h-8">
                      <svg viewBox="0 0 64 32" className="w-full h-full">
                        <path d="M0,18 Q16,14 32,18 T64,18" fill="none" stroke="#f97316" strokeWidth="2"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Others</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-gray-900">{Math.round((stats.totalScans - stats.positiveReviews) * 0.5)}</span>
                    <div className="w-16 h-8">
                      <svg viewBox="0 0 64 32" className="w-full h-full">
                        <path d="M0,22 Q16,18 32,20 T64,22" fill="none" stroke="#6b7280" strokeWidth="2"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <Button className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white">
                See Details
              </Button>
            </Card>
          </div>

          {/* Right Column - Device Usage & Recent Reviews */}
          <div className="space-y-6">
            {/* Use by Device */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Use by device</h3>
                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
              </div>
              <div className="flex justify-center mb-6">
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12"/>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#14b8a6" strokeWidth="12" strokeDasharray="{Math.PI * 80 * 0.5} {Math.PI * 80}" strokeLinecap="round"/>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="12" strokeDasharray="{Math.PI * 80 * 0.3} {Math.PI * 80}" strokeDashoffset="-{Math.PI * 80 * 0.5}" strokeLinecap="round"/>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f97316" strokeWidth="12" strokeDasharray="{Math.PI * 80 * 0.2} {Math.PI * 80}" strokeDashoffset="-{Math.PI * 80 * 0.8}" strokeLinecap="round"/>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">65%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Desktop</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Mobile</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Others</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* New Reviews */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">New reviews</h3>
                  <p className="text-xs text-teal-600 mt-1">+49 this month</p>
                </div>
              </div>
              <div className="space-y-4">
                {recentActivity.slice(0, 5).map((activity, idx) => (
                  <div key={activity.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Customer {idx + 1}</p>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${
                          activity.type === 'positive' 
                            ? 'bg-teal-100 text-teal-700' 
                            : 'bg-pink-100 text-pink-700'
                        }`}>
                          {activity.type === 'positive' ? 'Freelancer' : 'Customer'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-4 text-sm text-gray-600 hover:text-gray-900">
                View all
              </Button>
            </Card>
          </div>
        </div>

        {/* New Users Section */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">New users</h3>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* New Users This Week Chart */}
            <div>
              <p className="text-sm text-gray-600 mb-2">New users this week</p>
              <div className="flex items-baseline gap-2 mb-4">
                <p className="text-4xl font-bold text-gray-900">{Math.round(stats.totalScans * 0.3)}</p>
                <span className="text-sm text-teal-600 font-semibold">+7.8%</span>
              </div>
              <div className="h-24 flex items-end gap-1">
                {[40, 60, 45, 70, 55, 80, 65].map((height, idx) => (
                  <div key={idx} className="flex-1 bg-gradient-to-t from-purple-200 to-purple-400 rounded-t" style={{ height: `${height}%` }}></div>
                ))}
              </div>
            </div>

            {/* New Users This Month Chart */}
            <div>
              <p className="text-sm text-gray-600 mb-2">New users this month</p>
              <div className="flex items-baseline gap-2 mb-4">
                <p className="text-4xl font-bold text-gray-900">{Math.round(stats.totalScans * 0.8)}</p>
                <span className="text-sm text-teal-600 font-semibold">+6.27%</span>
              </div>
              <div className="h-24 flex items-end gap-1">
                {[50, 70, 55, 85, 65, 90, 75].map((height, idx) => (
                  <div key={idx} className="flex-1 bg-gradient-to-t from-orange-200 to-orange-400 rounded-t" style={{ height: `${height}%` }}></div>
                ))}
              </div>
            </div>
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
