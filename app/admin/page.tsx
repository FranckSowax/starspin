'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Store, 
  QrCode, 
  Download, 
  ExternalLink, 
  Search,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  Eye,
  Copy,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import QRCode from 'qrcode';

interface Merchant {
  id: string;
  email: string;
  business_name: string;
  subscription_tier: string;
  logo_url?: string;
  background_url?: string;
  created_at: string;
  is_active?: boolean;
  google_maps_url?: string;
  tripadvisor_url?: string;
  tiktok_url?: string;
  instagram_url?: string;
  redirect_strategy?: string;
}

interface MerchantStats {
  totalReviews: number;
  positiveReviews: number;
  avgRating: number;
  totalSpins: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [filteredMerchants, setFilteredMerchants] = useState<Merchant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMerchants: 0,
    activeMerchants: 0,
    totalReviews: 0,
    totalRevenue: 0,
  });
  const [selectedMerchant, setSelectedMerchant] = useState<string | null>(null);
  const [merchantStats, setMerchantStats] = useState<Record<string, MerchantStats>>({});

  useEffect(() => {
    checkAdminAuth();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = merchants.filter(m => 
        m.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMerchants(filtered);
    } else {
      setFilteredMerchants(merchants);
    }
  }, [searchQuery, merchants]);

  const checkAdminAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // TODO: Add admin check here
    // For now, any authenticated user can access
    // In production, check if user.email is in admin list or has is_admin flag
    
    setUser(user);
    await loadMerchants();
    setLoading(false);
  };

  const loadMerchants = async () => {
    const { data: merchantsData } = await supabase
      .from('merchants')
      .select('*')
      .order('created_at', { ascending: false });

    if (merchantsData) {
      setMerchants(merchantsData);
      setFilteredMerchants(merchantsData);

      // Load stats for each merchant
      const statsPromises = merchantsData.map(async (merchant) => {
        const { data: feedbackData } = await supabase
          .from('feedback')
          .select('*')
          .eq('merchant_id', merchant.id);

        const { data: spinsData } = await supabase
          .from('spins')
          .select('*')
          .eq('merchant_id', merchant.id);

        const totalReviews = feedbackData?.length || 0;
        const positiveReviews = feedbackData?.filter(f => f.is_positive).length || 0;
        const avgRating = feedbackData?.reduce((sum, f) => sum + f.rating, 0) / (totalReviews || 1);

        return {
          merchantId: merchant.id,
          stats: {
            totalReviews,
            positiveReviews,
            avgRating: Math.round(avgRating * 10) / 10,
            totalSpins: spinsData?.length || 0,
          }
        };
      });

      const statsResults = await Promise.all(statsPromises);
      const statsMap: Record<string, MerchantStats> = {};
      statsResults.forEach(({ merchantId, stats }) => {
        statsMap[merchantId] = stats;
      });
      setMerchantStats(statsMap);

      // Calculate global stats
      const totalReviews = Object.values(statsMap).reduce((sum, s) => sum + s.totalReviews, 0);
      setStats({
        totalMerchants: merchantsData.length,
        activeMerchants: merchantsData.filter(m => m.is_active !== false).length,
        totalReviews,
        totalRevenue: totalReviews * 2.5, // Example calculation
      });
    }
  };

  const downloadQRCode = async (merchantId: string, businessName: string) => {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/rate/${merchantId}`;
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: {
        dark: '#2D6A4F',
        light: '#FFFFFF',
      },
    });

    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${businessName.replace(/\s+/g, '-')}-QR.png`;
    link.click();
  };

  const copyRateLink = (merchantId: string) => {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/rate/${merchantId}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Super Dashboard Admin</h1>
              <p className="text-gray-600 mt-1">Gestion des marchands et QR codes</p>
            </div>
            <Button
              onClick={() => supabase.auth.signOut().then(() => router.push('/auth/login'))}
              variant="outline"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 border-l-4 border-l-teal-500">
            <div className="flex items-center justify-between mb-2">
              <Store className="w-8 h-8 text-teal-600" />
              <TrendingUp className="w-5 h-5 text-teal-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Marchands</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalMerchants}</p>
            <p className="text-xs text-teal-600 mt-2">{stats.activeMerchants} actifs</p>
          </Card>

          <Card className="p-6 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-600" />
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Reviews</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalReviews}</p>
            <p className="text-xs text-blue-600 mt-2">Tous marchands confondus</p>
          </Card>

          <Card className="p-6 border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-emerald-600" />
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Revenue Estimé</p>
            <p className="text-3xl font-bold text-gray-900">${stats.totalRevenue.toFixed(0)}</p>
            <p className="text-xs text-emerald-600 mt-2">Basé sur reviews</p>
          </Card>

          <Card className="p-6 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8 text-purple-600" />
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Avg Reviews/Shop</p>
            <p className="text-3xl font-bold text-gray-900">
              {stats.totalMerchants > 0 ? (stats.totalReviews / stats.totalMerchants).toFixed(1) : '0'}
            </p>
            <p className="text-xs text-purple-600 mt-2">Performance moyenne</p>
          </Card>
        </div>

        {/* Search */}
        <Card className="p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </Card>

        {/* Merchants List */}
        <Card>
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Liste des Marchands</h2>
            <p className="text-sm text-gray-600 mt-1">{filteredMerchants.length} marchands trouvés</p>
          </div>
          <div className="divide-y">
            {filteredMerchants.map((merchant) => {
              const stats = merchantStats[merchant.id] || { totalReviews: 0, positiveReviews: 0, avgRating: 0, totalSpins: 0 };
              const isExpanded = selectedMerchant === merchant.id;

              return (
                <div key={merchant.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-600 to-teal-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-lg">
                          {merchant.business_name?.[0]?.toUpperCase() || 'M'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{merchant.business_name}</h3>
                          <Badge className="capitalize">{merchant.subscription_tier}</Badge>
                          {merchant.is_active !== false ? (
                            <Badge className="bg-teal-100 text-teal-700">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{merchant.email}</p>
                        
                        {/* Stats Grid */}
                        <div className="grid grid-cols-4 gap-4 mb-3">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-600">Reviews</p>
                            <p className="text-lg font-bold text-gray-900">{stats.totalReviews}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-600">Positive</p>
                            <p className="text-lg font-bold text-teal-600">{stats.positiveReviews}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-600">Avg Rating</p>
                            <p className="text-lg font-bold text-gray-900">{stats.avgRating} ⭐</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-600">Spins</p>
                            <p className="text-lg font-bold text-purple-600">{stats.totalSpins}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyRateLink(merchant.id)}
                            className="gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Copy Link
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadQRCode(merchant.id, merchant.business_name)}
                            className="gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download QR
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/rate/${merchant.id}`, '_blank')}
                            className="gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View Page
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedMerchant(isExpanded ? null : merchant.id)}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            {isExpanded ? 'Hide' : 'Details'}
                          </Button>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
                            <div>
                              <p className="text-xs font-semibold text-gray-600">Merchant ID</p>
                              <code className="text-xs text-gray-900 font-mono">{merchant.id}</code>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-600">Rate Link</p>
                              <code className="text-xs text-gray-900 font-mono break-all">
                                {process.env.NEXT_PUBLIC_APP_URL}/rate/{merchant.id}
                              </code>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-600">Inscription</p>
                              <p className="text-xs text-gray-900">
                                {new Date(merchant.created_at).toLocaleDateString('fr-FR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            {merchant.logo_url && (
                              <div>
                                <p className="text-xs font-semibold text-gray-600 mb-2">Logo</p>
                                <img src={merchant.logo_url} alt="Logo" className="h-16 object-contain" />
                              </div>
                            )}
                            {merchant.background_url && (
                              <div>
                                <p className="text-xs font-semibold text-gray-600 mb-2">Background</p>
                                <img src={merchant.background_url} alt="Background" className="h-24 w-auto object-cover rounded" />
                              </div>
                            )}
                            
                            {/* Social Media Links */}
                            <div className="border-t border-gray-200 pt-3 mt-3">
                              <p className="text-xs font-semibold text-gray-600 mb-2">Liens de Redirection</p>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-600">Stratégie:</span>
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {merchant.redirect_strategy?.replace('_', ' ') || 'none'}
                                  </Badge>
                                </div>
                                {merchant.google_maps_url && (
                                  <div>
                                    <span className="text-xs text-gray-600">Google Maps:</span>
                                    <a href={merchant.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 hover:underline block truncate">
                                      {merchant.google_maps_url}
                                    </a>
                                  </div>
                                )}
                                {merchant.tripadvisor_url && (
                                  <div>
                                    <span className="text-xs text-gray-600">TripAdvisor:</span>
                                    <a href={merchant.tripadvisor_url} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 hover:underline block truncate">
                                      {merchant.tripadvisor_url}
                                    </a>
                                  </div>
                                )}
                                {merchant.tiktok_url && (
                                  <div>
                                    <span className="text-xs text-gray-600">TikTok:</span>
                                    <a href={merchant.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 hover:underline block truncate">
                                      {merchant.tiktok_url}
                                    </a>
                                  </div>
                                )}
                                {merchant.instagram_url && (
                                  <div>
                                    <span className="text-xs text-gray-600">Instagram:</span>
                                    <a href={merchant.instagram_url} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 hover:underline block truncate">
                                      {merchant.instagram_url}
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredMerchants.length === 0 && (
              <div className="p-12 text-center">
                <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucun marchand trouvé</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
