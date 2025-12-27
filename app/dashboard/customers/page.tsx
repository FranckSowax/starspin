'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, Star, MessageSquare } from 'lucide-react';

export default function CustomersPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [merchant, setMerchant] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);

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

      // Group by user_token to get unique customers
      const uniqueCustomers = feedbackData?.reduce((acc: any[], feedback) => {
        const existing = acc.find(c => c.user_token === feedback.user_token);
        if (!existing) {
          acc.push({
            user_token: feedback.user_token,
            first_visit: feedback.created_at,
            total_reviews: 1,
            avg_rating: feedback.rating,
            last_review: feedback.created_at,
            is_positive: feedback.is_positive
          });
        } else {
          existing.total_reviews += 1;
          existing.avg_rating = (existing.avg_rating + feedback.rating) / 2;
          existing.last_review = feedback.created_at;
        }
        return acc;
      }, []) || [];

      setCustomers(uniqueCustomers);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customers</h1>
          <p className="text-gray-600">View and manage your customer interactions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-teal-50 rounded-lg">
                <Users className="w-5 h-5 text-teal-600" />
              </div>
              <p className="text-sm text-gray-600">Total Customers</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{customers.length}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-sm text-gray-600">Returning Customers</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {customers.filter(c => c.total_reviews > 1).length}
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Star className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600">Avg Reviews/Customer</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {customers.length > 0 
                ? (customers.reduce((sum, c) => sum + c.total_reviews, 0) / customers.length).toFixed(1)
                : '0'
              }
            </p>
          </Card>
        </div>

        {/* Customer List */}
        <Card>
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Customer List</h3>
          </div>
          <div className="divide-y">
            {customers.length > 0 ? (
              customers.map((customer, index) => (
                <div key={customer.user_token} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-600 to-teal-700 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {String.fromCharCode(65 + (index % 26))}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Customer #{index + 1}</p>
                        <p className="text-sm text-gray-500">
                          First visit: {new Date(customer.first_visit).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Reviews</p>
                        <p className="font-semibold text-gray-900">{customer.total_reviews}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Avg Rating</p>
                        <p className="font-semibold text-gray-900">{customer.avg_rating.toFixed(1)} ⭐</p>
                      </div>
                      <Badge className={customer.is_positive 
                        ? 'bg-teal-100 text-teal-700 border-teal-200' 
                        : 'bg-orange-100 text-orange-700 border-orange-200'
                      }>
                        {customer.is_positive ? 'Positive' : 'Neutral'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No customers yet</p>
                <p className="text-sm text-gray-400 mt-1">Start collecting reviews to see your customers here</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
