'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChartAreaInteractive } from '@/components/dashboard/ChartAreaInteractive';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/config';
import { 
  TrendingUp, 
  Copy, 
  ArrowUpRight,
  Star,
  Users,
  Gift,
  RotateCw,
  MessageSquare,
  ScanLine,
  BarChart3
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation(undefined, { useSuspense: false });
  const [user, setUser] = useState<any>(null);
  const [merchant, setMerchant] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    avgRating: 0,
    totalSpins: 0,
    rewardsRedeemed: 0,
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

      // Fetch all necessary data
      // Optimization: In a real large-scale app, we would use .count() or specific RPC calls
      // but for a single merchant dashboard, fetching lists is acceptable for now.
      
      const { data: feedbackData } = await supabase
        .from('feedback')
        .select('rating, is_positive, created_at, comment')
        .eq('merchant_id', user.id)
        .order('created_at', { ascending: false });

      const { count: spinsCount } = await supabase
        .from('spins')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', user.id);

      const { data: couponsData } = await supabase
        .from('coupons')
        .select('used')
        .eq('merchant_id', user.id);

      const totalReviews = feedbackData?.length || 0;
      const avgRating = (feedbackData || []).reduce((sum, f) => sum + f.rating, 0) / (totalReviews || 1);
      const totalSpins = spinsCount || 0;
      const rewardsRedeemed = couponsData?.filter(c => c.used).length || 0;

      setStats({
        totalReviews,
        avgRating: Math.round(avgRating * 10) / 10,
        totalSpins,
        rewardsRedeemed,
      });

      // Recent activity from feedback
      const activity = feedbackData?.slice(0, 5).map((f: any, idx: number) => ({
        id: idx,
        type: f.is_positive ? 'positive' : 'negative',
        rating: f.rating,
        comment: f.comment,
        date: f.created_at,
      })) || [];
      
      setRecentActivity(activity);

      // Process chart data (last 90 days)
      const chartMap = new Map<string, { date: string; positive: number; negative: number }>();
      const today = new Date();
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(today.getDate() - 90);

      // Initialize map with 0 values for last 90 days
      for (let d = new Date(ninetyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        chartMap.set(dateStr, { date: dateStr, positive: 0, negative: 0 });
      }

      // Fill with actual data
      feedbackData?.forEach((f: any) => {
        const dateStr = new Date(f.created_at).toISOString().split('T')[0];
        if (chartMap.has(dateStr)) {
          const entry = chartMap.get(dateStr)!;
          if (f.is_positive) {
            entry.positive += 1;
          } else {
            entry.negative += 1;
          }
        }
      });

      setChartData(Array.from(chartMap.values()));
    };

    checkAuth();
  }, [router]);

  if (!user || !merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-slate-600">{t('dashboard.common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout merchant={merchant}>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {t('dashboard.welcome', { name: merchant.business_name || 'Commerçant' })}
            </h2>
            <p className="text-slate-500 mt-1">
              {t('dashboard.welcomeSubtitle')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
              {new Date().toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Reviews */}
          <Card className="p-6 border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <MessageSquare className="w-6 h-6" />
              </div>
              <Badge className="bg-green-50 text-green-700 hover:bg-green-100 border-green-100">
                <TrendingUp className="w-3 h-3 mr-1" /> +12%
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{t('dashboard.totalReviews')}</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.totalReviews}</h3>
            </div>
          </Card>

          {/* Average Rating */}
          <Card className="p-6 border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Star className="w-6 h-6" />
              </div>
              <Badge className="bg-green-50 text-green-700 hover:bg-green-100 border-green-100">
                Top 5%
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{t('dashboard.avgRating')}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-3xl font-bold text-slate-900">{stats.avgRating}</h3>
                <span className="text-sm text-slate-400">/ 5.0</span>
              </div>
            </div>
          </Card>

          {/* Total Spins */}
          <Card className="p-6 border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <RotateCw className="w-6 h-6" />
              </div>
              <Badge className="bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-100">
                Actif
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{t('dashboard.totalSpins')}</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.totalSpins}</h3>
            </div>
          </Card>

          {/* Prizes Redeemed */}
          <Card className="p-6 border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Gift className="w-6 h-6" />
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100">
                Revenus
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{t('dashboard.rewards')}</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.rewardsRedeemed}</h3>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <Card className="lg:col-span-2 p-6 border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t('dashboard.activity.title')}</h3>
                <p className="text-sm text-slate-500">{t('dashboard.activity.subtitle')}</p>
              </div>
            </div>
            <ChartAreaInteractive data={chartData} />
          </Card>

          {/* Recent Activity Feed */}
          <Card className="p-6 border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">{t('dashboard.recentReviews.title')}</h3>
            <div className="space-y-6">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className={`
                      flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                      ${activity.rating >= 4 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}
                    `}>
                      {activity.rating}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {t('dashboard.recentReviews.newCustomer')}
                        </p>
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {new Date(activity.date).toLocaleDateString(i18n.language)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                        {activity.comment || t('dashboard.recentReviews.noComment')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm">
                  {t('dashboard.recentReviews.noReviews')}
                </div>
              )}
              
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => router.push('/dashboard/feedback')}
              >
                {t('dashboard.recentReviews.viewAll')}
              </Button>
            </div>
          </Card>
        </div>

        {/* Quick Actions & Link */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions Grid */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4">{t('dashboard.quickActions.title')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => router.push('/dashboard/scan')}
                className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all text-left group"
              >
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <ScanLine className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-slate-900">{t('dashboard.quickActions.scan')}</h4>
                <p className="text-xs text-slate-500 mt-1">{t('dashboard.quickActions.scanDesc')}</p>
              </button>

              <button 
                onClick={() => router.push('/dashboard/prizes')}
                className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all text-left group"
              >
                <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-pink-600 group-hover:text-white transition-colors">
                  <Gift className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-slate-900">{t('dashboard.quickActions.prizes')}</h4>
                <p className="text-xs text-slate-500 mt-1">{t('dashboard.quickActions.prizesDesc')}</p>
              </button>

              <button 
                onClick={() => router.push('/dashboard/feedback')}
                className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all text-left group"
              >
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Star className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-slate-900">{t('dashboard.quickActions.reviews')}</h4>
                <p className="text-xs text-slate-500 mt-1">{t('dashboard.quickActions.reviewsDesc')}</p>
              </button>

              <button 
                onClick={() => router.push('/dashboard/analytics')}
                className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all text-left group"
              >
                <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-slate-900">{t('dashboard.quickActions.analytics')}</h4>
                <p className="text-xs text-slate-500 mt-1">{t('dashboard.quickActions.analyticsDesc')}</p>
              </button>
            </div>
          </div>

          {/* Review Link Card */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4">{t('dashboard.reviewLink.title')}</h3>
            <Card className="p-6 border-slate-100 shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-lg font-semibold text-white">{t('dashboard.reviewLink.publicLink')}</h4>
                  <p className="text-sm text-slate-400 mt-1">{t('dashboard.reviewLink.desc')}</p>
                </div>
                <div className="p-2 bg-white/10 rounded-lg">
                  <ArrowUpRight className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="bg-black/30 rounded-lg p-4 mb-6 border border-white/10">
                <code className="text-sm font-mono text-emerald-400 break-all">
                  {process.env.NEXT_PUBLIC_APP_URL}/rate/{user.id}
                </code>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL}/rate/${user.id}`);
                    alert(t('dashboard.reviewLink.copied'));
                  }}
                  className="bg-white text-slate-900 hover:bg-slate-100 border-0"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {t('dashboard.reviewLink.copy')}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/dashboard/qr')}
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  <ScanLine className="w-4 h-4 mr-2" />
                  {t('dashboard.reviewLink.qrCode')}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
