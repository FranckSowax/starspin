'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Calendar, Download, ArrowUpRight } from 'lucide-react';

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Subscription</h1>
          <p className="text-gray-600">Manage your subscription and billing information</p>
        </div>

        {/* Current Plan */}
        <Card className="p-6 bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <Badge className="mb-2 bg-teal-600">Current Plan</Badge>
              <h2 className="text-2xl font-bold text-gray-900 capitalize">
                {merchant.subscription_tier || 'Free'} Plan
              </h2>
              <p className="text-gray-600 mt-1">Perfect for getting started</p>
            </div>
            <Button className="bg-teal-600 hover:bg-teal-700">
              Upgrade Plan
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div>
              <p className="text-sm text-gray-600">Monthly Reviews</p>
              <p className="text-2xl font-bold text-gray-900">Unlimited</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">QR Codes</p>
              <p className="text-2xl font-bold text-gray-900">1</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Support</p>
              <p className="text-2xl font-bold text-gray-900">Email</p>
            </div>
          </div>
        </Card>

        {/* Payment Method */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">No payment method</p>
                <p className="text-sm text-gray-500">Add a payment method to upgrade</p>
              </div>
            </div>
            <Button variant="outline">Add Card</Button>
          </div>
        </Card>

        {/* Billing History */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Billing History</h3>
            <Button variant="ghost" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download All
            </Button>
          </div>
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No billing history yet</p>
            <p className="text-sm text-gray-400 mt-1">Your invoices will appear here</p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
