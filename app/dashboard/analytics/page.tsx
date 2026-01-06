'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { ChartAreaInteractive } from '@/components/dashboard/ChartAreaInteractive';
import { TrendingUp, TrendingDown, Star, Users, Gift, BarChart3, Calendar, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';

interface FeedbackItem {
  id: string;
  rating: number;
  comment: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  is_positive: boolean;
  created_at: string;
}

interface RatingDistribution {
  [key: number]: number;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [merchant, setMerchant] = useState<any>(null);
  const [feedbackData, setFeedbackData] = useState<FeedbackItem[]>([]);
  const [ratingDistribution, setRatingDistribution] = useState<RatingDistribution>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [chartData, setChartData] = useState<Array<{ date: string; positive: number; negative: number }>>([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    positiveReviews: 0,
    negativeReviews: 0,
    avgRating: 0,
    conversionRate: 0,
    totalSpins: 0,
    thisMonthReviews: 0,
    lastMonthReviews: 0,
    thisMonthPositive: 0,
    lastMonthPositive: 0,
  });
  const [loading, setLoading] = useState(true);

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

      // Fetch all feedback data
      const { data: allFeedback } = await supabase
        .from('feedback')
        .select('*')
        .eq('merchant_id', user.id)
        .order('created_at', { ascending: false });

      const { data: spinsData } = await supabase
        .from('spins')
        .select('*')
        .eq('merchant_id', user.id);

      if (allFeedback) {
        setFeedbackData(allFeedback);

        // Calculate rating distribution
        const distribution: RatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        allFeedback.forEach((f) => {
          if (f.rating >= 1 && f.rating <= 5) {
            distribution[f.rating]++;
          }
        });
        setRatingDistribution(distribution);

        // Process chart data - last 90 days
        const chartMap = new Map<string, { date: string; positive: number; negative: number }>();
        const today = new Date();
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(today.getDate() - 90);

        // Initialize all days with 0
        for (let d = new Date(ninetyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          chartMap.set(dateStr, { date: dateStr, positive: 0, negative: 0 });
        }

        // Fill with actual feedback data
        allFeedback.forEach((f) => {
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

        // Calculate date ranges for trends
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        const thisMonthFeedback = allFeedback.filter(f => new Date(f.created_at) >= thisMonthStart);
        const lastMonthFeedback = allFeedback.filter(f => {
          const date = new Date(f.created_at);
          return date >= lastMonthStart && date <= lastMonthEnd;
        });

        const totalReviews = allFeedback.length;
        const positiveReviews = allFeedback.filter(f => f.is_positive).length;
        const negativeReviews = totalReviews - positiveReviews;
        const avgRating = allFeedback.reduce((sum, f) => sum + f.rating, 0) / (totalReviews || 1);
        const conversionRate = totalReviews > 0 ? (positiveReviews / totalReviews) * 100 : 0;

        setStats({
          totalReviews,
          positiveReviews,
          negativeReviews,
          avgRating: Math.round(avgRating * 10) / 10,
          conversionRate: Math.round(conversionRate),
          totalSpins: spinsData?.length || 0,
          thisMonthReviews: thisMonthFeedback.length,
          lastMonthReviews: lastMonthFeedback.length,
          thisMonthPositive: thisMonthFeedback.filter(f => f.is_positive).length,
          lastMonthPositive: lastMonthFeedback.filter(f => f.is_positive).length,
        });
      }

      setLoading(false);
    };

    checkAuth();
  }, [router]);

  // Calculate trend percentages
  const calculateTrend = (current: number, previous: number): { value: number; isPositive: boolean } => {
    if (previous === 0) return { value: current > 0 ? 100 : 0, isPositive: current >= 0 };
    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(Math.round(change)), isPositive: change >= 0 };
  };

  const reviewsTrend = calculateTrend(stats.thisMonthReviews, stats.lastMonthReviews);
  const positiveTrend = calculateTrend(stats.thisMonthPositive, stats.lastMonthPositive);

  if (loading || !user || !merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout merchant={merchant}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-600">Analyses détaillées de la performance de votre établissement</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 border-l-4 border-l-teal-500">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-teal-50 rounded-lg">
                <BarChart3 className="w-5 h-5 text-teal-600" />
              </div>
              {reviewsTrend.isPositive ? (
                <TrendingUp className="w-4 h-4 text-teal-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Avis</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalReviews}</p>
            <p className={`text-xs mt-2 ${reviewsTrend.isPositive ? 'text-teal-600' : 'text-red-600'}`}>
              {reviewsTrend.isPositive ? '+' : '-'}{reviewsTrend.value}% ce mois
            </p>
          </Card>

          <Card className="p-6 border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <ThumbsUp className="w-5 h-5 text-emerald-600" />
              </div>
              {positiveTrend.isPositive ? (
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
            </div>
            <p className="text-sm text-gray-600 mb-1">Avis Positifs (4-5⭐)</p>
            <p className="text-3xl font-bold text-gray-900">{stats.positiveReviews}</p>
            <p className={`text-xs mt-2 ${positiveTrend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              {positiveTrend.isPositive ? '+' : '-'}{positiveTrend.value}% ce mois
            </p>
          </Card>

          <Card className="p-6 border-l-4 border-l-red-500">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <ThumbsDown className="w-5 h-5 text-red-600" />
              </div>
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Avis Négatifs (1-3⭐)</p>
            <p className="text-3xl font-bold text-gray-900">{stats.negativeReviews}</p>
            <p className="text-xs text-gray-500 mt-2">
              {stats.totalReviews > 0 ? Math.round((stats.negativeReviews / stats.totalReviews) * 100) : 0}% du total
            </p>
          </Card>

          <Card className="p-6 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Star className="w-5 h-5 text-blue-600" />
              </div>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Note Moyenne</p>
            <p className="text-3xl font-bold text-gray-900">{stats.avgRating} ⭐</p>
            <p className="text-xs text-blue-600 mt-2">Sur 5 étoiles</p>
          </Card>
        </div>

        {/* Chart */}
        <ChartAreaInteractive data={chartData} />

        {/* Review Distribution and Conversion Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Distribution des Notes
            </h3>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingDistribution[rating] || 0;
                const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                const barColor = rating >= 4 ? 'bg-emerald-500' : rating === 3 ? 'bg-amber-500' : 'bg-red-500';
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 w-12">{rating} ⭐</span>
                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 w-10 text-right">{count}</span>
                    <span className="text-xs text-gray-500 w-12 text-right">({Math.round(percentage)}%)</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{stats.totalReviews}</span> avis au total
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-600" />
              Métriques de Conversion
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Taux de Satisfaction</p>
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
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Avis ce mois</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.thisMonthReviews}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Reviews Analysis Table */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            Analyse des Avis Récents
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Note</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sentiment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Commentaire</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {feedbackData.length > 0 ? (
                  feedbackData.slice(0, 10).map((feedback) => (
                    <tr key={feedback.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(feedback.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-700">
                          {feedback.customer_email || feedback.customer_phone || 'Anonyme'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= feedback.rating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {feedback.is_positive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                            <ThumbsUp className="w-3 h-3" />
                            Positif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">
                            <ThumbsDown className="w-3 h-3" />
                            Négatif
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600 truncate max-w-xs">
                          {feedback.comment || <span className="text-gray-400 italic">Pas de commentaire</span>}
                        </p>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-lg font-medium text-gray-900">Aucun avis pour le moment</p>
                      <p className="text-sm">Les avis de vos clients apparaîtront ici.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {feedbackData.length > 10 && (
            <div className="mt-4 pt-4 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                Affichage des 10 derniers avis sur <span className="font-semibold">{feedbackData.length}</span> au total
              </p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
