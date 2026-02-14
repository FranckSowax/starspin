'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Calendar, Download, ArrowUpRight, Zap, Shield, Star } from 'lucide-react';

export default function BillingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [merchant, setMerchant] = useState<any>(null);

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
    };

    checkAuth();
  }, [router]);

  if (!user || !merchant) {
    return (
      <DashboardLayout merchant={merchant}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout merchant={merchant}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            Billing & Subscription
          </h1>
          <p className="text-gray-500 mt-1 ml-[52px]">Manage your subscription and billing information</p>
        </div>

        {/* Current Plan - Hero Card */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 transition-all duration-300 hover:border-gray-300 hover:shadow-md">
          <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 to-emerald-500" />
          <div className="bg-gradient-to-br from-teal-50/80 to-emerald-50/80 p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <Badge className="mb-3 bg-teal-600 hover:bg-teal-700 text-white">Current Plan</Badge>
                <h2 className="text-2xl font-bold text-gray-900 capitalize">
                  {merchant.subscription_tier || 'Free'} Plan
                </h2>
                <p className="text-gray-500 mt-1 text-sm">Perfect for getting started</p>
              </div>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                <Zap className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              {[
                { label: 'Monthly Reviews', value: 'Unlimited', icon: Star },
                { label: 'QR Codes', value: '1', icon: CreditCard },
                { label: 'Support', value: 'Email', icon: Shield },
              ].map((item, i) => (
                <div key={i} className="bg-white/70 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <item.icon className="w-4 h-4 text-teal-600" />
                    <p className="text-xs text-gray-500">{item.label}</p>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Method & Billing History - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Method */}
          <div className="group relative p-6 border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-300 hover:shadow-md bg-white">
            <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 to-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900">Payment Method</h3>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-emerald-600 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">No payment method</p>
                  <p className="text-xs text-gray-500">Add a payment method to upgrade</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="text-sm">
                Add Card
              </Button>
            </div>
          </div>

          {/* Billing History */}
          <div className="group relative p-6 border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-300 hover:shadow-md bg-white">
            <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 to-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900">Billing History</h3>
              </div>
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 text-xs">
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Download All
              </Button>
            </div>
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No billing history yet</p>
              <p className="text-xs text-gray-400 mt-1">Your invoices will appear here</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
