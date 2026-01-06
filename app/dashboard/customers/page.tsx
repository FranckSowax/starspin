'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, Star, Search, Mail, Calendar, Filter, Phone, MessageCircle, X, ExternalLink } from 'lucide-react';

interface Customer {
  user_token: string;
  email: string | null;
  phone: string | null;
  first_visit: string;
  total_reviews: number;
  avg_rating: number;
  last_review: string;
  is_positive: boolean;
  feedbacks: any[];
}

interface CustomerDetailsModalProps {
  customer: Customer | null;
  onClose: () => void;
}

// Modal de détails client
function CustomerDetailsModal({ customer, onClose }: CustomerDetailsModalProps) {
  if (!customer) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg ${
                customer.email || customer.phone
                  ? 'bg-white text-teal-600'
                  : 'bg-teal-500 text-white'
              }`}>
                {customer.email ? customer.email[0].toUpperCase() : customer.phone ? '📱' : '?'}
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {customer.email || customer.phone || 'Client Anonyme'}
                </h2>
                <p className="text-teal-100 text-sm font-mono">
                  ID: {customer.user_token.substring(0, 12)}...
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 p-6 bg-slate-50 border-b border-slate-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">{customer.total_reviews}</p>
            <p className="text-sm text-slate-500">Avis Total</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <p className="text-2xl font-bold text-slate-900">{customer.avg_rating.toFixed(1)}</p>
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            <p className="text-sm text-slate-500">Note Moyenne</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">
              {customer.total_reviews > 1 ? 'Habitué' : 'Nouveau'}
            </p>
            <p className="text-sm text-slate-500">Statut</p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Coordonnées</h3>
          <div className="space-y-2">
            {customer.email && (
              <div className="flex items-center gap-3 text-slate-700">
                <Mail className="w-5 h-5 text-slate-400" />
                <span>{customer.email}</span>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-3 text-slate-700">
                <Phone className="w-5 h-5 text-green-500" />
                <span>{customer.phone}</span>
                <a
                  href={`https://wa.me/${customer.phone.replace(/^\+/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-green-600 hover:text-green-700 flex items-center gap-1 text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
            {!customer.email && !customer.phone && (
              <p className="text-slate-400 italic">Aucune coordonnée disponible</p>
            )}
          </div>
        </div>

        {/* Feedbacks List */}
        <div className="p-6 max-h-[300px] overflow-y-auto">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Historique des Avis ({customer.feedbacks.length})
          </h3>
          <div className="space-y-3">
            {customer.feedbacks.map((feedback, index) => (
              <div
                key={feedback.id || index}
                className="p-4 bg-slate-50 rounded-xl border border-slate-100"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= feedback.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(feedback.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {feedback.comment && (
                  <p className="text-sm text-slate-600">{feedback.comment}</p>
                )}
                {!feedback.comment && (
                  <p className="text-sm text-slate-400 italic">Pas de commentaire</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <Button onClick={onClose} variant="outline">
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [merchant, setMerchant] = useState<any>(null);
  const [webCustomers, setWebCustomers] = useState<Customer[]>([]);
  const [whatsappCustomers, setWhatsappCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'web' | 'whatsapp'>('web');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

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

      // Fetch customer feedback
      const { data: feedbackData } = await supabase
        .from('feedback')
        .select('*')
        .eq('merchant_id', user.id)
        .order('created_at', { ascending: false });

      // Separate customers by workflow type (email vs phone)
      const webCustomersMap = new Map<string, Customer>();
      const whatsappCustomersMap = new Map<string, Customer>();

      feedbackData?.forEach((feedback) => {
        const hasEmail = feedback.customer_email;
        const hasPhone = feedback.customer_phone;
        const map = hasPhone ? whatsappCustomersMap : webCustomersMap;
        const key = feedback.user_token;

        const existing = map.get(key);
        if (!existing) {
          map.set(key, {
            user_token: feedback.user_token,
            email: feedback.customer_email || null,
            phone: feedback.customer_phone || null,
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
          if (!existing.email && feedback.customer_email) {
            existing.email = feedback.customer_email;
          }
          if (!existing.phone && feedback.customer_phone) {
            existing.phone = feedback.customer_phone;
          }
          if (new Date(feedback.created_at) > new Date(existing.last_review)) {
            existing.last_review = feedback.created_at;
          }
          existing.feedbacks.push(feedback);
        }
      });

      setWebCustomers(Array.from(webCustomersMap.values()));
      setWhatsappCustomers(Array.from(whatsappCustomersMap.values()));
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  // Update filtered customers when tab or search changes
  useEffect(() => {
    const customers = activeTab === 'web' ? webCustomers : whatsappCustomers;

    if (searchQuery.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = customers.filter(c => {
        if (activeTab === 'web') {
          return (c.email && c.email.toLowerCase().includes(query)) ||
                 c.user_token.toLowerCase().includes(query);
        } else {
          return (c.phone && c.phone.includes(query)) ||
                 c.user_token.toLowerCase().includes(query);
        }
      });
      setFilteredCustomers(filtered);
    }
  }, [searchQuery, activeTab, webCustomers, whatsappCustomers]);

  const totalCustomers = webCustomers.length + whatsappCustomers.length;
  const totalEmails = webCustomers.filter(c => c.email).length;
  const totalPhones = whatsappCustomers.filter(c => c.phone).length;

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Clients Totaux</p>
                <h3 className="text-2xl font-bold text-slate-900">{totalCustomers}</h3>
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
                <h3 className="text-2xl font-bold text-slate-900">{totalEmails}</h3>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-green-50 rounded-xl text-green-600">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">WhatsApp Collectés</p>
                <h3 className="text-2xl font-bold text-slate-900">{totalPhones}</h3>
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
                  {totalCustomers > 0
                    ? (([...webCustomers, ...whatsappCustomers].reduce((sum, c) => sum + c.total_reviews, 0)) / totalCustomers).toFixed(1)
                    : '0'
                  }
                </h3>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200">
          <button
            onClick={() => { setActiveTab('web'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-all border-b-2 -mb-px ${
              activeTab === 'web'
                ? 'text-teal-600 border-teal-600 bg-teal-50/50'
                : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Mail className="w-4 h-4" />
            Workflow Web
            <Badge variant="secondary" className="ml-1">{webCustomers.length}</Badge>
          </button>
          <button
            onClick={() => { setActiveTab('whatsapp'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-all border-b-2 -mb-px ${
              activeTab === 'whatsapp'
                ? 'text-green-600 border-green-600 bg-green-50/50'
                : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Workflow WhatsApp
            <Badge variant="secondary" className="ml-1">{whatsappCustomers.length}</Badge>
          </button>
        </div>

        {/* Search and Filter Bar */}
        <Card className="p-4 border-slate-100 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={activeTab === 'web' ? 'Rechercher par email...' : 'Rechercher par numéro WhatsApp...'}
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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {activeTab === 'web' ? 'Email' : 'WhatsApp'}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Note Moyenne</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Avis</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Dernière Visite</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.user_token} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                            activeTab === 'web'
                              ? customer.email
                                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                                : 'bg-slate-100 text-slate-500'
                              : customer.phone
                                ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-500'
                          }`}>
                            {activeTab === 'web'
                              ? (customer.email ? customer.email[0].toUpperCase() : '?')
                              : (customer.phone ? '📱' : '?')
                            }
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {activeTab === 'web'
                                ? (customer.email || 'Client Anonyme')
                                : (customer.phone || 'Client Anonyme')
                              }
                            </p>
                            <p className="text-xs text-slate-500 font-mono">
                              ID: {customer.user_token.substring(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {activeTab === 'web' ? (
                          customer.email ? (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Mail className="w-4 h-4 text-slate-400" />
                              {customer.email}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )
                        ) : (
                          customer.phone ? (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Phone className="w-4 h-4 text-green-500" />
                              {customer.phone}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )
                        )}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          Détails
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        {activeTab === 'web' ? (
                          <Mail className="w-12 h-12 text-slate-300 mb-3" />
                        ) : (
                          <MessageCircle className="w-12 h-12 text-slate-300 mb-3" />
                        )}
                        <p className="text-lg font-medium text-slate-900">
                          {searchQuery
                            ? 'Aucun client trouvé pour cette recherche'
                            : `Aucun client ${activeTab === 'web' ? 'Web' : 'WhatsApp'} trouvé`
                          }
                        </p>
                        <p className="text-sm">
                          {searchQuery
                            ? 'Essayez une autre recherche'
                            : `Les clients du workflow ${activeTab === 'web' ? 'Web (email)' : 'WhatsApp'} apparaîtront ici.`
                          }
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </DashboardLayout>
  );
}
