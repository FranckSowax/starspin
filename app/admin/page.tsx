'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
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
  Eye,
  Copy,
  CheckCircle2,
  XCircle,
  LayoutDashboard,
  Filter,
  Calendar,
  RotateCw
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
  couponsRedeemed?: number;
}

interface AuthUser {
  id: string;
  email?: string;
}

interface MerchantWithStats extends Merchant {
  stats: MerchantStats;
}

interface ApiResponse {
  merchants: MerchantWithStats[];
  globalStats: {
    totalMerchants: number;
    activeMerchants: number;
    totalReviews: number;
    totalSpins: number;
    totalCouponsRedeemed: number;
  };
}

type TierPricing = {
  [key: string]: number;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [filteredMerchants, setFilteredMerchants] = useState<Merchant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalMerchants: 0,
    activeMerchants: 0,
    totalReviews: 0,
    totalRevenue: 0,
    totalSpins: 0,
  });

  // Estimated monthly revenue per tier
  const TIER_PRICING: TierPricing = {
    'free': 0,
    'starter': 0, // Essai Gratuit (Découverte)
    'premium': 1000, // Pro Plan
  };

  const [selectedMerchant, setSelectedMerchant] = useState<string | null>(null);
  const [merchantStats, setMerchantStats] = useState<Record<string, MerchantStats>>({});
  const [activeSection, setActiveSection] = useState<'dashboard' | 'merchants'>('dashboard');
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [tierFilter, setTierFilter] = useState<'all' | 'starter' | 'premium'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    await loadMerchants();
    setLastUpdated(new Date());
    setIsRefreshing(false);
  };

  useEffect(() => {
    checkAdminAuth();
    
    // Set up real-time refresh every 30 seconds
    const interval = setInterval(() => {
      if (user) {
        loadMerchants();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    let filtered = merchants;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(m => 
        m.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(m => 
        statusFilter === 'active' ? m.is_active !== false : m.is_active === false
      );
    }

    // Tier filter
    if (tierFilter !== 'all') {
      filtered = filtered.filter(m => m.subscription_tier === tierFilter);
    }

    setFilteredMerchants(filtered);
  }, [searchQuery, merchants, statusFilter, tierFilter]);

  const checkAdminAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Admin authorization check
    // The middleware already validates admin access, but we double-check here
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
    const userEmail = user.email?.toLowerCase();

    if (adminEmails.length > 0 && (!userEmail || !adminEmails.includes(userEmail))) {
      console.warn('Unauthorized admin access attempt');
      router.push('/dashboard');
      return;
    }

    setUser(user);
    await loadMerchants();
    setLoading(false);
  };

  const loadMerchants = async () => {
    try {
      setError(null);
      // Get session for authorization header
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No session found');
        setError('Session non trouvée. Veuillez vous reconnecter.');
        return;
      }

      // Use admin API to fetch all merchants (bypasses RLS)
      const response = await fetch('/api/admin/merchants', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur API: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (data.merchants) {
        setMerchants(data.merchants);
        setFilteredMerchants(data.merchants);

        // Build stats map from API response
        const statsMap: Record<string, MerchantStats> = {};
        data.merchants.forEach((merchant: MerchantWithStats) => {
          statsMap[merchant.id] = merchant.stats;
        });
        setMerchantStats(statsMap);

        // Calculate revenue
        const totalRevenue = data.merchants.reduce((sum: number, m: MerchantWithStats) => {
          if (m.is_active === false) return sum;
          const tier = m.subscription_tier?.toLowerCase() || 'free';
          const price = TIER_PRICING[tier] || 0;
          return sum + price;
        }, 0);

        setStats({
          totalMerchants: data.globalStats.totalMerchants,
          activeMerchants: data.globalStats.activeMerchants,
          totalReviews: data.globalStats.totalReviews,
          totalRevenue,
          totalSpins: data.globalStats.totalSpins,
        });
        
        setLastUpdated(new Date());
      }
    } catch (error: unknown) {
      const err = error as Error;
      setError(err.message || 'Impossible de charger les données marchands');
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

  const generateAndSaveQRCode = async (merchantId: string, businessName: string) => {
    try {
      const url = `${process.env.NEXT_PUBLIC_APP_URL}/rate/${merchantId}`;
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: {
          dark: '#2D6A4F',
          light: '#FFFFFF',
        },
      });

      // Convert data URL to blob
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      const file = new File([blob], `${merchantId}-qr.png`, { type: 'image/png' });

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('merchant-assets')
        .upload(`qr-codes/${merchantId}.png`, file, { 
          cacheControl: '3600',
          upsert: true 
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('merchant-assets')
        .getPublicUrl(`qr-codes/${merchantId}.png`);

      // Update merchant record with QR URL
      const { error: updateError } = await supabase
        .from('merchants')
        .update({ qr_code_url: publicUrl })
        .eq('id', merchantId);

      if (updateError) throw updateError;

      alert(`QR Code généré et enregistré pour ${businessName}!`);
      await loadMerchants(); // Reload to show updated data
    } catch (error: unknown) {
      const err = error as Error;
      alert(`Erreur: ${err.message}`);
    }
  };

  const copyRateLink = (merchantId: string) => {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/rate/${merchantId}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-slate-300">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900/50 border-r border-slate-700/50 backdrop-blur-xl flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex flex-col gap-2">
            <img 
              src="/LOGO-STARSPIN-WHITE_web.png" 
              alt="StarSpin Logo" 
              className="h-8 w-auto"
            />
            <p className="text-xs text-white">Admin Dashboard</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveSection('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeSection === 'dashboard'
                ? 'bg-purple-500/20 text-white border border-purple-500/30'
                : 'text-white hover:bg-slate-800/50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Tableau de Bord</span>
          </button>

          <button
            onClick={() => setActiveSection('merchants')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeSection === 'merchants'
                ? 'bg-purple-500/20 text-white border border-purple-500/30'
                : 'text-white hover:bg-slate-800/50'
            }`}
          >
            <Store className="w-5 h-5" />
            <span className="font-medium">Marchands</span>
          </button>
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t border-slate-700/50">
          <Button
            onClick={() => supabase.auth.signOut().then(() => router.push('/auth/login'))}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-slate-900/50 border-b border-slate-700/50 backdrop-blur-xl">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {activeSection === 'dashboard' ? 'Tableau de Bord' : 'Gestion des Marchands'}
                </h2>
                <p className="text-slate-200 text-sm mt-0.5">
                  {activeSection === 'dashboard' 
                    ? 'Statistiques et analytics' 
                    : 'Liste et gestion des marchands'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {lastUpdated && (
                  <span className="text-xs text-slate-300">
                    Mis à jour: {lastUpdated.toLocaleTimeString('fr-FR')}
                  </span>
                )}
                <Button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="gap-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border-purple-500/30"
                >
                  <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Actualisation...' : 'Actualiser'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
        {/* Dashboard Section */}
        {activeSection === 'dashboard' && (
          <>
            {/* Time Range Selector */}
            <div className="flex gap-2 mb-6">
              <Button
                onClick={() => setTimeRange('day')}
                className={`gap-2 ${
                  timeRange === 'day'
                    ? 'bg-purple-500/20 text-white border-purple-500/30'
                    : 'bg-slate-800 text-white border-slate-700'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Jour
              </Button>
              <Button
                onClick={() => setTimeRange('week')}
                className={`gap-2 ${
                  timeRange === 'week'
                    ? 'bg-purple-500/20 text-white border-purple-500/30'
                    : 'bg-slate-800 text-white border-slate-700'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Semaine
              </Button>
              <Button
                onClick={() => setTimeRange('month')}
                className={`gap-2 ${
                  timeRange === 'month'
                    ? 'bg-purple-500/20 text-white border-purple-500/30'
                    : 'bg-slate-800 text-white border-slate-700'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Mois
              </Button>
            </div>

            {/* Global Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-purple-500/20 rounded-xl">
                  <Store className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex items-center gap-1 text-green-400 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-semibold">+12%</span>
                </div>
              </div>
              <p className="text-slate-200 text-sm mb-2">Total Marchands</p>
              <p className="text-4xl font-bold text-white mb-1">{stats.totalMerchants}</p>
              <p className="text-xs text-slate-300">{stats.activeMerchants} actifs</p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-blue-500/20 rounded-xl">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex items-center gap-1 text-green-400 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-semibold">+8%</span>
                </div>
              </div>
              <p className="text-slate-200 text-sm mb-2">Total Reviews</p>
              <p className="text-4xl font-bold text-white mb-1">{stats.totalReviews}</p>
              <p className="text-xs text-slate-300">Tous marchands</p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-emerald-500/20 rounded-xl">
                  <DollarSign className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex items-center gap-1 text-green-400 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-semibold">+15%</span>
                </div>
              </div>
              <p className="text-slate-200 text-sm mb-2">Revenue Estimé (MRR)</p>
              <p className="text-4xl font-bold text-white mb-1">{stats.totalRevenue.toFixed(0)}฿</p>
              <p className="text-xs text-slate-300">Basé sur abonnements</p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-pink-500/20 rounded-xl">
                  <RotateCw className="w-6 h-6 text-pink-400" />
                </div>
                <div className="flex items-center gap-1 text-green-400 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-semibold">+5%</span>
                </div>
              </div>
              <p className="text-slate-200 text-sm mb-2">Total Spins</p>
              <p className="text-4xl font-bold text-white mb-1">{stats.totalSpins}</p>
              <p className="text-xs text-slate-300">Tours de roue totaux</p>
            </div>
          </div>
        </div>

          </>
        )}

        {/* Merchants Section */}
        {activeSection === 'merchants' && (
          <>
            {/* Filters */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 mb-6 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-slate-300" />
                <span className="text-sm font-semibold text-slate-200">Filtres</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actifs</option>
                  <option value="inactive">Inactifs</option>
                </select>

                {/* Tier Filter */}
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value as any)}
                  className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">Tous les plans</option>
                  <option value="starter">Starter</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
            </div>

            {/* Merchants List */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="p-6 border-b border-slate-700/50">
            <h2 className="text-xl font-bold text-white">Liste des Marchands</h2>
            <p className="text-sm text-slate-300 mt-1">{filteredMerchants.length} marchands trouvés</p>
          </div>
          <div className="divide-y divide-slate-700/50">
            {filteredMerchants.map((merchant) => {
              const stats = merchantStats[merchant.id] || { totalReviews: 0, positiveReviews: 0, avgRating: 0, totalSpins: 0 };
              const isExpanded = selectedMerchant === merchant.id;

              return (
                <div key={merchant.id} className="p-6 hover:bg-slate-700/30 transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20">
                        <span className="text-white font-bold text-lg">
                          {merchant.business_name?.[0]?.toUpperCase() || 'M'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{merchant.business_name}</h3>
                          <Badge className="capitalize bg-slate-700 text-slate-200 border-slate-600">{merchant.subscription_tier}</Badge>
                          {merchant.is_active !== false ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-300 mb-3">{merchant.email}</p>
                        
                        {/* Stats Grid */}
                        <div className="grid grid-cols-4 gap-3 mb-4">
                          <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
                            <p className="text-xs text-slate-300">Reviews</p>
                            <p className="text-lg font-bold text-white">{stats.totalReviews}</p>
                          </div>
                          <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
                            <p className="text-xs text-slate-300">Positive</p>
                            <p className="text-lg font-bold text-emerald-400">{stats.positiveReviews}</p>
                          </div>
                          <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
                            <p className="text-xs text-slate-300">Avg Rating</p>
                            <p className="text-lg font-bold text-white">{stats.avgRating} ⭐</p>
                          </div>
                          <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
                            <p className="text-xs text-slate-300">Spins</p>
                            <p className="text-lg font-bold text-purple-400">{stats.totalSpins}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => copyRateLink(merchant.id)}
                            className="gap-2 bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
                          >
                            <Copy className="w-4 h-4" />
                            Copy Link
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => downloadQRCode(merchant.id, merchant.business_name)}
                            className="gap-2 bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
                          >
                            <Download className="w-4 h-4" />
                            Download QR
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => generateAndSaveQRCode(merchant.id, merchant.business_name)}
                            className="gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/30"
                          >
                            <QrCode className="w-4 h-4" />
                            Générer QR
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => window.open(`/rate/${merchant.id}`, '_blank')}
                            className="gap-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border-purple-500/30"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View Page
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setSelectedMerchant(isExpanded ? null : merchant.id)}
                            className="gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-blue-500/30"
                          >
                            <Eye className="w-4 h-4" />
                            {isExpanded ? 'Hide' : 'Details'}
                          </Button>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 space-y-3">
                            <div>
                              <p className="text-xs font-semibold text-slate-200 mb-1">Merchant ID</p>
                              <code className="text-xs text-white font-mono bg-slate-800 px-2 py-1 rounded">{merchant.id}</code>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-200 mb-1">Rate Link</p>
                              <code className="text-xs text-white font-mono break-all bg-slate-800 px-2 py-1 rounded block">
                                {process.env.NEXT_PUBLIC_APP_URL}/rate/{merchant.id}
                              </code>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-200 mb-1">Inscription</p>
                              <p className="text-xs text-white">
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
                                <p className="text-xs font-semibold text-slate-200 mb-2">Logo</p>
                                <div className="bg-slate-800 p-2 rounded-lg inline-block">
                                  <img src={merchant.logo_url} alt="Logo" className="h-16 object-contain" />
                                </div>
                              </div>
                            )}
                            {merchant.background_url && (
                              <div>
                                <p className="text-xs font-semibold text-slate-200 mb-2">Background</p>
                                <img src={merchant.background_url} alt="Background" className="h-24 w-auto object-cover rounded-lg border border-slate-700" />
                              </div>
                            )}
                            
                            {/* Social Media Links */}
                            <div className="border-t border-slate-700/50 pt-3 mt-3">
                              <p className="text-xs font-semibold text-slate-200 mb-2">Liens de Redirection</p>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-slate-300">Stratégie:</span>
                                  <Badge className="text-xs capitalize bg-purple-500/20 text-purple-400 border-purple-500/30">
                                    {merchant.redirect_strategy?.replace('_', ' ') || 'none'}
                                  </Badge>
                                </div>
                                {merchant.google_maps_url && (
                                  <div className="bg-slate-800/50 p-2 rounded">
                                    <span className="text-xs text-slate-300 block mb-1">Google Reviews:</span>
                                    <a href={merchant.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 block truncate">
                                      {merchant.google_maps_url}
                                    </a>
                                  </div>
                                )}
                                {merchant.tripadvisor_url && (
                                  <div className="bg-slate-800/50 p-2 rounded">
                                    <span className="text-xs text-slate-300 block mb-1">TripAdvisor:</span>
                                    <a href={merchant.tripadvisor_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 block truncate">
                                      {merchant.tripadvisor_url}
                                    </a>
                                  </div>
                                )}
                                {merchant.tiktok_url && (
                                  <div className="bg-slate-800/50 p-2 rounded">
                                    <span className="text-xs text-slate-300 block mb-1">TikTok:</span>
                                    <a href={merchant.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 block truncate">
                                      {merchant.tiktok_url}
                                    </a>
                                  </div>
                                )}
                                {merchant.instagram_url && (
                                  <div className="bg-slate-800/50 p-2 rounded">
                                    <span className="text-xs text-slate-300 block mb-1">Instagram:</span>
                                    <a href={merchant.instagram_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 block truncate">
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
                <Store className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-200">Aucun marchand trouvé</p>
              </div>
            )}
          </div>
        </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
