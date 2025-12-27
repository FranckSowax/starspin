'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, Star, Search, Mail, Calendar, Filter } from 'lucide-react';

export default function CustomersPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [merchant, setMerchant] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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

      // Fetch customer feedback with email
      const { data: feedbackData } = await supabase
        .from('feedback')
        .select('*')
        .eq('merchant_id', user.id)
        .order('created_at', { ascending: false });

      // Group by user_token to get unique customers
      const uniqueCustomers = feedbackData?.reduce((acc: any[], feedback) => {
        const existing = acc.find((c: any) => c.user_token === feedback.user_token);
        if (!existing) {
          acc.push({
            user_token: feedback.user_token,
            email: feedback.customer_email || null,
            first_visit: feedback.created_at,
            total_reviews: 1,
            avg_rating: feedback.rating,
            last_review: feedback.created_at,
            is_positive: feedback.is_positive,
            feedbacks: [feedback]
          });
        } else {
          existing.total_reviews += 1;
          existing.avg_rating = (existing.avg_rating * (existing.total_reviews - 1) + feedback.rating) / existing.total_reviews;
          // Keep the most recent email if available
          if (!existing.email && feedback.customer_email) {
            existing.email = feedback.customer_email;
          }
          if (new Date(feedback.created_at) > new Date(existing.last_review)) {
            existing.last_review = feedback.created_at;
          }
          existing.feedbacks.push(feedback);
        }
        return acc;
      }, []) || [];

      setCustomers(uniqueCustomers);
      setFilteredCustomers(uniqueCustomers);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = customers.filter(c => 
        (c.email && c.email.toLowerCase().includes(query)) ||
        c.user_token.toLowerCase().includes(query)
      );
      setFilteredCustomers(filtered);
    }
  }, [searchQuery, customers]);

  if (loading || !user || !merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-slate-600">Chargement de vos clients...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout merchant={merchant}>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Clients</h1>
            <p className="text-slate-500 mt-1">Gérez votre base de données clients et leurs interactions</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Exporter CSV
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Clients Totaux</p>
                <h3 className="text-2xl font-bold text-slate-900">{customers.length}</h3>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Emails Collectés</p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {customers.filter(c => c.email).length}
                </h3>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Avis Moyen/Client</p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {customers.length > 0 
                    ? (customers.reduce((sum, c) => sum + c.total_reviews, 0) / customers.length).toFixed(1)
                    : '0'
                  }
                </h3>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filter Bar */}
        <Card className="p-4 border-slate-100 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
            <Button variant="outline" className="gap-2 text-slate-600">
              <Filter className="w-4 h-4" />
              Filtres
            </Button>
          </div>
        </Card>

        {/* Customer List Table */}
        <Card className="border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Note Moyenne</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Avis</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Dernière Visite</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer, index) => (
                    <tr key={customer.user_token} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                            customer.email 
                              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' 
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {customer.email ? customer.email[0].toUpperCase() : '?'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {customer.email || 'Client Anonyme'}
                            </p>
                            <p className="text-xs text-slate-500 font-mono">
                              ID: {customer.user_token.substring(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {customer.total_reviews > 1 ? (
                          <Badge className="bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-100">
                            Habitué
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200">
                            Nouveau
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-slate-900">{customer.avg_rating.toFixed(1)}</span>
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-600">{customer.total_reviews} avis</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Calendar className="w-4 h-4" />
                          {new Date(customer.last_review).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-900">
                          Détails
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <Users className="w-12 h-12 text-slate-300 mb-3" />
                        <p className="text-lg font-medium text-slate-900">Aucun client trouvé</p>
                        <p className="text-sm">Vos clients apparaîtront ici une fois qu'ils auront laissé un avis.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
